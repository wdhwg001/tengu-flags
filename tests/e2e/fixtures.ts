// What the checks compare the page against: the committed data, read the same way the page reads it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test as base, expect, type Page } from '@playwright/test';
import { changesFor } from '../../src/lib/versions.ts';
import { changeRow } from '../../src/schema/change.ts';
import { envRowSchema } from '../../src/schema/env.ts';
import { eventsFile, indexFile } from '../../src/schema/files.ts';
import { gateRowSchema } from '../../src/schema/gate.ts';

const DATA = join(import.meta.dirname, '..', '..', 'data');
const read = (path: string): unknown => JSON.parse(readFileSync(join(DATA, path), 'utf8'));

const index = indexFile.parse(read('index.json'));
const newest = index.versions.at(-1);
if (newest === undefined) throw new Error('data/index.json lists no version');
export const VERSION = newest.version;
export const gates = gateRowSchema(VERSION)
  .array()
  .parse(read(`versions/${VERSION}/gates.json`));
export const env = envRowSchema(VERSION)
  .array()
  .parse(read(`versions/${VERSION}/env.json`));
export const changes = changesFor(changeRow.array().parse(read('changes.json')), VERSION);
export const events = eventsFile.parse(read(`versions/${VERSION}/events.json`));

// Every check fails on an uncaught page error or a console error, so a broken page cannot pass by rendering little.
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
    });
    await use(page);
    expect(problems).toStrictEqual([]);
  },
});

// Waits on the row count rather than on one row being attached: under Playwright 1.63, a single-element
// assertion started while the page is still loading was seen to miss the rows once they mounted.
export async function openTable(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  await expect(page.locator('#rows tr')).not.toHaveCount(0);
}

export { expect };
