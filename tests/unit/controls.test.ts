import { describe, expect, it } from 'vitest';
import { buildExport, controlFor, exportText } from '../../src/lib/controls.ts';
import { greyReason } from '../../src/lib/rowtext.ts';
import type { Row } from '../../src/lib/search.ts';
import { encodeSelection } from '../../src/lib/selection.ts';
import { env, fixture, gates, VERSION } from './real-data.ts';

function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('the data holds no such row');
  return value;
}

describe('controlFor over the real rows', () => {
  it('gives a control to the rows the page logic on main gave one', () => {
    expect(gates.filter((r) => controlFor(r) !== null)).toHaveLength(fixture.controls.gatesWithControl);
    expect(env.filter((r) => controlFor(r) !== null)).toHaveLength(fixture.controls.envWithControl);
  });

  it('greys exactly the host-describing and inert variables', () => {
    const grey = env.filter((r) => controlFor(r) === null);
    expect(grey.every((r) => r.hostContext || r.inert !== null)).toBe(true);
    expect(grey).toHaveLength(env.filter((r) => r.hostContext).length + env.filter((r) => r.inert !== null).length);
  });

  it('offers one state per override direction', () => {
    const states = (slug: string) => {
      const c = controlFor(must(gates.find((g) => g.slug === slug)));
      return c?.type === 'states' ? c.states.map((s) => s.value) : null;
    };
    expect(states('amber-creek')).toStrictEqual(['on', 'off']);
    expect(states('brick-follow')).toStrictEqual(['on']);
    expect(states('sepia-moth')).toStrictEqual(['off']);
  });

  it('says why a grey row has no switch', () => {
    const inert = must(env.find((r) => r.inert !== null));
    expect(greyReason(inert)).toBe(`No switch. ${inert.inert}`);
  });
});

describe('buildExport over the real rows', () => {
  const bySlug = new Map<string, Row>([...gates, ...env].map((r) => [r.slug, r]));
  const ex = buildExport(fixture.export.selection, bySlug, VERSION);

  it('turns a selection into the env and settings lines the page logic on main wrote', () => {
    expect(ex.env).toStrictEqual(fixture.export.result.env);
    expect(ex.settings).toStrictEqual(fixture.export.result.settings);
    expect(ex.skipped).toStrictEqual(fixture.export.result.skipped);
    expect(ex.version).toBe(VERSION);
  });

  it('encodes the selection to the same link parameter', () => {
    expect(encodeSelection(fixture.export.selection)).toBe(fixture.export.encoded);
  });

  it('renders the env block as settings.json carries it', () => {
    const { envBlock, settingsBlock } = exportText(ex);
    expect(JSON.parse(envBlock)).toStrictEqual({ env: fixture.export.result.env });
    expect(JSON.parse(`{${settingsBlock}}`)).toStrictEqual(fixture.export.result.settings);
  });
});
