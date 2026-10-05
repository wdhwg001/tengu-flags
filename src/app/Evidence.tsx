import { createSignal, For, Show } from 'solid-js';
import type { Row } from '../lib/search.ts';
import { Effects } from './Effects.tsx';

const fmt = (n: number): string => n.toLocaleString('en-US');

// A site is named by its build and its byte offset and nothing else: the page shows no bytes of the binary.
function siteLine(p: Row['provenance'][number]): string {
  const build =
    p.platform === undefined ? `Claude Code ${p.version}` : `Claude Code ${p.version} (${p.platform} build)`;
  const role = p.role === 'binding' ? ', the binding that decides the value' : '';
  return `${build}, byte offset ${fmt(p.offset)}${role}`;
}

// The row's detail, opened inline: what a gate changes and how its value composes, when the row says, then where
// the row was read. A row that says neither opens onto the read sites alone.
export function Evidence(props: { row: Row }) {
  const [open, setOpen] = createSignal(false);
  const count = () => props.row.provenance.length;
  const effects = () => (props.row.kind === 'gate' ? props.row.effects : []);
  const values = () => (props.row.kind === 'gate' ? props.row.values : null);
  const says = () => effects().length > 0 || values() !== null;
  const label = () => (says() ? 'What it does and where it was read' : 'Where it was read');
  return (
    <details class="text-xs" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary class="cursor-pointer text-neutral-500 select-none hover:text-neutral-800 dark:hover:text-neutral-200">
        {count() === 1 ? label() : `${label()} (${count()} sites)`}
      </summary>
      <Show when={effects().length > 0}>
        <Effects effects={effects()} open={open()} />
      </Show>
      <Show when={values()}>
        {(sentence) => (
          <p data-testid="values" class="mb-2">
            {sentence()}
          </p>
        )}
      </Show>
      <ul data-testid="evidence" class="mt-1 space-y-0.5 text-neutral-500">
        <For each={props.row.provenance}>{(p) => <li>{siteLine(p)}</li>}</For>
      </ul>
    </details>
  );
}
