// What a gate changes, as a person reads it under the row's `what` sentence (DESIGN, "Row schemas": `effects`).
// Five kinds, each a closed object discriminated on `kind`; every one says which gate state or value produces it.
import { z } from 'zod';
import { text } from './primitives.ts';

// `on` and `off` are the two states of a boolean gate. Any other state is a value word: the served value that
// produces the effect, written as one lowercase token (`cohort`, `forced`, `3`, `0.5`), never a phrase, because a
// condition that needs words belongs in `where`, `summary` or the row's `values` sentence. `true` and `false` are
// refused so a boolean state has one spelling.
export const EFFECT_WHEN = /^[a-z0-9][a-z0-9._-]{0,39}$/;
export const effectWhen = z
  .string()
  .regex(EFFECT_WHEN, 'must be "on", "off" or one lowercase value word such as "cohort"')
  .refine((w) => w !== 'true' && w !== 'false', 'spells a boolean state "on" or "off"');

// A sentence or passage the gate inserts, removes or replaces in a prompt or tool description, verbatim.
export const promptEffect = z.strictObject({
  kind: z.literal('prompt'),
  when: effectWhen,
  where: text,
  text,
});

// A line the person sees, verbatim, and where it shows.
export const uiEffect = z.strictObject({
  kind: z.literal('ui'),
  when: effectWhen,
  where: text,
  text,
});

// A branch the gate decides: the operation, one sentence, and a flowchart in the project's own node labels.
// tools/validate.ts holds the Mermaid string to the flowchart rule of tools/lib/mermaid.ts.
export const flowEffect = z.strictObject({
  kind: z.literal('flow'),
  when: effectWhen,
  where: text,
  summary: text,
  mermaid: text,
});

// A number or string the gate parameterises; `unit` is present only where one applies.
export const valueEffect = z.strictObject({
  kind: z.literal('value'),
  when: effectWhen,
  name: text,
  unit: text.optional(),
});

// A gate that changes only what is logged.
export const telemetryEffect = z.strictObject({
  kind: z.literal('telemetry'),
  when: effectWhen,
  summary: text,
});

export const gateEffect = z.discriminatedUnion('kind', [
  promptEffect,
  uiEffect,
  flowEffect,
  valueEffect,
  telemetryEffect,
]);
export type GateEffect = z.infer<typeof gateEffect>;
export type EffectKind = GateEffect['kind'];
