// Parses every data file DESIGN names through src/schema/, then checks what no single file can show.
// Usage: node tools/validate.ts [--data <dir>]   (default: ./data)
// Exit 1 on the first violation, naming the file, the row index, the slug and the field, in that order.
// Exit 0 with a one-line count summary otherwise. A file the pipelines have not written yet (env.json,
// changes.json, index.json and their evidence) is reported on that line, not failed.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { z } from 'zod';
import { cmpVersion } from '../src/lib/versions.ts';
import { type ChangeRow, changeRow } from '../src/schema/change.ts';
import { changeSlugClash, checkVersionRows } from '../src/schema/consistency.ts';
import { type EnvRow, envRowSchema } from '../src/schema/env.ts';
import { eventsFile, indexFile, type MetaFile, metaFile } from '../src/schema/files.ts';
import { type GateRow, gateRowSchema } from '../src/schema/gate.ts';
import { formatViolation, type Parsed, parseFile, parseRows, type Violation } from '../src/schema/parse.ts';
import { codeShape, jsonStrings } from './lib/codeshape.ts';
import { arg, readJson, rel, versionDirs, walk } from './lib/files.ts';
import { mermaidShape } from './lib/mermaid.ts';
import { PRIVATE } from './lib/privacy.ts';

const dataDir = resolve(arg('--data', 'data'));

class Refusal extends Error {
  readonly violation: Violation;
  constructor(violation: Violation) {
    super(formatViolation(violation));
    this.violation = violation;
  }
}

function stop(
  file: string,
  field: string | null,
  message: string,
  row: number | null = null,
  slug: string | null = null,
): never {
  throw new Refusal({ file: rel(file), row, slug, field, message });
}

function take<T>(p: Parsed<T>): T {
  if (!p.ok) throw new Refusal(p.violation);
  return p.value;
}

function load(file: string): unknown {
  const r = readJson(file);
  if (!r.ok) stop(file, null, r.message);
  return r.value;
}

const missing: string[] = [];
const counts = { versions: 0, gates: 0, env: 0, changes: 0, events: 0 };

function checkPrivacy(file: string): void {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const [i, line] of lines.entries()) {
    const m = PRIVATE.exec(line);
    if (m) stop(file, `line ${i + 1}`, `machine-local path or identifier "${m[0].slice(0, 12)}..." in the data`);
  }
}

// The client's code is not published (DESIGN, "What is published about the binary"): no string of a data file and
// no line of a receipts file may read as code. The patterns and their reasons are in tools/lib/codeshape.ts. A gate
// effect's `text`, `summary`, `where` and `mermaid` and the row's `values` are strings like any other and pass the
// same rule; a `mermaid` string also passes the flowchart rule of tools/lib/mermaid.ts.
function checkCodeShape(file: string): void {
  const refuse = (where: string, text: string): void => {
    const hit = codeShape(text);
    if (hit) stop(file, where, `reads as code (${hit.name}: "${hit.match}"); say in words what the code does`);
    const chart = where.endsWith('.mermaid') ? mermaidShape(text) : null;
    if (chart) stop(file, where, `is not a flowchart in the project's own words (${chart.name}: "${chart.match}")`);
  };
  if (file.endsWith('.json')) for (const [path, text] of jsonStrings(load(file))) refuse(path, text);
  else if (file.endsWith('.md'))
    for (const [i, line] of readFileSync(file, 'utf8').split('\n').entries()) refuse(`line ${i + 1}`, line);
}

function needReceipts(path: string, what: string): void {
  if (!existsSync(path)) stop(path, null, `${what} needs its receipts`);
}

interface VersionData {
  meta: MetaFile;
  gates: GateRow[];
  env: EnvRow[];
  events: number;
}

function rowsOf<T>(file: string, schema: z.ZodType<T>, label: string): T[] {
  if (!existsSync(file)) {
    missing.push(label);
    return [];
  }
  return take(parseRows(rel(file), schema, load(file)));
}

function checkVersion(v: string): VersionData {
  const dir = join(dataDir, 'versions', v);
  if (!/^\d+\.\d+\.\d+$/.test(v)) stop(dir, null, 'directory name must be a version X.Y.Z');
  const metaF = join(dir, 'meta.json');
  const meta = take(parseFile(rel(metaF), metaFile, load(metaF)));
  if (meta.version !== v) stop(metaF, 'version', `must be "${v}"`);

  const gatesF = join(dir, 'gates.json');
  const gates = rowsOf<GateRow>(gatesF, gateRowSchema(v), `${v}/gates.json`);
  if (existsSync(gatesF)) needReceipts(join(dataDir, 'evidence', v, 'gates.receipts.md'), 'gates.json');
  const envF = join(dir, 'env.json');
  const env = rowsOf<EnvRow>(envF, envRowSchema(v), `${v}/env.json`);
  if (existsSync(envF)) needReceipts(join(dataDir, 'evidence', v, 'env.receipts.md'), 'env.json');
  const clash = checkVersionRows({ version: v, gatesFile: rel(gatesF), gates, envFile: rel(envF), env });
  if (clash) throw new Refusal(clash);

  const evF = join(dir, 'events.json');
  let events = 0;
  if (existsSync(evF)) events = take(parseFile(rel(evF), eventsFile, load(evF))).length;
  else missing.push(`${v}/events.json`);
  return { meta, gates, env, events };
}

function checkChanges(versionSlugs: ReadonlyMap<string, string>): ChangeRow[] {
  const file = join(dataDir, 'changes.json');
  if (!existsSync(file)) {
    missing.push('changes.json');
    return [];
  }
  const rows = take(parseRows(rel(file), changeRow, load(file)));
  const clash = changeSlugClash(rel(file), rows, versionSlugs);
  if (clash) throw new Refusal(clash);
  needReceipts(join(dataDir, 'evidence', 'changes.receipts.md'), 'changes.json');
  return rows;
}

function checkIndex(perVersion: ReadonlyMap<string, VersionData>, changes: readonly ChangeRow[]): void {
  const file = join(dataDir, 'index.json');
  if (!existsSync(file)) {
    missing.push('index.json');
    return;
  }
  const idx = take(parseFile(rel(file), indexFile, load(file)));
  for (const [i, x] of idx.versions.entries()) {
    const before = idx.versions[i - 1];
    if (before && cmpVersion(before.version, x.version) >= 0)
      stop(file, 'version', 'versions must ascend without repeats', i);
    const pv = perVersion.get(x.version);
    if (!pv) stop(file, 'version', `no data/versions/${x.version}/`, i);
    if (x.sha256 !== pv.meta.sha256) stop(file, 'sha256', "differs from that version's meta.json", i);
    const want = {
      gates: pv.gates.length,
      env: pv.env.length,
      changes: changes.filter((c) => c.enteredAt.version === x.version).length,
      events: pv.events,
    };
    for (const k of ['gates', 'env', 'changes', 'events'] as const) {
      if (x.counts[k] !== want[k]) {
        stop(file, `counts.${k}`, `is ${x.counts[k]}, the data holds ${want[k]} (regenerate with tools/index.ts)`, i);
      }
    }
  }
  for (const v of perVersion.keys()) {
    if (!idx.versions.some((x) => x.version === v)) stop(file, 'versions', `does not list ${v}`);
  }
}

function run(): void {
  if (!existsSync(dataDir)) stop(dataDir, null, 'no data directory');
  for (const f of walk(dataDir)) {
    checkPrivacy(f);
    checkCodeShape(f);
  }
  const versions = versionDirs(join(dataDir, 'versions')).sort(cmpVersion);
  if (versions.length === 0) stop(join(dataDir, 'versions'), null, 'no version directory');

  const perVersion = new Map<string, VersionData>();
  const versionSlugs = new Map<string, string>();
  for (const v of versions) {
    const data = checkVersion(v);
    perVersion.set(v, data);
    for (const r of [...data.gates, ...data.env]) versionSlugs.set(r.slug, `${r.kind} ${v}`);
    counts.versions++;
    counts.gates += data.gates.length;
    counts.env += data.env.length;
    counts.events += data.events;
  }
  const changes = checkChanges(versionSlugs);
  counts.changes = changes.length;
  checkIndex(perVersion, changes);
}

try {
  run();
} catch (e) {
  if (!(e instanceof Refusal)) throw e;
  console.error(`validate: ${e.message}`);
  process.exit(1);
}
const miss = missing.length > 0 ? `; not present yet: ${missing.join(', ')}` : '';
console.log(
  `validate: ok, ${counts.versions} version(s), ${counts.gates} gate rows, ${counts.env} env rows, ` +
    `${counts.changes} change rows, ${counts.events} events${miss}`,
);
