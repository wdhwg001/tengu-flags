// The sample tree is left out of dist/, so these checks serve it to the built page from the repository's sample/.
import { join } from 'node:path';
import { expect, openTable, test } from './fixtures.ts';

const SAMPLE = join(import.meta.dirname, '..', '..', 'sample');

test.beforeEach(async ({ page }) => {
  await page.route('**/sample/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^.*\/sample\//, '');
    return route.fulfill({ path: join(SAMPLE, path) });
  });
});

test('opens the specimen gate and shows its prompt text, its drawn flowchart and its values sentence', async ({
  page,
}) => {
  await openTable(page, '/?dev=sample');
  const row = page.locator('#sample-zeta');
  await expect(row.locator('details summary')).toHaveText('What it does and where it was read');
  await row.locator('details summary').click();
  await expect(row.locator('[data-effect="prompt"] [data-testid="effect-text"]')).toHaveText(
    'Keep every answer about the sample panel under three short paragraphs, and name the card you mean.',
  );
  await expect(row.locator('[data-effect="prompt"] [data-testid="effect-text"]')).toBeVisible();
  await expect(row.locator('[data-testid="flowchart"] svg')).toBeVisible();
  await expect(row.locator('[data-testid="values"]')).toHaveText(
    'The served value picks forced, none or cohort, and only the cohort value reads the card count.',
  );
  await expect(row.locator('[data-effect]')).toHaveCount(5);
});

test('finds the specimen gate by a sentence it puts into a prompt', async ({ page }) => {
  await openTable(page, '/?dev=sample');
  await page.locator('#q').fill('under three short paragraphs');
  await expect(page.locator('#rows tr:not([hidden])')).toHaveCount(1);
  await expect(page.locator('#sample-zeta')).toBeVisible();
});

test('opens a gate with no effects onto its read sites alone', async ({ page }) => {
  await openTable(page, '/?dev=sample');
  const row = page.locator('#sample-alpha');
  await expect(row.locator('details summary')).toHaveText('Where it was read');
  await row.locator('details summary').click();
  await expect(row.locator('[data-testid="evidence"] li')).toHaveCount(1);
  await expect(row.locator('[data-testid="effects"], [data-testid="values"]')).toHaveCount(0);
});
