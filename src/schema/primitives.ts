// The field shapes every row kind and file shares (DESIGN, "Row schemas" and "Files").
import { z } from 'zod';
import { cmpVersion } from '../lib/versions.ts';

export const versionString = z.string().regex(/^\d+\.\d+\.\d+$/, 'must be a version X.Y.Z');
export const slugString = z.string().regex(/^[a-z0-9-]+$/, 'must match [a-z0-9-]+');
export const sha256String = z.string().regex(/^[0-9a-f]{64}$/, 'must be 64 lowercase hex characters');
export const eventName = z.string().regex(/^tengu_[a-z0-9_]+$/, 'must be a tengu_[a-z0-9_]+ name');
export const text = z.string().min(1, 'must be a non-empty string');
export const count = z.int().min(0);

export const direction = z.enum(['both', 'on', 'off']);
export type Direction = z.infer<typeof direction>;

// A sentence ends at ., ! or ? followed by whitespace; DESIGN caps each sentence of `what` below 160 characters.
const SENTENCE_END = /(?<=[.!?])\s+/;
export const MAX_SENTENCE = 160;
export function longestSentence(s: string): number {
  return Math.max(...s.split(SENTENCE_END).map((part) => part.length));
}

// A read taken in a build other than darwin-arm64 names that build's platform, as in `win32-x64`.
export const platformString = z
  .string()
  .regex(/^(darwin|linux|win32)-(x64|arm64)(-musl)?$/, 'must be a platform such as win32-x64');

// An offset is the whole of the evidence a row carries about the binary; no bytes of the build are published.
export const provenanceEntry = z.strictObject({
  version: versionString,
  offset: count,
  role: z.enum(['read', 'binding']).optional(),
  platform: platformString.optional(),
});
export type Provenance = z.infer<typeof provenanceEntry>;

// The fields every row kind carries, before its kind adds its own.
export const commonFields = {
  slug: slugString,
  name: text,
  what: text
    .refine((s) => longestSentence(s) < MAX_SENTENCE, `has a sentence of ${MAX_SENTENCE} characters or more`)
    .nullable(),
  whatBasis: z.enum(['read', 'inferred']).nullable(),
  provenance: z.array(provenanceEntry).min(1, 'a row without an offset is not a row: needs one {version, offset}'),
};

export const floor = z
  .strictObject({
    build: versionString,
    previousRung: versionString.nullable(),
    basis: z.literal('literal'),
  })
  .refine((f) => f.previousRung === null || cmpVersion(f.previousRung, f.build) < 0, {
    message: 'must be older than floor.build',
    path: ['previousRung'],
  });

// The checks a row of any kind owes beyond its shape: `whatBasis` is null exactly when `what` is.
export function refineCommon(row: { what: string | null; whatBasis: string | null }, ctx: z.RefinementCtx): void {
  if ((row.what === null) !== (row.whatBasis === null)) {
    ctx.addIssue({ code: 'custom', path: ['whatBasis'], message: 'is null exactly when what is null' });
  }
}

// A per-version row's floor cannot postdate the version the row was read in.
export function refineFloorIn(version: string, build: string, ctx: z.RefinementCtx): void {
  if (cmpVersion(build, version) > 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['floor', 'build'],
      message: `is newer than the version ${version} the row is in`,
    });
  }
}
