import type { JSX } from '@solidjs/web';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { drawFlowchart } from '../lib/flowchart.ts';
import type { GateEffect } from '../schema/effect.ts';

const BADGE = 'mr-1 rounded bg-neutral-200 px-1 font-mono text-[0.7rem] uppercase dark:bg-neutral-800';
const QUOTE = 'my-1 border-l-2 border-neutral-300 pl-2 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300';
const KIND_LABEL: Record<GateEffect['kind'], string> = {
  prompt: 'prompt',
  ui: 'screen',
  flow: 'flow',
  value: 'value',
  telemetry: 'logging',
};

// `on` and `off` are the gate's two states; any other word is the value the gate is served.
function whenText(when: string): string {
  return when === 'on' || when === 'off' ? `when the gate is ${when}` : `when the gate is served "${when}"`;
}

// What a gate changes, one item per effect, in the order the row lists them. `open` says whether the detail holding
// the list is open, which is when a flowchart is drawn.
export function Effects(props: { effects: readonly GateEffect[]; open: boolean }) {
  return (
    <ul data-testid="effects" class="mt-1 mb-2 space-y-2">
      <For each={props.effects}>
        {(e) => (
          <li data-effect={e.kind}>
            <span class={BADGE}>{KIND_LABEL[e.kind]}</span>
            {effectBody(e, () => props.open)}
          </li>
        )}
      </For>
    </ul>
  );
}

// A row's data never changes once loaded, so the kind is decided once per effect.
function effectBody(e: GateEffect, open: () => boolean): JSX.Element {
  switch (e.kind) {
    case 'prompt':
    case 'ui':
      return (
        <>
          <span>
            In {e.where}, {whenText(e.when)}:
          </span>
          <blockquote data-testid="effect-text" class={QUOTE}>
            {e.text}
          </blockquote>
        </>
      );
    case 'flow':
      return (
        <>
          <span>
            In {e.where}, {whenText(e.when)}: {e.summary}
          </span>
          <Flowchart source={e.mermaid} open={open()} />
        </>
      );
    case 'value':
      return (
        <span>
          Sets {e.name}
          {e.unit === undefined ? '' : `, in ${e.unit}`}, {whenText(e.when)}.
        </span>
      );
    case 'telemetry':
      return (
        <span>
          {e.summary} This happens {whenText(e.when)}.
        </span>
      );
  }
}

// Drawn the first time the detail is open, from the row's own text; the renderer is loaded then and not before.
function Flowchart(props: { source: string; open: boolean }) {
  const [svg, setSvg] = createSignal<string | null>(null);
  const [failed, setFailed] = createSignal(false);
  let started = false;
  createEffect(
    () => props.open,
    (open) => {
      if (!open || started) return;
      started = true;
      drawFlowchart(props.source).then(
        (markup) => setSvg(markup),
        () => setFailed(true),
      );
    },
  );
  return (
    <Show
      when={svg()}
      fallback={<p class="text-neutral-500">{failed() ? 'The flowchart did not draw.' : 'Drawing the flowchart.'}</p>}
    >
      {(markup) => <div data-testid="flowchart" class="my-1 overflow-x-auto" innerHTML={markup()} />}
    </Show>
  );
}
