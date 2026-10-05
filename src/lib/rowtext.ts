// The sentences a row shows besides its own `what`: its meta line, why it has no switch, its workarounds.
import type { ChangeRow } from '../schema/change.ts';
import type { EnvRow } from '../schema/env.ts';
import type { GateRow } from '../schema/gate.ts';
import type { Row } from './search.ts';

const METHOD: Record<ChangeRow['enteredAt']['method'], string> = {
  bisect: 'dated by bisecting releases',
  'cached-rung': 'dated between two cached releases',
  changelog: 'dated by the official changelog',
};

function defaultText(d: GateRow['default']): string {
  if (d !== null && typeof d === 'object' && !Array.isArray(d)) {
    if (typeof d.expr === 'string') return d.expr;
    if (typeof d.unknown === 'string') return 'unknown';
  }
  return JSON.stringify(d);
}

function gateMeta(row: GateRow): string[] {
  const bits = [`default ${defaultText(row.default)}`];
  for (const o of row.override ?? [])
    bits.push(`${o.shape === 'env' ? 'variable' : 'setting'} ${o.key} (${o.direction})`);
  return bits;
}

function envMeta(row: EnvRow): string[] {
  const bits: string[] = [];
  if (row.type !== null) bits.push(`type ${typeof row.type === 'object' ? 'enum' : row.type}`);
  if (row.inert !== null) bits.push('no effect in this version');
  if (typeof row.documented === 'string' && row.documented !== 'unknown') bits.push('in the official docs');
  else if (row.documented === false) bits.push('not in the official docs');
  return bits;
}

export function metaLine(row: Row): string {
  const bits: string[] = [row.kind === 'env' ? 'variable' : row.kind];
  if (row.kind === 'gate') bits.push(...gateMeta(row));
  if (row.kind === 'env') bits.push(...envMeta(row));
  if (row.kind === 'change') {
    const e = row.enteredAt;
    bits.push(`${row.surface} ${row.direction} in ${e.version}`, `after ${e.lowerBound}, ${METHOD[e.method]}`);
  } else {
    bits.push(`name first seen in ${row.floor.build}`);
  }
  return bits.join(' · ');
}

export function greyReason(row: Row): string {
  if (row.kind === 'gate') {
    const reach =
      row.cacheReach === 'full' || row.cacheReach === 'partial'
        ? ' The frozen-disk mode described at the foot of the page can still set it.'
        : '';
    return `No switch. Claude Code takes this gate from the server, and no variable or setting overrides it.${reach}`;
  }
  if (row.kind === 'env') {
    if (row.inert !== null) return `No switch. ${row.inert}`;
    return 'No switch. This variable describes the machine Claude Code is running on.';
  }
  return `No switch. This changed in ${row.enteredAt.version}, and no gate decides it.`;
}

export interface WorkaroundLine {
  kind: ChangeRow['workarounds'][number]['kind'];
  text: string;
}

export function workaroundLines(row: ChangeRow): WorkaroundLine[] {
  return row.workarounds.map((w) => ({ kind: w.kind, text: w.text }));
}
