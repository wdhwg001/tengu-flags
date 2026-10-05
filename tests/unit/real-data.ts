// The committed data/ tree, parsed through the same schemas the validator and the page use.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { changeRow } from '../../src/schema/change.ts';
import { envRowSchema } from '../../src/schema/env.ts';
import { eventsFile, searchDoc } from '../../src/schema/files.ts';
import { gateRowSchema } from '../../src/schema/gate.ts';
import { formatViolation, parseFile, parseRows } from '../../src/schema/parse.ts';

export const DATA = join(import.meta.dirname, '..', '..', 'data');
export const VERSION = '2.1.287';

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(join(DATA, path), 'utf8'));
}

function rows<T>(path: string, schema: z.ZodType<T>): T[] {
  const parsed = parseRows(path, schema, readJson(path));
  if (!parsed.ok) throw new Error(formatViolation(parsed.violation));
  return parsed.value;
}

export const gates = rows(`versions/${VERSION}/gates.json`, gateRowSchema(VERSION));
export const env = rows(`versions/${VERSION}/env.json`, envRowSchema(VERSION));
export const changes = rows('changes.json', changeRow);
const parsedEvents = parseFile('events.json', eventsFile, readJson(`versions/${VERSION}/events.json`));
if (!parsedEvents.ok) throw new Error(formatViolation(parsedEvents.violation));
export const events = parsedEvents.value;

// Derived from the page logic on main (site/core.js) run over this data; see the fixture's `source` field. That logic
// had no `effect` field, so the fixture pins every document field but that one.
const pageLogicFixture = z.strictObject({
  source: z.string(),
  changeSelection: z.array(z.strictObject({ version: z.string(), count: z.int(), slugsSha256: z.string() })),
  searchCorpus: z.strictObject({
    version: z.string(),
    documents: z.int(),
    sha256: z.string(),
    samples: z.array(searchDoc.omit({ effect: true })),
  }),
  controls: z.strictObject({ gatesWithControl: z.int(), envWithControl: z.int() }),
  export: z.strictObject({
    selection: z.record(z.string(), z.string()),
    encoded: z.string(),
    result: z.strictObject({
      env: z.record(z.string(), z.string()),
      settings: z.record(z.string(), z.boolean()),
      skipped: z.array(z.string()),
    }),
  }),
});

export const fixture = pageLogicFixture.parse(
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', `page-logic-${VERSION}.json`), 'utf8')),
);
