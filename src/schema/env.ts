// An `env` row: an environment variable the client reads (DESIGN, "Row schemas").
import { z } from 'zod';
import { commonFields, direction, floor, refineCommon, refineFloorIn, slugString, text } from './primitives.ts';

export const envType = z.union([
  z.enum(['bool', 'triBool', 'int', 'str', 'direct']),
  z.strictObject({ enum: z.array(text).min(1) }),
]);
export type EnvType = z.infer<typeof envType>;

export const envOverride = z.strictObject({ gate: slugString, direction });

const envShape = z.strictObject({
  ...commonFields,
  kind: z.literal('env'),
  // null only on an inert row: a variable read only through an empty registry reaches no parser.
  type: envType.nullable(),
  documented: z.union([
    z.url({ protocol: /^https$/, error: 'must be the https URL of the page that lists it' }),
    z.literal(false),
    z.literal('unknown'),
  ]),
  overrides: z.array(envOverride),
  hostContext: z.boolean(),
  inert: text.nullable(),
  floor,
});
export type EnvRow = z.infer<typeof envShape>;

export function envRowSchema(version: string) {
  return envShape.superRefine((row, ctx) => {
    refineCommon(row, ctx);
    const want = row.name.toLowerCase().replace(/_/g, '-');
    if (row.slug !== want) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: `must be the variable lowercased with _ as - ("${want}")`,
      });
    }
    if (row.type === null && row.inert === null) {
      ctx.addIssue({ code: 'custom', path: ['type'], message: 'is null only on an inert row' });
    }
    // An inert row is greyed by `inert`, so a grey row has one reason, and it overrides nothing.
    if (row.inert !== null && row.hostContext) {
      ctx.addIssue({ code: 'custom', path: ['hostContext'], message: 'must be false on an inert row' });
    }
    if (row.inert !== null && row.overrides.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['overrides'],
        message: 'an inert variable overrides nothing: must be empty',
      });
    }
    refineFloorIn(version, row.floor.build, ctx);
  });
}
