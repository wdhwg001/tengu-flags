import { Show } from 'solid-js';
import { changesFor } from '../lib/versions.ts';
import type { FlagsState } from './state.ts';

const fmt = (n: number): string => n.toLocaleString('en-US');

export function Intro(props: { state: FlagsState }) {
  const entry = () => {
    const v = props.state.view();
    return v === null ? undefined : props.state.catalogue()?.index.versions.find((e) => e.version === v.version);
  };
  const changeCount = () => {
    const v = props.state.view();
    const cat = props.state.catalogue();
    return v === null || cat === null ? 0 : changesFor(cat.changes, v.version).length;
  };
  const shown = () => {
    const v = props.state.view();
    if (v === null || props.state.query().trim() === '') return null;
    const m = props.state.matches();
    const rows = v.items.filter((it) => m.has(it.row.slug)).length;
    const events = props.state.showEvents() ? v.events.filter((e) => m.has(`event:${e}`)).length : 0;
    return rows + events;
  };
  return (
    <section class="mt-6 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      <p>
        Claude Code reads feature gates from Anthropic's servers and environment variables from your shell. This page
        lists the ones found in one release. Pick a value on any row that has a switch, and the page writes the
        settings.json lines that set it.
      </p>
      <p>
        Grey rows have no switch. Their text says why, and what you can do instead when there is anything. Every row
        names the release and the byte offset where it was read, and a switch here holds for that release only.
      </p>
      <Show when={entry()}>
        {(e) => (
          <>
            <p data-testid="counts" class="text-xs text-neutral-500">
              {fmt(e().counts.gates)} gates, {fmt(e().counts.env)} variables, {fmt(changeCount())} changes and{' '}
              {fmt(e().counts.events)} telemetry events in {e().version}.
              <Show when={shown()}>{(n) => <span data-testid="shown"> {fmt(n())} shown.</span>}</Show>
            </p>
            <p class="font-mono text-xs break-all text-neutral-500">sha256 {e().sha256}</p>
          </>
        )}
      </Show>
    </section>
  );
}
