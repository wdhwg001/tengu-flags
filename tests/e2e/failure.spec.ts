import { expect, test } from '@playwright/test';

// A failed fetch logs a resource error by design, so these checks watch for page errors only.
test.beforeEach(({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
});

test('says so and renders no row when index.json does not load', async ({ page }) => {
  await page.route('**/data/index.json', (route) => route.fulfill({ status: 404, body: 'not here' }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('data/index.json did not load (HTTP 404).');
  await expect(page.locator('#rows tr')).toHaveCount(0);
});

test('names the file, row and field when a data file fails its schema', async ({ page }) => {
  await page.route('**/data/versions/*/gates.json', async (route) => {
    const rows: unknown = await (await route.fetch()).json();
    if (!Array.isArray(rows)) throw new Error('gates.json is not an array');
    Object.assign(rows[3], { cacheReach: 'sometimes' });
    await route.fulfill({ json: rows });
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText(/gates\.json: row 3: slug [a-z0-9-]+: field cacheReach: /);
  await expect(page.locator('#rows tr')).toHaveCount(0);
});
