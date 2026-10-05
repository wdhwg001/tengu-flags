// The search corpus and the searcher over it. The field set is fixed by DESIGN ("The page's behaviour"):
// name, slug, what, the override key, the workaround text, and a gate's effects and `values` sentence.
import { Document } from 'flexsearch';
import type { ChangeRow } from '../schema/change.ts';
import type { EnvRow } from '../schema/env.ts';
import type { SearchDoc } from '../schema/files.ts';
import type { GateRow } from '../schema/gate.ts';

export type Row = GateRow | EnvRow | ChangeRow;

// The keys a row is reached by besides its own name: a gate's overriding variable or settings key,
// a variable's overridden gate slugs.
function overrideKeys(r: Row): string[] {
  if (r.kind === 'gate') return (r.override ?? []).map((o) => o.key);
  if (r.kind === 'env') return r.overrides.map((o) => o.gate);
  return [];
}

// What a gate does, as a reader meets it: each effect's verbatim text (a prompt sentence, a UI line), its summary and
// where it acts, then the `values` sentence; a sentence met in a transcript finds the gate that put it there.
function effectText(r: Row): string {
  if (r.kind !== 'gate') return '';
  const parts: string[] = [];
  for (const e of r.effects) {
    if ('where' in e) parts.push(e.where);
    if ('text' in e) parts.push(e.text);
    if ('summary' in e) parts.push(e.summary);
  }
  if (r.values !== null) parts.push(r.values);
  return parts.join(' ');
}

// Property order is part of the corpus bytes tools/build-data.ts writes; keep it.
export function searchDocs(rows: readonly Row[], events: readonly string[]): SearchDoc[] {
  const docs: SearchDoc[] = rows.map((r) => ({
    id: r.slug,
    kind: r.kind,
    name: r.name,
    slug: r.slug,
    what: r.what ?? '',
    key: overrideKeys(r).join(' '),
    work: r.kind === 'change' ? r.workarounds.map((w) => w.text).join(' ') : '',
    effect: effectText(r),
  }));
  for (const e of events)
    docs.push({ id: `event:${e}`, kind: 'event', name: e, slug: '', what: '', key: '', work: '', effect: '' });
  return docs;
}

const FIELDS = ['name', 'slug', 'what', 'key', 'work', 'effect'] as const;

export interface Searcher {
  // Every matching document id, FlexSearch's ranking first; an empty query matches everything.
  search(query: string): string[];
}

// FlexSearch ranks; a substring scan is unioned in after it, because an identifier such as
// CLAUDE_CODE_X is one token to FlexSearch and a person types the middle of it.
export function makeSearcher(docs: readonly SearchDoc[]): Searcher {
  const index = new Document<SearchDoc>({
    document: { id: 'id', index: FIELDS.map((field) => ({ field, tokenize: 'forward' as const })) },
  });
  for (const d of docs) index.add(d);
  const lower = docs.map(
    (d) =>
      [
        d.id,
        FIELDS.map((f) => d[f])
          .join('\n')
          .toLowerCase(),
      ] as const,
  );
  return {
    search(query) {
      const q = query.trim().toLowerCase();
      if (q === '') return docs.map((d) => d.id);
      const seen = new Set<string>();
      const out: string[] = [];
      const take = (id: string): void => {
        if (seen.has(id)) return;
        seen.add(id);
        out.push(id);
      };
      for (const group of index.search(q, { limit: docs.length })) {
        for (const id of group.result) take(String(id));
      }
      const words = q.split(/\s+/);
      for (const [id, text] of lower) if (words.every((w) => text.includes(w))) take(id);
      return out;
    },
  };
}
