import { createMemo, For, Show } from 'solid-js';
import type { RowItem } from '../data/load.ts';
import { controlFor } from '../lib/controls.ts';
import { greyReason, metaLine, workaroundLines } from '../lib/rowtext.ts';
import type { Row } from '../lib/search.ts';
import type { ChangeRow } from '../schema/change.ts';
import { Evidence } from './Evidence.tsx';
import { ValueControl } from './ValueControl.tsx';

export interface FlagRowProps {
  item: RowItem;
  version: string;
  value: string | undefined;
  visible: boolean;
  jumpTarget: boolean;
  onSet: (value: string) => void;
}

export function FlagRow(props: FlagRowProps) {
  // A row gone from this version keeps its text for the record but offers no switch.
  const control = createMemo(() => (props.item.goneSince === null ? controlFor(props.item.row) : null));
  const grey = () => control() === null;
  return (
    <tr
      id={props.item.row.slug}
      data-id={props.item.row.slug}
      data-kind={props.item.row.kind}
      data-grey={grey() ? 'true' : 'false'}
      hidden={!props.visible}
      class={[
        'scroll-mt-32 border-b border-neutral-100 align-top dark:border-neutral-900',
        {
          'bg-neutral-50 text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400': grey(),
          'bg-sky-50 dark:bg-sky-950/40': !grey() && props.value !== undefined,
          'jump-target outline-2 outline-amber-400': props.jumpTarget,
        },
      ]}
    >
      <td class="py-2 pr-3">
        <a href={`#${props.item.row.slug}`} class="font-mono font-medium break-all hover:underline">
          {props.item.row.name}
        </a>
        <div class="mt-1 text-xs text-neutral-500">{metaLine(props.item.row)}</div>
      </td>
      <td class="space-y-1.5 py-2 pr-3">
        <WhatCell row={props.item.row} goneSince={props.item.goneSince} grey={grey()} version={props.version} />
        <Evidence row={props.item.row} />
      </td>
      <td class="py-2">
        <ValueControl
          row={props.item.row}
          control={control()}
          gone={props.item.goneSince !== null}
          value={props.value}
          onSet={props.onSet}
        />
      </td>
    </tr>
  );
}

function WhatCell(props: { row: Row; goneSince: string | null; grey: boolean; version: string }) {
  const inert = () => props.row.kind === 'env' && props.row.inert !== null;
  const change = () => (props.row.kind === 'change' ? props.row : null);
  const prerequisites = () => (props.row.kind === 'gate' ? props.row.prerequisites : []);
  return (
    <>
      <Show when={props.row.what !== null || !inert()}>
        <p>{props.row.what ?? 'No description yet.'}</p>
      </Show>
      <Show when={props.row.what !== null && props.row.whatBasis === 'inferred'}>
        <p class="text-xs text-neutral-500 italic">
          Inferred from the name and the strings near it. The branch was not read.
        </p>
      </Show>
      <Show
        when={props.goneSince}
        fallback={
          <Show when={props.grey}>
            <p data-testid="reason" class="text-xs">
              {greyReason(props.row)}
            </p>
          </Show>
        }
      >
        {(since) => (
          <p data-testid="reason" class="text-xs">
            Not in {props.version}. Last seen in {since()}.
          </p>
        )}
      </Show>
      <Show when={change()}>{(c) => <ChangeDetails row={c()} />}</Show>
      <For each={prerequisites()}>
        {(p) => (
          <p class="text-xs">
            Only matters with {p.key} set: {p.note}
          </p>
        )}
      </For>
    </>
  );
}

function ChangeDetails(props: { row: ChangeRow }) {
  return (
    <>
      <p class="text-xs">{props.row.mechanism}</p>
      <ul data-testid="workarounds" class="list-none space-y-1 text-xs">
        <For each={workaroundLines(props.row)}>
          {(w) => (
            <li>
              <span class="mr-1 rounded bg-neutral-200 px-1 font-mono text-[0.7rem] uppercase dark:bg-neutral-800">
                {w.kind}
              </span>
              {w.text}
            </li>
          )}
        </For>
      </ul>
      <Show when={props.row.changelog}>
        {(cl) => (
          <p class="text-xs">
            Changelog {cl().version}: <q>{cl().quote}</q>
          </p>
        )}
      </Show>
    </>
  );
}
