import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { type GateRow, gateRowSchema } from '../../src/schema/gate.ts';
import { formatViolation, parseRows } from '../../src/schema/parse.ts';

const VERSION = '2.1.287';
const schema = gateRowSchema(VERSION);
const sample: unknown = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', 'sample', 'versions', VERSION, 'gates.json'), 'utf8'),
);
const rows = schema.array().parse(sample);
const specimen = rows.find((r) => r.slug === 'sample-zeta');
if (specimen === undefined) throw new Error('the sample tree holds no sample-zeta row');

// The specimen with its first effect replaced, as raw JSON the way a data file would carry it.
function withEffect(effect: unknown): unknown[] {
  const row = structuredClone(specimen) as Record<string, unknown>;
  row.effects = [effect];
  return [row];
}

function verdict(raw: unknown[]): string {
  const parsed = parseRows('gates.json', schema, raw);
  return parsed.ok ? 'accepted' : formatViolation(parsed.violation);
}

describe('the effect schema', () => {
  it('parses one effect of each kind on the specimen row', () => {
    expect(specimen.effects.map((e) => e.kind)).toEqual(['prompt', 'ui', 'flow', 'value', 'telemetry']);
    for (const e of specimen.effects) expect(verdict(withEffect(e)), e.kind).toBe('accepted');
    expect(specimen.values).not.toBeNull();
  });

  it('parses a value effect with no unit', () => {
    expect(verdict(withEffect({ kind: 'value', when: 'cohort', name: 'how many cards show' }))).toBe('accepted');
  });

  it('refuses a fifth kind', () => {
    expect(verdict(withEffect({ kind: 'sound', when: 'on', summary: 'Plays a chime.' }))).toMatch(
      /^gates\.json: row 0: slug sample-zeta: field effects\[0\]\.kind: /,
    );
  });

  it('refuses an effect with no when', () => {
    expect(verdict(withEffect({ kind: 'telemetry', summary: 'Logs one event.' }))).toMatch(
      /field effects\[0\]\.when: /,
    );
  });

  it('refuses a key the kind does not have', () => {
    const e = { kind: 'ui', when: 'on', where: 'the status line', text: 'Ready.', summary: 'A line.' };
    expect(verdict(withEffect(e))).toBe(
      'gates.json: row 0: slug sample-zeta: field effects[0].summary: is not a key this shape has',
    );
  });

  it('takes on, off or one lowercase value word as when, and nothing else', () => {
    for (const when of ['on', 'off', 'cohort', 'forced', '3', '0.5', 'opus-4'])
      expect(verdict(withEffect({ kind: 'telemetry', when, summary: 'Logs.' })), when).toBe('accepted');
    for (const when of ['true', 'false', 'On', 'when on', '', 'cohort!'])
      expect(verdict(withEffect({ kind: 'telemetry', when, summary: 'Logs.' })), when).toMatch(
        /field effects\[0\]\.when: /,
      );
  });

  it('requires effects and values on every gate row', () => {
    const row = structuredClone(specimen) as Partial<GateRow>;
    delete row.values;
    expect(verdict([row])).toMatch(/field values: /);
    const bare = structuredClone(specimen) as Partial<GateRow>;
    delete bare.effects;
    expect(verdict([bare])).toMatch(/field effects: /);
  });
});
