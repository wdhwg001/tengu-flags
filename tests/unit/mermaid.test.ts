import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { jsonStrings } from '../../tools/lib/codeshape.ts';
import { mermaidShape, minifiedId } from '../../tools/lib/mermaid.ts';

const THREE_NODES =
  'flowchart TD\n  start[Session starts] --> ask[Ask the sample service for a layout]\n  ask --> open[Open the panel in that layout]';

describe('the flowchart rule', () => {
  it('accepts a three-node flowchart in prose labels', () => {
    expect(mermaidShape(THREE_NODES)).toBeNull();
  });

  it('accepts capital-letter ids, a decision, link labels and a round node', () => {
    const chart =
      'graph LR\n  A[Session starts] --> B{Gate on?}\n  B -->|yes| C[Insert the reminder (once)]\n  B -- no --> D(Skip it)';
    expect(mermaidShape(chart)).toBeNull();
  });

  it('refuses a label carrying a minified read site', () => {
    const chart = 'flowchart TD\n  A[Session starts] --> B[k("tengu_x",!1) is true]\n  B --> C[Insert the reminder]';
    expect(mermaidShape(chart)).toEqual({ name: 'call in a label', match: 'k(' });
  });

  it('refuses a label carrying a minified call', () => {
    const chart = 'flowchart TD\n  A[Session starts] --> B[Ce( decides]\n  B --> C[Done]';
    expect(mermaidShape(chart)).toEqual({ name: 'call in a label', match: 'Ce(' });
  });

  it('refuses a node named by a minified identifier', () => {
    expect(mermaidShape('flowchart TD\n  A[Start] --> Ce[Check the gate]')).toEqual({
      name: 'minified identifier as a node',
      match: 'Ce',
    });
    expect(mermaidShape('flowchart TD\n  k --> B[Done]')?.name).toBe('minified identifier as a node');
  });

  it('refuses a diagram that is not a flowchart', () => {
    expect(mermaidShape('sequenceDiagram\n  A->>B: hello')?.name).toBe('not a flowchart');
  });

  it('reads a token as minified by its shape', () => {
    for (const t of ['Ce', 'k', '$no', 'Hno', '_9', 'e2']) expect(minifiedId(t), t).toBe(true);
    for (const t of ['A', 'B2', 'ask', 'end', 'start', 'Session']) expect(minifiedId(t), t).toBe(false);
  });
});

describe('the specimen row', () => {
  it('passes the rule, and the validator reaches every string of its effects and values', () => {
    const rows: unknown = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', '..', 'sample', 'versions', '2.1.287', 'gates.json'), 'utf8'),
    );
    const paths = new Map(jsonStrings(rows));
    const at = (suffix: string): string[] => [...paths].filter(([p]) => p.endsWith(suffix)).map(([, s]) => s);
    expect(at('.mermaid')).toHaveLength(1);
    for (const chart of at('.mermaid')) expect(mermaidShape(chart)).toBeNull();
    for (const field of ['.text', '.summary', '.where', '].values']) expect(at(field).length, field).toBeGreaterThan(0);
  });
});
