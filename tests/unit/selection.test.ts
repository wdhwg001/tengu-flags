import { describe, expect, it } from 'vitest';
import { b64urlDecode, b64urlEncode, decodeSelection, encodeSelection, withValue } from '../../src/lib/selection.ts';

describe('the ?c= selection', () => {
  it('round-trips a selection', () => {
    const sel = { 'amber-creek': 'on', 'api-force-idle-timeout': '42' };
    expect(decodeSelection(encodeSelection(sel))).toStrictEqual(sel);
  });

  it('encodes one selection to one string whatever the key order', () => {
    expect(encodeSelection({ b: '1', a: '2' })).toBe(encodeSelection({ a: '2', b: '1' }));
  });

  it('drops empty values and encodes nothing for an empty selection', () => {
    expect(encodeSelection({ a: '' })).toBe('');
    expect(encodeSelection({})).toBe('');
  });

  it('uses the URL-safe alphabet with no padding', () => {
    const encoded = b64urlEncode('??>>~~ü');
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(b64urlDecode(encoded)).toBe('??>>~~ü');
  });

  it('reads a damaged parameter as an empty selection', () => {
    expect(decodeSelection('%%%')).toStrictEqual({});
    expect(decodeSelection(b64urlEncode('[1,2]'))).toStrictEqual({});
    expect(decodeSelection(null)).toStrictEqual({});
  });

  it('keeps only slug-shaped keys and scalar values, as strings', () => {
    const param = b64urlEncode(JSON.stringify({ ok: true, 'Bad Key': '1', n: 3, o: { x: 1 } }));
    expect(decodeSelection(param)).toStrictEqual({ ok: 'true', n: '3' });
  });

  it('sets and clears one value without touching the others', () => {
    const sel = withValue({ a: '1' }, 'b', 'on');
    expect(sel).toStrictEqual({ a: '1', b: 'on' });
    expect(withValue(sel, 'a', '')).toStrictEqual({ b: 'on' });
  });
});
