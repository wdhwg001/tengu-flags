import { For } from 'solid-js';
import type { Row } from '../lib/search.ts';

const fmt = (n: number): string => n.toLocaleString('en-US');

// A site is named by its build and its byte offset and nothing else: the page shows no bytes of the binary.
function siteLine(p: Row['provenance'][number]): string {
  const build =
    p.platform === undefined ? `Claude Code ${p.version}` : `Claude Code ${p.version} (${p.platform} build)`;
  const role = p.role === 'binding' ? ', the binding that decides the value' : '';
  return `${build}, byte offset ${fmt(p.offset)}${role}`;
}

export function Evidence(props: { row: Row }) {
  const count = () => props.row.provenance.length;
  return (
    <details class="text-xs">
      <summary class="cursor-pointer text-neutral-500 select-none hover:text-neutral-800 dark:hover:text-neutral-200">
        {count() === 1 ? 'Where it was read' : `Where it was read (${count()} sites)`}
      </summary>
      <ul data-testid="evidence" class="mt-1 space-y-0.5 text-neutral-500">
        <For each={props.row.provenance}>{(p) => <li>{siteLine(p)}</li>}</For>
      </ul>
    </details>
  );
}
