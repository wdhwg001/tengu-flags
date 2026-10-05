// The flowchart rule for a flow effect's `mermaid` string (DESIGN, "What is published about the binary"): the diagram
// explains a branch in the project's own words, so it is a flowchart and nothing in it names the build's code.
// tools/validate.ts runs it beside the code-shape rule of tools/lib/codeshape.ts, which every string already passes.
// tests/unit/mermaid.test.ts proves each refusal on a specimen and the rule as a whole on an accepted flowchart.
import type { CodeShapeHit } from './codeshape.ts';

// A node's or a link's label: the text inside a node bracket, between the pipes of a link, or in quotes. Nested
// shapes such as ([...]) and [[...]] are taken from the outer bracket; what is left over is bracket punctuation.
const LABEL = /\[[^\]\n]*\]|\([^)\n]*\)|\{[^}\n]*\}|\|[^|\n]*\||"[^"\n]*"/g;

// A name glued to an opening parenthesis is a call. Prose spaces a parenthesis away from the word before it, and a
// round node, `id(label)`, is outside any label, so inside a label this shape is code: `k(...)`, `Ce(`, `a.b(`.
const CALL = /[A-Za-z_$][\w$]*\(/;

// The links a flowchart draws, longest first so `-.->` is read whole.
const ARROW = String.raw`(?:<?-\.+->|<?==+>|<?--+>|---+|==+|-\.+-|--[ox]|~~~)`;
// A label has been replaced by [] before these run, so a node bracket and a link label read the same.
const ID = String.raw`[A-Za-z_$][\w$]*`;
const BEFORE = new RegExp(String.raw`(${ID})\s*(?:\[\]|${ARROW})`, 'g');
const AFTER = new RegExp(String.raw`(?:${ARROW}|\[\])\s*(${ID})`, 'g');

// A token that reads as a name a minifier invented: one to three characters carrying `$` or `_`, a digit, or both
// cases (`Ce`, `$no`, `Hno`, `_9`, `e2`), or a lone lowercase letter (`k`). One capital letter with optional digits
// (`A`, `B2`) is Mermaid's own convention for a node id and is accepted, and so is a short lowercase word (`ask`,
// `end`): a word list cannot tell `ce` from `ok`, so a two- or three-letter lowercase id is not refused.
export function minifiedId(token: string): boolean {
  if (token.length > 3 || /^[A-Z][0-9]*$/.test(token)) return false;
  if (/^[a-z]$/.test(token)) return true;
  return /[$_0-9]/.test(token) || (/[a-z]/.test(token) && /[A-Z]/.test(token));
}

export function mermaidShape(s: string): CodeShapeHit | null {
  if (!/^\s*(?:flowchart|graph)\b/.test(s)) {
    return { name: 'not a flowchart', match: s.trimStart().split('\n')[0]?.slice(0, 40) ?? '' };
  }
  for (const m of s.matchAll(LABEL)) {
    const call = CALL.exec(m[0].slice(1, -1));
    if (call) return { name: 'call in a label', match: call[0] };
  }
  const skeleton = s.replace(LABEL, '[]');
  for (const pattern of [BEFORE, AFTER]) {
    for (const m of skeleton.matchAll(pattern)) {
      const id = m[1];
      if (id !== undefined && minifiedId(id)) return { name: 'minified identifier as a node', match: id };
    }
  }
  return null;
}
