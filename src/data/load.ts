// Fetches the data files and parses each through src/schema/, so a file that fails is reported and nothing of it
// is rendered. The page fetches nothing else.
import type { z } from 'zod';
import { type Row, searchDocs } from '../lib/search.ts';
import { changesFor, cmpVersion } from '../lib/versions.ts';
import { type ChangeRow, changeRow } from '../schema/change.ts';
import { checkVersionRows } from '../schema/consistency.ts';
import { envRowSchema } from '../schema/env.ts';
import { eventsFile, type IndexFile, indexFile, type SearchDoc, searchCorpus } from '../schema/files.ts';
import { gateRowSchema } from '../schema/gate.ts';
import { formatViolation, parseFile, parseRows } from '../schema/parse.ts';

export type Loaded<T> = { ok: true; value: T } | { ok: false; message: string };

async function fetchJson(url: string): Promise<Loaded<unknown>> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    return { ok: false, message: `${url} did not load (${e instanceof Error ? e.message : String(e)}).` };
  }
  if (!response.ok) return { ok: false, message: `${url} did not load (HTTP ${response.status}).` };
  try {
    return { ok: true, value: await response.json() };
  } catch {
    return { ok: false, message: `${url} is not valid JSON.` };
  }
}

async function loadFile<T>(url: string, schema: z.ZodType<T>): Promise<Loaded<T>> {
  const raw = await fetchJson(url);
  if (!raw.ok) return raw;
  const parsed = parseFile(url, schema, raw.value);
  return parsed.ok ? parsed : { ok: false, message: formatViolation(parsed.violation) };
}

async function loadRows<T>(url: string, schema: z.ZodType<T>): Promise<Loaded<T[]>> {
  const raw = await fetchJson(url);
  if (!raw.ok) return raw;
  const parsed = parseRows(url, schema, raw.value);
  return parsed.ok ? parsed : { ok: false, message: formatViolation(parsed.violation) };
}

export interface Source {
  // 'data/' for the published tree, 'sample/' for the made-up one under ?dev=sample.
  base: string;
  // The built page fetches the search corpus tools/build-data.ts wrote; the dev server has none and builds it.
  corpus: 'fetch' | 'compute';
}

export interface Catalogue {
  index: IndexFile;
  changes: ChangeRow[];
}

export async function loadCatalogue(src: Source): Promise<Loaded<Catalogue>> {
  const index = await loadFile(`${src.base}index.json`, indexFile);
  if (!index.ok) return index;
  const changes = await loadRows(`${src.base}changes.json`, changeRow);
  if (!changes.ok) return changes;
  const versions = [...index.value.versions].sort((a, b) => cmpVersion(a.version, b.version));
  return { ok: true, value: { index: { versions }, changes: changes.value } };
}

export interface RowItem {
  row: Row;
  // The last version that carried a row the selected version has dropped; null for a row the version carries.
  goneSince: string | null;
}

export interface VersionView {
  version: string;
  items: RowItem[];
  // The selected version's own gate and env rows, the ones a selection can name.
  bySlug: Map<string, Row>;
  events: string[];
  docs: SearchDoc[];
}

async function versionRows(base: string, version: string): Promise<Loaded<Row[]>> {
  const gatesUrl = `${base}versions/${version}/gates.json`;
  const envUrl = `${base}versions/${version}/env.json`;
  const [gates, env] = await Promise.all([
    loadRows(gatesUrl, gateRowSchema(version)),
    loadRows(envUrl, envRowSchema(version)),
  ]);
  if (!gates.ok) return gates;
  if (!env.ok) return env;
  const clash = checkVersionRows({ version, gatesFile: gatesUrl, gates: gates.value, envFile: envUrl, env: env.value });
  if (clash) return { ok: false, message: formatViolation(clash) };
  return { ok: true, value: [...gates.value, ...env.value] };
}

async function corpusFor(src: Source, version: string, rows: readonly Row[], events: readonly string[]) {
  if (src.corpus === 'compute') return { ok: true, value: searchDocs(rows, events) } as const;
  return loadFile(`search/${version}.json`, searchCorpus);
}

export async function loadVersion(src: Source, cat: Catalogue, version: string): Promise<Loaded<VersionView>> {
  const versions = cat.index.versions.map((v) => v.version);
  const prev = versions[versions.indexOf(version) - 1] ?? null;
  const [current, events, previous] = await Promise.all([
    versionRows(src.base, version),
    loadFile(`${src.base}versions/${version}/events.json`, eventsFile),
    prev === null ? Promise.resolve<Loaded<Row[]>>({ ok: true, value: [] }) : versionRows(src.base, prev),
  ]);
  if (!current.ok) return current;
  if (!events.ok) return events;
  if (!previous.ok) return previous;

  const changes = changesFor(cat.changes, version);
  const here = new Set(current.value.map((r) => r.slug));
  const gone = previous.value.filter((r) => !here.has(r.slug));
  const docs = await corpusFor(src, version, [...current.value, ...changes], events.value);
  if (!docs.ok) return docs;
  const items: RowItem[] = [
    ...current.value.map((row) => ({ row, goneSince: null })),
    ...changes.map((row) => ({ row, goneSince: null })),
    ...gone.map((row) => ({ row, goneSince: prev })),
  ];
  return {
    ok: true,
    value: {
      version,
      items,
      bySlug: new Map(current.value.map((r) => [r.slug, r])),
      events: events.value,
      // Rows gone since the previous version are not in the corpus a version's build writes; they join it here.
      docs: [...docs.value, ...searchDocs(gone, [])],
    },
  };
}
