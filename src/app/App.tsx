import { onSettled, Show } from 'solid-js';
import type { Source } from '../data/load.ts';
import type { Selection } from '../lib/selection.ts';
import { ExportPanel } from './ExportPanel.tsx';
import { FlagTable } from './FlagTable.tsx';
import { Intro } from './Intro.tsx';
import { createFlagsState } from './state.ts';
import { TopBar } from './TopBar.tsx';

export function App(props: {
  source: Source;
  dev: boolean;
  pinnedVersion: string | null;
  initialSelection: Selection;
}) {
  const state = createFlagsState({
    source: props.source,
    dev: props.dev,
    pinnedVersion: props.pinnedVersion,
    initialSelection: props.initialSelection,
  });

  onSettled(() => {
    void state.start();
    const onHash = (): void => state.jumpToHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  return (
    <>
      <TopBar state={state} />
      <main class="mx-auto max-w-6xl px-4 pb-16">
        <Show when={state.dev}>
          <p class="mt-4 rounded border border-dashed border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Sample data. These rows are made up to exercise the page.
          </p>
        </Show>
        <Intro state={state} />
        <Show when={state.notice()}>
          {(text) => (
            <p class="my-3 rounded bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900 dark:text-amber-100">
              {text()}
            </p>
          )}
        </Show>
        <Show
          when={state.failure()}
          fallback={
            <Show when={state.view()}>
              {(view) => (
                <>
                  <FlagTable state={state} view={view()} />
                  <ExportPanel state={state} />
                </>
              )}
            </Show>
          }
        >
          {(message) => (
            <p
              role="alert"
              data-testid="failure"
              class="my-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
            >
              The data did not load, so the page shows no rows. {message()}
            </p>
          )}
        </Show>
        <Show when={state.loading() && state.failure() === null}>
          <p class="my-6 text-sm text-neutral-500">Loading the data files.</p>
        </Show>
        <FrozenDiskNote />
      </main>
      <footer class="mx-auto max-w-6xl px-4 pb-8 text-xs text-neutral-500">
        Read from the shipped Claude Code binary. Not affiliated with Anthropic. Source and evidence files are in the
        repository.
      </footer>
    </>
  );
}

function FrozenDiskNote() {
  return (
    <details class="mt-10 rounded border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
      <summary class="cursor-pointer font-medium">Advanced: the frozen-disk mode</summary>
      <p class="mt-2 leading-relaxed">
        One mode reaches nearly every gate, the grey ones included. With telemetry turned off and
        CLAUDE_CODE_GB_DISK_CACHE_WHEN_TELEMETRY_OFF set, Claude Code starts no GrowthBook client and fetches nothing.
        Each gate is then read from the copy cached in ~/.claude.json under cachedGrowthBookFeatures, and you can edit
        that copy by hand. The price is no telemetry and a cache that never refreshes. Gates read through the blocking
        readers or through client data ignore the cache. The page has no switch for this mode.
      </p>
    </details>
  );
}
