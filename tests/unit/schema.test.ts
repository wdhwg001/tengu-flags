import { describe, expect, it } from 'vitest';
import { changeRow } from '../../src/schema/change.ts';
import { checkVersionRows } from '../../src/schema/consistency.ts';
import { type EnvRow, envRowSchema } from '../../src/schema/env.ts';
import { type GateRow, gateRowSchema } from '../../src/schema/gate.ts';
import { formatViolation, parseRows } from '../../src/schema/parse.ts';
import { changes, env, gates, VERSION } from './real-data.ts';

const clone = <T>(x: T): T => structuredClone(x);
const gateSchema = gateRowSchema(VERSION);
const envSchema = envRowSchema(VERSION);

function firstViolation(rows: unknown[], schema: Parameters<typeof parseRows>[1]): string {
  const parsed = parseRows('rows.json', schema, rows);
  return parsed.ok ? 'accepted' : formatViolation(parsed.violation);
}

function versionCheck(g: GateRow[], e: EnvRow[]): string {
  const v = checkVersionRows({ version: VERSION, gatesFile: 'gates.json', gates: g, envFile: 'env.json', env: e });
  return v === null ? 'accepted' : formatViolation(v);
}

describe('the schemas accept the committed data', () => {
  it('parses every row', () => {
    expect(gates).toHaveLength(818);
    expect(env).toHaveLength(1345);
    expect(changes).toHaveLength(910);
    expect(versionCheck(gates, env)).toBe('accepted');
  });
});

describe('the schemas refuse what the old validator refused', () => {
  it('names an unknown key in a closed object', () => {
    const rows = clone(env);
    Object.assign(rows[10] ?? {}, { documentedUrl: 'https://example.com' });
    expect(firstViolation(rows, envSchema)).toMatch(/^rows\.json: row 10: slug \S+: field documentedUrl: /);
  });

  it('refuses an inert variable marked as describing the host', () => {
    const rows = clone(env);
    const i = rows.findIndex((r) => r.inert !== null);
    Object.assign(rows[i] ?? {}, { hostContext: true });
    expect(firstViolation(rows, envSchema)).toContain(`row ${i}: slug ${rows[i]?.slug}: field hostContext:`);
  });

  it('refuses a gate override keyed on an inert variable', () => {
    const g = clone(gates);
    const inert = env.find((r) => r.inert !== null);
    const target = g.find((r) => r.override?.[0]?.shape === 'env');
    const first = target?.override?.[0];
    if (!inert || !target || !first) throw new Error('the data holds no such rows');
    first.key = inert.name;
    expect(versionCheck(g, env)).toContain(
      `slug ${target.slug}: field override[0].key: ${inert.name} is an inert env row`,
    );
  });

  it('refuses a slug used twice in one version', () => {
    const g = clone(gates);
    const dup = clone(g[5]);
    if (!dup) throw new Error('the data holds no sixth gate');
    g.push(dup);
    expect(versionCheck(g, env)).toBe(
      `gates.json: row ${g.length - 1}: slug ${dup.slug}: field slug: already used by a gate row in ${VERSION}`,
    );
  });

  it('refuses a gate slug that does not derive from its name', () => {
    const rows = clone(gates);
    Object.assign(rows[0] ?? {}, { slug: 'renamed' });
    expect(firstViolation(rows, gateSchema)).toContain('field slug: must be the identifier without tengu_');
  });

  it('refuses a provenance list with no entry', () => {
    const rows = clone(changes);
    Object.assign(rows[0] ?? {}, { provenance: [] });
    expect(firstViolation(rows, changeRow)).toContain('field provenance: a row without an offset is not a row');
  });

  it('refuses a what sentence of 160 characters or more', () => {
    const rows = clone(gates);
    Object.assign(rows[0] ?? {}, { what: `${'x'.repeat(170)}.` });
    expect(firstViolation(rows, gateSchema)).toContain('field what: has a sentence of 160 characters or more');
  });
});
