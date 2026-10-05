// A `gate` row: a tengu_* feature gate read through the GrowthBook reader (DESIGN, "Row schemas").
import { z } from 'zod';
import { gateEffect } from './effect.ts';
import { commonFields, direction, floor, refineCommon, refineFloorIn, text } from './primitives.ts';

export const gateOverride = z.strictObject({
  shape: z.enum(['env', 'settings']),
  key: text,
  direction,
  note: text.optional(),
});
export type GateOverride = z.infer<typeof gateOverride>;

export const prerequisite = z.strictObject({
  kind: z.enum(['env', 'flag', 'settings']),
  key: text,
  note: text,
});

// The read site's second argument: a JSON value as written, an expression as {expr}, or {unknown} with the reason.
// A plain JSON object may itself be the default, so an object holding `expr` or `unknown` must hold nothing else.
const gateDefault = z.json().superRefine((value, ctx) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return;
  for (const key of ['expr', 'unknown'] as const) {
    if (!(key in value)) continue;
    const inner = value[key];
    if (typeof inner !== 'string' || inner.length === 0 || Object.keys(value).length !== 1) {
      ctx.addIssue({ code: 'custom', path: [key], message: `must be the only key, holding a non-empty string` });
    }
  }
});

const uniqueStrings = (list: readonly string[]): boolean => new Set(list).size === list.length;

const gateShape = z.strictObject({
  ...commonFields,
  kind: z.literal('gate'),
  classes: z
    .array(z.enum(['gate', 'config-key', 'event']))
    .refine((c) => c.includes('gate') && uniqueStrings(c), 'must hold "gate" plus optionally "config-key" and "event"'),
  default: gateDefault,
  valueSource: z
    .array(z.enum(['growthbook', 'clientdata', 'config']))
    .min(1)
    .refine(uniqueStrings, 'must not repeat a source'),
  cacheReach: z.enum(['full', 'partial', 'none', 'direct']),
  override: z.array(gateOverride).min(1, 'is null when there is none, never an empty array').nullable(),
  prerequisites: z.array(prerequisite),
  // An empty array is a row whose effect was not read.
  effects: z.array(gateEffect),
  // How the served value, the model's own configuration and the override compose, when the gate is not a plain boolean.
  values: text.nullable(),
  floor,
});
export type GateRow = z.infer<typeof gateShape>;

export function gateRowSchema(version: string) {
  return gateShape.superRefine((row, ctx) => {
    refineCommon(row, ctx);
    const want = row.name.replace(/^tengu_/, '').replace(/_/g, '-');
    if (!row.name.startsWith('tengu_') || row.slug !== want) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: `must be the identifier without tengu_ and with _ as - ("${want}")`,
      });
    }
    refineFloorIn(version, row.floor.build, ctx);
  });
}
