import { expect, openTable, test, VERSION } from './fixtures.ts';

test('scrolls to and marks the row a #slug names', async ({ page }) => {
  await openTable(page, '/#grep-glob-tools-hidden-on-native-builds');
  const row = page.locator('#grep-glob-tools-hidden-on-native-builds');
  await expect(row).toHaveClass(/jump-target/);
  await expect(row).toBeInViewport();
});

test('clears a search that hides the row a #slug names', async ({ page }) => {
  await openTable(page);
  await page.locator('#q').fill('qqzxv-matches-nothing');
  await expect(page.locator('#rows tr:not([hidden])')).toHaveCount(0);
  await expect(page.locator('[data-testid="empty"]')).toBeVisible();
  await expect(page.locator('#amber-creek')).toBeHidden();
  await page.evaluate(() => {
    location.hash = 'amber-creek';
  });
  await expect(page.locator('#q')).toHaveValue('');
  await expect(page.locator('#amber-creek')).toBeInViewport();
});

test('writes a selection into the export and the link, and reads it back', async ({ page }) => {
  await openTable(page);
  await page.locator('#amber-creek [data-control]').selectOption('on');
  await page.locator('#feedback-survey-config [data-control]').selectOption('on');
  const timeout = page.locator('#api-force-idle-timeout [data-control]');
  await timeout.fill('42');
  await timeout.press('Enter');

  await expect(page.locator('[data-testid="export-version"]')).toHaveText(VERSION);
  const envBlock = JSON.parse(await page.locator('[data-testid="export-env"]').innerText());
  expect(envBlock).toStrictEqual({ env: { API_FORCE_IDLE_TIMEOUT: '42', CLAUDE_CODE_NO_FLICKER: '1' } });
  await expect(page.locator('[data-testid="export-settings"]')).toHaveText('"feedbackSurveyRate": true');

  await expect(page).toHaveURL(/[?&]c=[A-Za-z0-9_-]+/);
  const link = page.url();
  await page.goto('about:blank');
  await openTable(page, link);
  await expect(page.locator('#amber-creek [data-control]')).toHaveValue('on');
  await expect(page.locator('#api-force-idle-timeout [data-control]')).toHaveValue('42');
  await expect(page.locator('[data-testid="export-env"]')).toContainText('"API_FORCE_IDLE_TIMEOUT": "42"');
});
