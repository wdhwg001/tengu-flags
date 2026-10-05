// A `change` row: a behaviour that moved between versions with no runtime switch (DESIGN, "Row schemas").
import { z } from 'zod';
import { cmpVersion } from '../lib/versions.ts';
import { commonFields, refineCommon, text, versionString } from './primitives.ts';

export const enteredAt = z
  .strictObject({
    version: versionString,
    lowerBound: versionString,
    method: z.enum(['bisect', 'cached-rung', 'changelog']),
  })
  .refine((e) => cmpVersion(e.lowerBound, e.version) < 0, {
    message: 'must be older than enteredAt.version',
    path: ['lowerBound'],
  });

// `none` is a real entry; its `since` is read as enteredAt.version when absent.
export const workaround = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('none'), text, since: versionString.optional() }),
  z.strictObject({ kind: z.enum(['flag', 'env', 'entrypoint', 'settings']), text }),
]);
export type Workaround = z.infer<typeof workaround>;

export const changeRow = z
  .strictObject({
    ...commonFields,
    kind: z.literal('change'),
    surface: z.enum(['tool', 'command', 'hook-event', 'settings-key', 'env', 'gate', 'default']),
    direction: z.enum(['removed', 'added', 'renamed', 'graduated', 'default-changed']),
    enteredAt,
    mechanism: text,
    workarounds: z.array(workaround).min(1, 'a {"kind": "none"} entry stands for no workaround'),
    changelog: z.strictObject({ version: versionString, quote: text }).nullable(),
  })
  .superRefine(refineCommon);
export type ChangeRow = z.infer<typeof changeRow>;
