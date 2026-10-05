// The structure gate: at most 600 lines per source file, 20 source files per folder, 16 subfolders per folder and
// 5 folder levels below src/, tools/ and tests/. A cap that binds is a reason to re-manage the layout, never to
// raise the cap or squeeze a file (DESIGN, "Toolchain and gates").
// Usage: node tools/gate/structure.ts [--report]   (--report also prints the counts of every folder)
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOTS = ['src', 'tools', 'tests'];
const SOURCE = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css']);
const MAX_LINES = 600;
const MAX_FILES = 20;
const MAX_SUBFOLDERS = 16;
const MAX_DEPTH = 5;

const root = join(import.meta.dirname, '..', '..');
const report = process.argv.includes('--report');
const faults: string[] = [];
const rows: string[] = [];

function lineCount(file: string): number {
  const text = readFileSync(file, 'utf8');
  if (text === '') return 0;
  return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}

function visit(dir: string, depth: number): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory());
  const sources = entries.filter((e) => e.isFile() && SOURCE.has(extname(e.name)));
  const here = relative(root, dir);
  rows.push(`${here}: ${sources.length} source files, ${folders.length} subfolders, depth ${depth}`);
  if (sources.length > MAX_FILES) faults.push(`${here}: ${sources.length} source files (cap ${MAX_FILES})`);
  if (folders.length > MAX_SUBFOLDERS) faults.push(`${here}: ${folders.length} subfolders (cap ${MAX_SUBFOLDERS})`);
  if (depth > MAX_DEPTH) faults.push(`${here}: ${depth} folder levels below its root (cap ${MAX_DEPTH})`);
  for (const f of sources) {
    const path = join(dir, f.name);
    const n = lineCount(path);
    if (n > MAX_LINES) faults.push(`${relative(root, path)}: ${n} lines (cap ${MAX_LINES})`);
  }
  for (const f of folders) visit(join(dir, f.name), depth + 1);
}

for (const r of ROOTS) visit(join(root, r), 0);
if (report) for (const row of rows) console.log(row);
if (faults.length > 0) {
  for (const f of faults) console.error(`structure: ${f}`);
  process.exit(1);
}
console.log(`structure: ok, ${rows.length} folders under ${ROOTS.join(', ')} within the caps`);
