// Regenerates data/index.json from data/versions/*/ and data/changes.json.
// Usage: node tools/index.ts [--data <dir>]   (default: ./data)
//
// Versions are ordered oldest to newest; `changes` counts the change rows whose enteredAt.version is that version.
// Nothing time-dependent is written, so two runs over the same data produce the same bytes.
import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { cmpVersion } from '../src/lib/versions.ts';
import { changeRow } from '../src/schema/change.ts';
import { type IndexFile, metaFile, type VersionEntry } from '../src/schema/files.ts';
import { formatViolation, type Parsed, parseFile, parseRows } from '../src/schema/parse.ts';
import { arg, readJson, rel, versionDirs } from './lib/files.ts';

function fail(message: string): never {
  console.error(`index: ${message}`);
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

// A list the pipeline has not written yet counts as empty.
function lengthOf(file: string): number {
  if (!existsSync(file)) return 0;
  const value = load(file);
  if (!Array.isArray(value)) fail(`${rel(file)}: must be an array`);
  return value.length;
}

const dataDir = resolve(arg('--data', 'data'));
const versionsDir = join(dataDir, 'versions');
if (!existsSync(versionsDir)) fail(`no ${rel(versionsDir)}`);

const changesF = join(dataDir, 'changes.json');
const changes = existsSync(changesF) ? take(parseRows(rel(changesF), changeRow, load(changesF))) : [];

const versions: VersionEntry[] = [];
for (const v of versionDirs(versionsDir).sort(cmpVersion)) {
  const dir = join(versionsDir, v);
  const metaF = join(dir, 'meta.json');
  if (!existsSync(metaF)) {
    console.error(`index: ${rel(dir)} has no meta.json, skipped`);
    continue;
  }
  const meta = take(parseFile(rel(metaF), metaFile, load(metaF)));
  versions.push({
    version: v,
    sha256: meta.sha256,
    readAt: meta.readAt,
    counts: {
      gates: lengthOf(join(dir, 'gates.json')),
      env: lengthOf(join(dir, 'env.json')),
      changes: changes.filter((c) => c.enteredAt.version === v).length,
      events: lengthOf(join(dir, 'events.json')),
    },
  });
}

const newest = versions.at(-1);
if (newest === undefined) fail('no version has a meta.json');
const out = join(dataDir, 'index.json');
const index: IndexFile = { versions };
writeFileSync(out, `${JSON.stringify(index, null, 2)}\n`);
console.log(
  `index: ${versions.length} version(s), newest ${newest.version}, ${changes.length} change row(s) -> ${rel(out)}`,
);
