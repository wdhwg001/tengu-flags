import { For, Match, Switch } from 'solid-js';
import type { Control } from '../lib/controls.ts';
import type { Row } from '../lib/search.ts';

const FIELD = 'w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900';

export function ValueControl(props: {
  row: Row;
  control: Control | null;
  gone: boolean;
  value: string | undefined;
  onSet: (value: string) => void;
}) {
  const label = () => `Value for ${props.row.name}`;
  const states = () => (props.control?.type === 'states' ? props.control.states : null);
  const text = () => (props.control?.type === 'text' ? props.control : null);
  return (
    <Switch fallback={<span class="text-xs">No switch</span>}>
      <Match when={props.gone}>
        <span class="text-xs">Not in this version</span>
      </Match>
      <Match when={states()}>
        {(list) => (
          <select
            data-control="states"
            class={FIELD}
            aria-label={label()}
            onChange={(e) => props.onSet(e.currentTarget.value)}
          >
            <option value="" selected={props.value === undefined}>
              Default
            </option>
            <For each={list()}>
              {(st) => (
                <option value={st.value} selected={props.value === st.value}>
                  {st.label}
                </option>
              )}
            </For>
          </select>
        )}
      </Match>
      <Match when={text()}>
        {(t) => (
          <input
            data-control="text"
            type="text"
            class={FIELD}
            placeholder="Unset"
            aria-label={label()}
            inputmode={t().numeric ? 'numeric' : 'text'}
            spellcheck="false"
            value={props.value ?? ''}
            onChange={(e) => props.onSet(e.currentTarget.value.trim())}
          />
        )}
      </Match>
    </Switch>
  );
}
