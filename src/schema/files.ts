// The non-row files: index.json, meta.json, events.json and the search corpus (DESIGN, "Files").
import { z } from 'zod';
import { count, eventName, sha256String, text, versionString } from './primitives.ts';

export const versionEntry = z.strictObject({
  version: versionString,
  sha256: sha256String,
  readAt: z.iso.datetime().nullable(),
  counts: z.strictObject({ gates: count, env: count, changes: count, events: count }),
});
export type VersionEntry = z.infer<typeof versionEntry>;

export const indexFile = z.strictObject({ versions: z.array(versionEntry).min(1, 'must list at least one version') });
export type IndexFile = z.infer<typeof indexFile>;

export const metaFile = z.strictObject({
  version: versionString,
  sha256: sha256String,
  readAt: z.iso.datetime().nullable(),
});
export type MetaFile = z.infer<typeof metaFile>;

// Sorted and without repeats, so a reader can bisect it and a diff of two versions reads line by line.
export const eventsFile = z.array(eventName).superRefine((names, ctx) => {
  names.forEach((name, i) => {
    const before = names[i - 1];
    if (before !== undefined && !(before < name)) {
      ctx.addIssue({ code: 'custom', path: [i], message: `not sorted or repeated after "${before}"` });
    }
  });
});

// One document per gate, env and change row and per telemetry event, written by tools/build-data.ts.
export const searchDoc = z.strictObject({
  id: text,
  kind: z.enum(['gate', 'env', 'change', 'event']),
  name: z.string(),
  slug: z.string(),
  what: z.string(),
  key: z.string(),
  work: z.string(),
});
export type SearchDoc = z.infer<typeof searchDoc>;
export const searchCorpus = z.array(searchDoc);
