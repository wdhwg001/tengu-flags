// The suppression check: a lint or type suppression stands only with its reason in the comment
// (DESIGN, "Toolchain and gates"). Every Biome ignore names its rule and says why; every expect-error directive
// says why; the TypeScript ignore directive and ESLint's disable comments fail outright.
// Usage: node tools/gate/suppressions.ts   (prints each suppression it accepts, then the faults)
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

// The directive names are assembled so this file does not itself carry the comments it checks for.
const TS = '@ts-';
const BIOME = 'biome-' + 'ignore';
const TS_IGNORE = `${TS}ignore`;
const TS_EXPECT = `${TS}expect-error`;
const ESLINT = 'eslint-' + 'disable';

const BIOME_OK = new RegExp(`${BIOME}(?:-all|-start|-end)? lint/[A-Za-z]+/[A-Za-z]+: \\S`);
const EXPECT_OK = new RegExp(`${TS_EXPECT}\\s*:?\\s+\\S`);

const root = join(import.meta.dirname, '..', '..');
const SKIP = new Set(['node_modules', 'dist', 'data', 'sample', '.git', 'test-results', 'playwright-report']);
const CODE = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

function files(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...files(p));
    else if (CODE.has(extname(e.name))) out.push(p);
  }
  return out;
}

function verdict(line: string): { kind: string; ok: boolean } | null {
  if (line.includes(TS_IGNORE)) return { kind: TS_IGNORE, ok: false };
  if (line.includes(ESLINT)) return { kind: ESLINT, ok: false };
  if (line.includes(BIOME)) return { kind: BIOME, ok: BIOME_OK.test(line) };
  if (line.includes(TS_EXPECT)) return { kind: TS_EXPECT, ok: EXPECT_OK.test(line) };
  return null;
}

const accepted: string[] = [];
const faults: string[] = [];
for (const file of files(root)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const [i, line] of lines.entries()) {
    const v = verdict(line);
    if (v === null) continue;
    const where = `${relative(root, file)}:${i + 1}`;
    if (v.ok) accepted.push(`${where}: ${line.trim()}`);
    else faults.push(`${where}: ${v.kind} with no reason, or a directive that is never allowed: ${line.trim()}`);
  }
}

for (const a of accepted) console.log(`suppressions: kept ${a}`);
if (faults.length > 0) {
  for (const f of faults) console.error(`suppressions: ${f}`);
  process.exit(1);
}
console.log(`suppressions: ok, ${accepted.length} suppression(s), each with its reason`);
