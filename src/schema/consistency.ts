// The checks that need more than one row: a slug used twice, an override naming a gate or variable it cannot reach.
import type { ChangeRow } from './change.ts';
import type { EnvRow } from './env.ts';
import type { GateRow } from './gate.ts';
import type { Violation } from './parse.ts';

export interface VersionRows {
  version: string;
  gatesFile: string;
  gates: readonly GateRow[];
  envFile: string;
  env: readonly EnvRow[];
}

export function duplicateSlug(v: VersionRows): Violation | null {
  const seen = new Map<string, string>();
  const files: [string, readonly (GateRow | EnvRow)[]][] = [
    [v.gatesFile, v.gates],
    [v.envFile, v.env],
  ];
  for (const [file, rows] of files) {
    for (const [i, r] of rows.entries()) {
      const owner = seen.get(r.slug);
      if (owner !== undefined) {
        return { file, row: i, slug: r.slug, field: 'slug', message: `already used by ${owner} in ${v.version}` };
      }
      seen.set(r.slug, `a ${r.kind} row`);
    }
  }
  return null;
}

// An env row may only name a gate of its own version.
export function unknownOverriddenGate(v: VersionRows): Violation | null {
  const gateSlugs = new Set(v.gates.map((g) => g.slug));
  for (const [i, r] of v.env.entries()) {
    for (const [j, o] of r.overrides.entries()) {
      if (!gateSlugs.has(o.gate)) {
        return {
          file: v.envFile,
          row: i,
          slug: r.slug,
          field: `overrides[${j}].gate`,
          message: `gate "${o.gate}" is not a gate row of ${v.version}`,
        };
      }
    }
  }
  return null;
}

// An override keyed on an inert variable does nothing, so a gate row may not offer it.
export function overrideOnInert(v: VersionRows): Violation | null {
  const inert = new Map(v.env.filter((r) => r.inert !== null).map((r) => [r.name, r.inert]));
  for (const [i, g] of v.gates.entries()) {
    for (const [j, o] of (g.override ?? []).entries()) {
      const why = inert.get(o.key);
      if (o.shape === 'env' && why !== undefined) {
        return {
          file: v.gatesFile,
          row: i,
          slug: g.slug,
          field: `override[${j}].key`,
          message: `${o.key} is an inert env row, so the override does nothing: ${why}`,
        };
      }
    }
  }
  return null;
}

export function checkVersionRows(v: VersionRows): Violation | null {
  return duplicateSlug(v) ?? unknownOverriddenGate(v) ?? overrideOnInert(v);
}

// Change slugs share one namespace with every per-version row of every version.
export function changeSlugClash(
  file: string,
  changes: readonly ChangeRow[],
  versionSlugs: ReadonlyMap<string, string>,
): Violation | null {
  const seen = new Set<string>();
  for (const [i, r] of changes.entries()) {
    if (seen.has(r.slug)) return { file, row: i, slug: r.slug, field: 'slug', message: 'repeated in changes.json' };
    seen.add(r.slug);
    const owner = versionSlugs.get(r.slug);
    if (owner !== undefined)
      return { file, row: i, slug: r.slug, field: 'slug', message: `already used by the ${owner} row` };
  }
  return null;
}
