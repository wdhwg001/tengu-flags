// The selection in the URL: ?c=<base64url of a compact JSON object {slug: value}> (DESIGN, "The page's behaviour").

export type Selection = Readonly<Record<string, string>>;

export function b64urlEncode(text: string): string {
  let bin = '';
  for (const b of new TextEncoder().encode(text)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

// Keys sorted and empty values dropped, so one selection always encodes to one link.
export function encodeSelection(sel: Selection): string {
  const keys = Object.keys(sel)
    .filter((k) => sel[k] !== undefined && sel[k] !== '')
    .sort();
  if (keys.length === 0) return '';
  const compact: Record<string, string> = {};
  for (const k of keys) compact[k] = sel[k] ?? '';
  return b64urlEncode(JSON.stringify(compact));
}

// A damaged or hand-edited parameter yields an empty selection rather than a broken page.
// Numbers and booleans from an older link read as their string form, the form the controls hold.
export function decodeSelection(param: string | null): Selection {
  if (param === null || param === '') return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(b64urlDecode(param));
  } catch {
    return {};
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    const scalar = typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
    if (/^[a-z0-9-]+$/.test(k) && scalar) out[k] = String(v);
  }
  return out;
}

export function withValue(sel: Selection, slug: string, value: string): Selection {
  const next: Record<string, string> = { ...sel };
  if (value === '') delete next[slug];
  else next[slug] = value;
  return next;
}
