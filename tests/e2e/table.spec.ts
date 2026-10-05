import { changes, env, events, expect, gates, openTable, test, VERSION } from './fixtures.ts';

const rows = '#rows tr';

test('shows one row per gate, variable and change of the newest version', async ({ page }) => {
  await openTable(page);
  await expect(page.locator(`${rows}[data-kind="gate"]`)).toHaveCount(gates.length);
  await expect(page.locator(`${rows}[data-kind="env"]`)).toHaveCount(env.length);
  await expect(page.locator(`${rows}[data-kind="change"]`)).toHaveCount(changes.length);
  await expect(page.locator('[data-testid="counts"]')).toContainText(
    `${gates.length.toLocaleString('en-US')} gates, ${env.length.toLocaleString('en-US')} variables, ` +
      `${changes.length.toLocaleString('en-US')} changes and ${events.length.toLocaleString('en-US')} telemetry events in ${VERSION}.`,
  );
  await expect(page.locator('#version')).toHaveValue(VERSION);
});

test('keeps telemetry events out until the filter is ticked', async ({ page }) => {
  await openTable(page);
  await expect(page.locator('#events')).not.toBeChecked();
  await expect(page.locator(`${rows}[data-kind="event"]`)).toHaveCount(0);
  await page.locator('#events').check();
  await expect(page.locator(`${rows}[data-kind="event"]`)).toHaveCount(events.length);
});

test('puts a control on each overridable gate and greys the rest', async ({ page }) => {
  await openTable(page);
  const withOverride = gates.filter((g) => g.override !== null).length;
  await expect(page.locator(`${rows}[data-kind="gate"][data-grey="false"] [data-control]`)).toHaveCount(withOverride);
  await expect(page.locator(`${rows}[data-kind="gate"][data-grey="true"]`)).toHaveCount(gates.length - withOverride);
});

test('greys the host-describing and inert variables, each with its reason', async ({ page }) => {
  await openTable(page);
  const host = env.filter((r) => r.hostContext).length;
  const inert = env.filter((r) => r.inert !== null).length;
  const greyEnv = page.locator(`${rows}[data-kind="env"][data-grey="true"]`);
  await expect(greyEnv).toHaveCount(host + inert);
  await expect(
    greyEnv.filter({ hasText: 'This variable describes the machine Claude Code is running on.' }),
  ).toHaveCount(host);
  await expect(page.locator(`${rows}[data-kind="env"][data-grey="false"] [data-control]`)).toHaveCount(
    env.length - host - inert,
  );
});

test('greys every change row', async ({ page }) => {
  await openTable(page);
  await expect(page.locator(`${rows}[data-kind="change"][data-grey="true"]`)).toHaveCount(changes.length);
  await expect(page.locator(`${rows}[data-kind="change"] [data-control]`)).toHaveCount(0);
});

test('shows the Grep and Glob change grey with its three workarounds', async ({ page }) => {
  await openTable(page);
  const row = page.locator('#grep-glob-tools-hidden-on-native-builds');
  await expect(row).toHaveAttribute('data-grey', 'true');
  await expect(row.locator('[data-testid="reason"]')).toHaveText(
    'No switch. This changed in 2.1.117, and no gate decides it.',
  );
  await expect(row.locator('[data-testid="workarounds"] li')).toHaveCount(3);
});

test('finds the Grep and Glob row when grep is typed in the search box', async ({ page }) => {
  await openTable(page);
  await page.locator('#q').fill('grep');
  // The table filters a beat after typing, so the check waits for rows to drop out before it counts.
  await expect(page.locator(`${rows}[hidden]`)).not.toHaveCount(0);
  await expect(page.locator('#grep-glob-tools-hidden-on-native-builds')).toBeVisible();
  const visible = await page.locator(`${rows}:not([hidden])`).count();
  expect(visible).toBeGreaterThan(0);
  expect(visible).toBeLessThan(gates.length + env.length + changes.length);
  await expect(page.locator('[data-testid="shown"]')).toHaveText(` ${visible.toLocaleString('en-US')} shown.`);
});

test('opens a row evidence inline with its build and offset and no bytes of the binary', async ({ page }) => {
  await openTable(page);
  const gate = gates.find((g) => g.provenance.length === 1);
  const site = gate?.provenance[0];
  if (gate === undefined || site === undefined) throw new Error('the data holds no gate with one read site');
  const row = page.locator(`[id="${gate.slug}"]`);
  await row.locator('details summary').click();
  const evidence = row.locator('[data-testid="evidence"]');
  await expect(evidence).toContainText(
    `Claude Code ${site.version}, byte offset ${site.offset.toLocaleString('en-US')}`,
  );
  // The page publishes offsets only: no excerpt block, and no fetch of an excerpt file.
  await expect(evidence.locator('pre, code')).toHaveCount(0);
  await expect(evidence.locator('li')).toHaveCount(1);
});
