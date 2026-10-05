// Writes the data half of dist/: a copy of data/ under dist/data/ and the search corpus dist/search/<version>.json.
// Usage: node tools/build-data.ts [--data <dir>] [--out <dir>]   (defaults: ./data, ./dist)
// Runs after `vite build`, which writes the page into the same folder; reads data/ and never writes to it.
//
// The corpus holds one document per gate, env and change row and one per telemetry event, built by the same
// searchDocs() the page falls back to when it is served without a corpus (the dev server).
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { z } from 'zod';
import { makeSearcher, type Row, searchDocs } from '../src/lib/search.ts';
import { changesFor } from '../src/lib/versions.ts';
import { changeRow } from '../src/schema/change.ts';
import { envRowSchema } from '../src/schema/env.ts';
import { eventsFile, indexFile } from '../src/schema/files.ts';
import { gateRowSchema } from '../src/schema/gate.ts';
import { formatViolation, type Parsed, parseFile, parseRows } from '../src/schema/parse.ts';
import { arg, readJson, rel } from './lib/files.ts';

function fail(message: string): never {
  console.error(`build-data: ${message}`);
  process.exit(1);
}

function take<T>(p: Parsed<T>): T {
  if (!p.ok) fail(formatViolation(p.violation));
  return p.value;
}

function load(file: string): unknown {
  const r = readJson(file);
  if (!r.ok) fail(`${rel(file)}: ${r.message}`);
  return r.value;
}

function rowsAt<T>(file: string, schema: z.ZodType<T>): T[] {
  return existsSync(file) ? take(parseRows(rel(file), schema, load(file))) : [];
}

const dataDir = resolve(arg('--data', 'data'));
const outDir = resolve(arg('--out', 'dist'));

const indexF = join(dataDir, 'index.json');
if (!existsSync(indexF)) fail(`${rel(indexF)} is missing; run tools/index.ts first`);
const index = take(parseFile(rel(indexF), indexFile, load(indexF)));
const changes = rowsAt(join(dataDir, 'changes.json'), changeRow);

for (const sub of ['data', 'search']) rmSync(join(outDir, sub), { recursive: true, force: true });
mkdirSync(join(outDir, 'search'), { recursive: true });
cpSync(dataDir, join(outDir, 'data'), { recursive: true });
// GitHub Pages runs Jekyll over a branch unless told not to, and Jekyll drops files it does not know.
writeFileSync(join(outDir, '.nojekyll'), '');

let docCount = 0;
for (const { version } of index.versions) {
  const dir = join(dataDir, 'versions', version);
  const rows: Row[] = [
    ...rowsAt(join(dir, 'gates.json'), gateRowSchema(version)),
    ...rowsAt(join(dir, 'env.json'), envRowSchema(version)),
    ...changesFor(changes, version),
  ];
  const evF = join(dir, 'events.json');
  const events = existsSync(evF) ? take(parseFile(rel(evF), eventsFile, load(evF))) : [];
  const docs = searchDocs(rows, events);
  docCount += docs.length;
  writeFileSync(join(outDir, 'search', `${version}.json`), `${JSON.stringify(docs)}\n`);
  // A corpus the index cannot search is a broken page, so a search for the first row's own name must find it.
  const first = docs[0];
  if (first && !makeSearcher(docs).search(first.name.slice(0, 3)).includes(first.id)) {
    fail(`search over ${version} does not find its own first row`);
  }
}

console.log(`build-data: ${index.versions.length} version(s), ${docCount} search document(s) -> ${rel(outDir)}`);
