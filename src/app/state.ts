// The page's state and the actions that change it. Created once, inside App's owner.
import { createEffect, createMemo, createSignal, flush } from 'solid-js';
import { type Catalogue, loadCatalogue, loadVersion, type Source, type VersionView } from '../data/load.ts';
import { buildExport } from '../lib/controls.ts';
import { makeSearcher } from '../lib/search.ts';
import { encodeSelection, type Selection, withValue } from '../lib/selection.ts';

export interface StateInit {
  source: Source;
  dev: boolean;
  pinnedVersion: string | null;
  initialSelection: Selection;
}

export function createFlagsState(init: StateInit) {
  const [catalogue, setCatalogue] = createSignal<Catalogue | null>(null);
  const [view, setView] = createSignal<VersionView | null>(null);
  // A load or parse failure replaces the table: the page renders no row from data it could not read whole.
  const [failure, setFailure] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);
  // `draft` is what the search box shows as it is typed; `query` is what the table filters on, a beat later.
  const [draft, setDraft] = createSignal('');
  const [query, setQuery] = createSignal('');
  let typing: ReturnType<typeof setTimeout> | undefined;
  const [showEvents, setShowEvents] = createSignal(false);
  const [selection, setSelection] = createSignal<Selection>(init.initialSelection);
  const [jumpTarget, setJumpTarget] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);

  const searcher = createMemo(() => {
    const v = view();
    return v === null ? null : makeSearcher(v.docs);
  });
  const matches = createMemo(() => new Set(searcher()?.search(query()) ?? []));
  const exported = createMemo(() => {
    const v = view();
    return v === null ? null : buildExport(selection(), v.bySlug, v.version);
  });
  const newest = createMemo(() => catalogue()?.index.versions.at(-1)?.version ?? null);

  // The address carries the version (when it is not the newest) and the selection, so a copied link reproduces both.
  createEffect(
    () => ({ version: view()?.version ?? null, newest: newest(), c: encodeSelection(selection()) }),
    ({ version, newest: latest, c }) => {
      if (version === null) return;
      const p = new URLSearchParams();
      if (init.dev) p.set('dev', 'sample');
      if (version !== latest) p.set('v', version);
      if (c !== '') p.set('c', c);
      const qs = p.toString();
      history.replaceState(null, '', `${location.pathname}${qs === '' ? '' : `?${qs}`}${location.hash}`);
    },
  );

  function jumpToHash(): void {
    const slug = decodeURIComponent(location.hash.slice(1));
    const v = view();
    setNotice(null);
    setJumpTarget(null);
    if (slug === '' || v === null) return;
    if (!v.items.some((it) => it.row.slug === slug)) {
      setNotice(`No row named “${slug}” in ${v.version}.`);
      return;
    }
    // A row the current search hides is shown by clearing the search, never by jumping to nothing.
    if (!matches().has(slug)) {
      setDraft('');
      setQuery('');
    }
    setJumpTarget(slug);
    flush();
    document.getElementById(slug)?.scrollIntoView({ block: 'center' });
  }

  async function openVersion(version: string): Promise<void> {
    const cat = catalogue();
    if (cat === null) return;
    setLoading(true);
    const loaded = await loadVersion(init.source, cat, version);
    setLoading(false);
    if (!loaded.ok) {
      setView(null);
      setFailure(loaded.message);
      return;
    }
    setFailure(null);
    setView(loaded.value);
    flush();
    jumpToHash();
  }

  async function start(): Promise<void> {
    const cat = await loadCatalogue(init.source);
    if (!cat.ok) {
      setLoading(false);
      setFailure(`${cat.message} The page needs to be served over http, not opened as a file.`);
      return;
    }
    setCatalogue(cat.value);
    flush();
    const listed = cat.value.index.versions.map((v) => v.version);
    const pinned = init.pinnedVersion;
    const version = pinned !== null && listed.includes(pinned) ? pinned : listed.at(-1);
    if (version !== undefined) await openVersion(version);
  }

  return {
    source: init.source,
    dev: init.dev,
    catalogue,
    view,
    failure,
    loading,
    draft,
    query,
    typeQuery: (text: string) => {
      setDraft(text);
      clearTimeout(typing);
      typing = setTimeout(() => setQuery(text), 120);
    },
    showEvents,
    setShowEvents,
    selection,
    jumpTarget,
    notice,
    matches,
    exported,
    start,
    openVersion,
    jumpToHash,
    setValue: (slug: string, value: string) => setSelection((s) => withValue(s, slug, value)),
    clearSelection: () => setSelection({}),
  };
}

export type FlagsState = ReturnType<typeof createFlagsState>;
