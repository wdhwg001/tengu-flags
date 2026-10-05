import { createSignal, Show } from 'solid-js';
import { exportText } from '../lib/controls.ts';
import type { FlagsState } from './state.ts';

const BUTTON =
  'rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800';

export function ExportPanel(props: { state: FlagsState }) {
  const [copied, setCopied] = createSignal('');
  const ex = () => props.state.exported();
  const text = () => {
    const e = ex();
    return e === null ? null : exportText(e);
  };
  const skippedText = () =>
    `Kept in the link but left out here, because ${ex()?.version} has no switch for them: ${ex()?.skipped.join(', ')}.`;
  const hasEnv = () => Object.keys(ex()?.env ?? {}).length > 0;
  const hasSettings = () => Object.keys(ex()?.settings ?? {}).length > 0;
  // A clipboard the browser refuses is said out loud, not swallowed.
  const copy = (what: string, value: string): void => {
    navigator.clipboard.writeText(value).then(
      () => setCopied(`${what} copied.`),
      () => setCopied(`The browser did not allow copying the ${what.toLowerCase()}.`),
    );
  };
  return (
    <section id="export" class="mt-10 space-y-3 rounded border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 class="text-base font-semibold">Your selection ({Object.keys(props.state.selection()).length})</h2>
      <Show
        when={hasEnv() || hasSettings()}
        fallback={
          <p class="text-sm">Nothing selected yet. Pick a value on any row with a switch and its line shows up here.</p>
        }
      >
        <p class="text-sm">
          These values were read against Claude Code <span data-testid="export-version">{ex()?.version}</span>. The env
          block goes in settings.json, and the page link carries the same selection.
        </p>
        <Show when={hasEnv()}>
          <h3 class="text-sm font-medium">env block</h3>
          <pre
            data-testid="export-env"
            class="overflow-x-auto rounded bg-neutral-100 p-3 font-mono text-xs dark:bg-neutral-900"
          >
            {text()?.envBlock}
          </pre>
          <button type="button" class={BUTTON} onClick={() => copy('Env block', text()?.envBlock ?? '')}>
            Copy env block
          </button>
        </Show>
        <Show when={hasSettings()}>
          <h3 class="text-sm font-medium">Settings keys</h3>
          <p class="text-sm">These have no variable. Add them at the top level of the same settings.json.</p>
          <pre
            data-testid="export-settings"
            class="overflow-x-auto rounded bg-neutral-100 p-3 font-mono text-xs dark:bg-neutral-900"
          >
            {text()?.settingsBlock}
          </pre>
          <button type="button" class={BUTTON} onClick={() => copy('Settings keys', text()?.settingsBlock ?? '')}>
            Copy settings keys
          </button>
        </Show>
      </Show>
      <Show when={(ex()?.skipped.length ?? 0) > 0}>
        <p class="text-xs text-neutral-500">{skippedText()}</p>
      </Show>
      <p class="flex flex-wrap gap-2">
        <button type="button" class={BUTTON} onClick={() => copy('Link', location.href)}>
          Copy link
        </button>
        <button type="button" class={BUTTON} onClick={() => props.state.clearSelection()}>
          Clear all
        </button>
      </p>
      <Show when={copied()}>
        <p role="status" class="text-xs text-neutral-500">
          {copied()}
        </p>
      </Show>
    </section>
  );
}
