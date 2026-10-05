import { For } from 'solid-js';
import type { FlagsState } from './state.ts';

export function TopBar(props: { state: FlagsState }) {
  const versions = () => [...(props.state.catalogue()?.index.versions ?? [])].reverse();
  return (
    <header class="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <h1 class="mr-auto font-mono text-lg font-semibold">tengu://flags</h1>
        <label class="flex items-center gap-2 text-sm">
          <span>Version</span>
          <select
            id="version"
            class="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            onChange={(e) => void props.state.openVersion(e.currentTarget.value)}
          >
            <For each={versions()}>
              {(v) => (
                <option value={v.version} selected={props.state.view()?.version === v.version}>
                  {v.version}
                </option>
              )}
            </For>
          </select>
        </label>
      </div>
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 pb-3">
        <input
          id="q"
          type="search"
          class="min-w-64 flex-1 rounded border border-neutral-300 bg-white px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Search names, descriptions, variables and workarounds"
          aria-label="Search"
          autocomplete="off"
          spellcheck="false"
          value={props.state.draft()}
          onInput={(e) => props.state.typeQuery(e.currentTarget.value)}
        />
        <label class="flex items-center gap-2 text-sm">
          <input
            id="events"
            type="checkbox"
            checked={props.state.showEvents()}
            onChange={(e) => props.state.setShowEvents(e.currentTarget.checked)}
          />
          Show telemetry events
        </label>
      </div>
    </header>
  );
}
