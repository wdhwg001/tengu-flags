// File and argument helpers the data tools share.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  const value = i > -1 ? process.argv[i + 1] : undefined;
  return value ?? fallback;
}

// Paths in messages read relative to where the tool was run, the way a person typed them.
export function rel(p: string): string {
  return relative(process.cwd(), p) || p;
}

export type JsonRead = { ok: true; value: unknown } | { ok: false; message: string };

export function readJson(file: string): JsonRead {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (e) {
    return { ok: false, message: `cannot read (${e instanceof Error ? e.message : String(e)})` };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, message: `not valid JSON (${e instanceof Error ? e.message : String(e)})` };
  }
}

export function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

export function versionDirs(versionsDir: string): string[] {
  if (!existsSync(versionsDir)) return [];
  return readdirSync(versionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}
