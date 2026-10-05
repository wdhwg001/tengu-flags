// What a row lets a person set, and the settings.json lines a selection turns into.
import type { GateOverride } from '../schema/gate.ts';
import type { Row } from './search.ts';
import type { Selection } from './selection.ts';

export interface State {
  value: string;
  label: string;
}

export type Control = { type: 'states'; states: State[] } | { type: 'text'; numeric: boolean };

// null when the row has no switch. A gate's states are its value ("on" / "off") as far as its overrides reach;
// a variable is its own switch and its parser decides the control. An inert or host-describing variable has none.
export function controlFor(row: Row): Control | null {
  if (row.kind === 'gate') {
    const dirs = new Set((row.override ?? []).map((o) => o.direction));
    if (dirs.size === 0) return null;
    const states: State[] = [];
    if (dirs.has('both') || dirs.has('on')) states.push({ value: 'on', label: 'On' });
    if (dirs.has('both') || dirs.has('off')) states.push({ value: 'off', label: 'Off' });
    return { type: 'states', states };
  }
  if (row.kind === 'env') {
    if (row.hostContext || row.inert !== null || row.type === null) return null;
    const t = row.type;
    if (typeof t === 'object') return { type: 'states', states: t.enum.map((v) => ({ value: v, label: v })) };
    if (t === 'bool' || t === 'triBool') {
      return {
        type: 'states',
        states: [
          { value: '1', label: 'Set to 1' },
          { value: '0', label: 'Set to 0' },
        ],
      };
    }
    return { type: 'text', numeric: t === 'int' };
  }
  return null;
}

// The override an "on" or "off" choice travels by: the first one whose direction allows it.
export function overrideFor(overrides: readonly GateOverride[] | null, state: string): GateOverride | null {
  return (overrides ?? []).find((o) => o.direction === 'both' || o.direction === state) ?? null;
}

export interface ExportResult {
  version: string;
  env: Record<string, string>;
  settings: Record<string, boolean>;
  // Slugs kept in the link that this version has no switch for.
  skipped: string[];
}

function exportGate(out: ExportResult, overrides: readonly GateOverride[] | null, slug: string, value: string): void {
  const o = overrideFor(overrides, value);
  if (o === null) {
    out.skipped.push(slug);
    return;
  }
  // `VAR ?? read()` takes the variable's value both ways; `VAR || read()` and `if (VAR) return false`
  // only ask whether the variable is set.
  if (o.shape === 'env') out.env[o.key] = o.direction === 'both' ? (value === 'on' ? '1' : '0') : '1';
  else out.settings[o.key] = o.direction === 'both' ? value === 'on' : o.direction === 'on';
}

export function buildExport(sel: Selection, rowsBySlug: ReadonlyMap<string, Row>, version: string): ExportResult {
  const out: ExportResult = { version, env: {}, settings: {}, skipped: [] };
  for (const slug of Object.keys(sel).sort()) {
    const row = rowsBySlug.get(slug);
    const value = sel[slug];
    if (row === undefined || value === undefined || controlFor(row) === null) {
      out.skipped.push(slug);
      continue;
    }
    if (row.kind === 'env') out.env[row.name] = value;
    else if (row.kind === 'gate') exportGate(out, row.override, slug, value);
  }
  return out;
}

// The `env` object as it sits in settings.json, and the settings keys as lines to paste at its top level.
export function exportText(ex: ExportResult): { envBlock: string; settingsBlock: string } {
  const envBlock = JSON.stringify({ env: ex.env }, null, 2);
  const settingsBlock = Object.entries(ex.settings)
    .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n');
  return { envBlock, settingsBlock };
}
