import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { changesFor, cmpVersion } from '../../src/lib/versions.ts';
import { changes, fixture } from './real-data.ts';

describe('cmpVersion', () => {
  it('orders numeric parts as numbers', () => {
    expect(cmpVersion('2.1.99', '2.1.100')).toBeLessThan(0);
    expect(cmpVersion('2.1.287', '2.1.287')).toBe(0);
    expect(cmpVersion('2.0.0', '1.0.60')).toBeGreaterThan(0);
  });

  it('reads a missing part as zero', () => {
    expect(cmpVersion('2.1', '2.1.0')).toBe(0);
  });
});

describe('changesFor over the real change rows', () => {
  it.each(fixture.changeSelection)('selects what the page logic on main selected for $version', (probe) => {
    const slugs = changesFor(changes, probe.version).map((c) => c.slug);
    expect(slugs).toHaveLength(probe.count);
    expect(createHash('sha256').update(slugs.join('\n')).digest('hex')).toBe(probe.slugsSha256);
  });
});
