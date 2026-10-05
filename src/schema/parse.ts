// Turning a parse into the one violation a reader acts on: the file, the row, the slug and the field, in that order.
import type { z } from 'zod';

export interface Violation {
  file: string;
  // An array index for a row file, a key for a keyed file, null for a file-level fault.
  row: number | string | null;
  slug: string | null;
  field: string | null;
  message: string;
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; violation: Violation };

export function formatViolation(v: Violation): string {
  const where = [v.file];
  if (v.row !== null) where.push(`row ${v.row}`);
  if (v.slug !== null) where.push(`slug ${v.slug}`);
  if (v.field !== null) where.push(`field ${v.field}`);
  return `${where.join(': ')}: ${v.message}`;
}

// ['provenance', 0, 'offset'] reads as provenance[0].offset.
export function fieldOf(path: readonly PropertyKey[]): string | null {
  let out = '';
  for (const part of path) {
    if (typeof part === 'number') out += `[${part}]`;
    else out += out === '' ? String(part) : `.${String(part)}`;
  }
  return out === '' ? null : out;
}

function slugOf(raw: unknown): string | null {
  if (raw === null || typeof raw !== 'object' || !('slug' in raw)) return null;
  return typeof raw.slug === 'string' ? raw.slug : null;
}

function issueField(issue: z.core.$ZodIssue, path: readonly PropertyKey[]): string | null {
  // An unknown key is named itself, because the object holding it is not the fault.
  if (issue.code === 'unrecognized_keys') return fieldOf([...path, issue.keys[0] ?? '?']);
  return fieldOf(path);
}

function issueMessage(issue: z.core.$ZodIssue): string {
  if (issue.code === 'unrecognized_keys') return 'is not a key this shape has';
  return issue.message;
}

// A file whose top level is an array of rows: each row is parsed alone, so the violation names its index and slug.
export function parseRows<T>(file: string, schema: z.ZodType<T>, raw: unknown): Parsed<T[]> {
  if (!Array.isArray(raw)) {
    return { ok: false, violation: { file, row: null, slug: null, field: null, message: 'must be an array of rows' } };
  }
  const rows: T[] = [];
  for (const [i, item] of raw.entries()) {
    const r = schema.safeParse(item);
    if (!r.success) {
      const issue = r.error.issues[0];
      const violation: Violation = {
        file,
        row: i,
        slug: slugOf(item),
        field: issue ? issueField(issue, issue.path) : null,
        message: issue ? issueMessage(issue) : 'does not parse',
      };
      return { ok: false, violation };
    }
    rows.push(r.data);
  }
  return { ok: true, value: rows };
}

// Any other file: a leading index or key in the issue path becomes the row, the rest the field.
export function parseFile<T>(file: string, schema: z.ZodType<T>, raw: unknown): Parsed<T> {
  const r = schema.safeParse(raw);
  if (r.success) return { ok: true, value: r.data };
  const issue = r.error.issues[0];
  if (!issue) return { ok: false, violation: { file, row: null, slug: null, field: null, message: 'does not parse' } };
  let path: readonly PropertyKey[] = issue.path;
  let row: number | string | null = null;
  if (path[0] === 'versions' && typeof path[1] === 'number') {
    row = path[1];
    path = path.slice(2);
  } else if (typeof path[0] === 'number' || (typeof path[0] === 'string' && path.length > 1)) {
    row = path[0];
    path = path.slice(1);
  }
  return {
    ok: false,
    violation: { file, row, slug: null, field: issueField(issue, path), message: issueMessage(issue) },
  };
}
