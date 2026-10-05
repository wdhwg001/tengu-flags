import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeSearcher, searchDocs } from '../../src/lib/search.ts';
import { changesFor } from '../../src/lib/versions.ts';
import { gateRowSchema } from '../../src/schema/gate.ts';
import { changes, env, events, fixture, gates, VERSION } from './real-data.ts';

const docs = searchDocs([...gates, ...env, ...changesFor(changes, VERSION)], events);
// The documents as the page logic on main wrote them, which had every field but `effect`.
const withoutEffect = docs.map(({ effect: _effect, ...rest }) => rest);

describe('searchDocs over the real data', () => {
  it('writes the same corpus bytes the page logic on main wrote, the effect field aside', () => {
    const bytes = `${JSON.stringify(withoutEffect)}\n`;
    expect(docs.length).toBe(fixture.searchCorpus.documents);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(fixture.searchCorpus.sha256);
  });

  it('builds the sampled documents field for field', () => {
    for (const sample of fixture.searchCorpus.samples) {
      expect(withoutEffect.find((d) => d.id === sample.id)).toStrictEqual(sample);
    }
  });

  it('has one document per gate, env and change row and per event', () => {
    expect(docs.length).toBe(gates.length + env.length + changesFor(changes, VERSION).length + events.length);
  });
});

describe('makeSearcher', () => {
  const searcher = makeSearcher(docs);

  it('finds the Grep and Glob change row by the word grep', () => {
    expect(searcher.search('grep')).toContain('grep-glob-tools-hidden-on-native-builds');
  });

  it('finds an identifier by a fragment from its middle', () => {
    const hits = searcher.search('global_libvips');
    expect(hits).toContain('env-sharp-force-global-libvips-removed');
  });

  it('finds a gate by the variable that overrides it', () => {
    expect(searcher.search('CLAUDE_CODE_NO_FLICKER')).toEqual(expect.arrayContaining(['amber-creek', 'pewter-brook']));
  });

  it('matches every document on an empty query and lists each id once', () => {
    expect(searcher.search('   ')).toHaveLength(docs.length);
    const hits = searcher.search('tool');
    expect(new Set(hits).size).toBe(hits.length);
  });
});

describe('a gate document carries its effects', () => {
  const sampleGates = gateRowSchema('2.1.287')
    .array()
    .parse(
      JSON.parse(
        readFileSync(join(import.meta.dirname, '..', '..', 'sample', 'versions', '2.1.287', 'gates.json'), 'utf8'),
      ),
    );
  const sampleDocs = searchDocs(sampleGates, []);

  it('writes the specimen row as one document in this shape', () => {
    expect(sampleDocs.find((d) => d.id === 'sample-zeta')).toStrictEqual({
      id: 'sample-zeta',
      kind: 'gate',
      name: 'tengu_sample_zeta',
      slug: 'sample-zeta',
      what: 'Sample gate that sets how the sample panel opens, for a cohort.',
      key: '',
      work: '',
      effect: [
        'the tone section of the sample system prompt',
        'Keep every answer about the sample panel under three short paragraphs, and name the card you mean.',
        'the status line under the input box',
        'Sample panel is on. Press Esc twice to close it.',
        'opening the sample panel at the start of a session',
        'In the cohort the panel asks the sample service for a layout before it opens, and opens in that layout.',
        'Logs one sample-panel event per session saying the panel stayed closed.',
        'The served value picks forced, none or cohort, and only the cohort value reads the card count.',
      ].join(' '),
    });
  });

  it('leaves the field empty on a gate with no effects and no values sentence', () => {
    expect(sampleDocs.find((d) => d.id === 'sample-alpha')?.effect).toBe('');
  });

  it('finds the gate by a sentence it puts into a prompt', () => {
    expect(makeSearcher(sampleDocs).search('under three short paragraphs')).toEqual(['sample-zeta']);
  });
});
