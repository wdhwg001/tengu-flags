import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { makeSearcher, searchDocs } from '../../src/lib/search.ts';
import { changesFor } from '../../src/lib/versions.ts';
import { changes, env, events, fixture, gates, VERSION } from './real-data.ts';

const docs = searchDocs([...gates, ...env, ...changesFor(changes, VERSION)], events);

describe('searchDocs over the real data', () => {
  it('writes the same corpus bytes the page logic on main wrote', () => {
    const bytes = `${JSON.stringify(docs)}\n`;
    expect(docs.length).toBe(fixture.searchCorpus.documents);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(fixture.searchCorpus.sha256);
  });

  it('builds the sampled documents field for field', () => {
    for (const sample of fixture.searchCorpus.samples) {
      expect(docs.find((d) => d.id === sample.id)).toStrictEqual(sample);
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
