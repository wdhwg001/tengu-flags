import { For, Show } from 'solid-js';
import type { VersionView } from '../data/load.ts';
import { FlagRow } from './FlagRow.tsx';
import type { FlagsState } from './state.ts';

export function FlagTable(props: { state: FlagsState; view: VersionView }) {
  const visibleCount = () => {
    const m = props.state.matches();
    const rows = props.view.items.filter((it) => m.has(it.row.slug)).length;
    const events = props.state.showEvents() ? props.view.events.filter((e) => m.has(`event:${e}`)).length : 0;
    return rows + events;
  };
  const emptyText = () => {
    const q = props.state.query();
    if (q.trim() === '') return 'This version has no rows.';
    const hint = props.state.showEvents() ? '' : ' Telemetry events are hidden. Turn them on to search them too.';
    return `Nothing matches “${q}” in ${props.view.version}.${hint}`;
  };
  return (
    <>
      <table class="mt-6 w-full table-fixed border-collapse text-sm">
        <thead>
          <tr class="border-b border-neutral-300 text-left text-xs tracking-wide text-neutral-500 uppercase dark:border-neutral-700">
            <th scope="col" class="w-1/4 py-2 pr-3">
              Name
            </th>
            <th scope="col" class="py-2 pr-3">
              What it does
            </th>
            <th scope="col" class="w-44 py-2">
              Value
            </th>
          </tr>
        </thead>
        <tbody id="rows">
          <For each={props.view.items}>
            {(item) => (
              <FlagRow
                item={item}
                version={props.view.version}
                value={props.state.selection()[item.row.slug]}
                visible={props.state.matches().has(item.row.slug)}
                jumpTarget={props.state.jumpTarget() === item.row.slug}
                onSet={(value) => props.state.setValue(item.row.slug, value)}
              />
            )}
          </For>
          <Show when={props.state.showEvents()}>
            <For each={props.view.events}>
              {(name) => <EventRow name={name} visible={props.state.matches().has(`event:${name}`)} />}
            </For>
          </Show>
        </tbody>
      </table>
      <Show when={visibleCount() === 0}>
        <p data-testid="empty" class="my-6 text-neutral-500">
          {emptyText()}
        </p>
      </Show>
    </>
  );
}

function EventRow(props: { name: string; visible: boolean }) {
  return (
    <tr
      data-id={`event:${props.name}`}
      data-kind="event"
      data-grey="true"
      hidden={!props.visible}
      class="border-b border-neutral-100 align-top text-neutral-500 dark:border-neutral-900"
    >
      <td class="py-2 pr-3 font-mono break-all">
        {props.name}
        <div class="mt-1 font-sans text-xs">telemetry event</div>
      </td>
      <td class="py-2 pr-3">A name Claude Code sends when something happens. It switches nothing.</td>
      <td class="py-2 text-xs">No switch</td>
    </tr>
  );
}
