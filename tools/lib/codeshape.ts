// The code-shape rule (DESIGN, "What is published about the binary"): no string in the data and no line of the
// receipts may read as the client's code. Each pattern is an operator-shaped run a minifier leaves and prose,
// a prompt sentence, a tool description, a Mermaid flowchart or a settings key does not; the reason sits beside it.
// tests/unit/codeshape.test.ts proves each pattern on a refused specimen and the whole set on accepted ones.

export interface CodeShape {
  name: string;
  why: string;
  pattern: RegExp;
}

export const CODE_SHAPES: readonly CodeShape[] = [
  {
    name: 'keyword after ; or }',
    why: 'a minifier drops the space between a statement end and the next keyword; prose puts one after a semicolon',
    pattern:
      /[;}](?:return|if|else|let|const|var|function|for|while|do|switch|case|throw|try|catch|finally|new|typeof|void|await|yield|async|class|break|continue|delete)\b/,
  },
  {
    name: 'statement opening a block',
    why: 'a function or block body that opens straight onto a statement; a Mermaid label or a JSON object does not',
    pattern: /\{(?:return\b|if\(|let |const |var |for\(|while\(|throw |try\{|switch\()/,
  },
  {
    name: 'arrow function',
    why: 'a parameter list or name followed by =>; Mermaid draws its links with --> and ==>, never after a name',
    pattern: /(?:\)|[A-Za-z_$][\w$]*)\s*=>/,
  },
  {
    name: 'minified boolean',
    why: 'a minifier writes true and false as !0 and !1, after an operator or glued to return; no sentence does',
    pattern: /(?:(?<![\w!])|(?<=\breturn))![01](?![\w.%])/,
  },
  {
    name: 'optional chain',
    why: 'a member, index or call reached through ?. on a name or a call; prose never joins ? and . to a word',
    pattern: /[\w$)\]]\?\.(?:\[|\(|[A-Za-z_$])/,
  },
  {
    name: 'strict comparison',
    why: '=== and !== are JavaScript operators with no use in a sentence or a flowchart',
    pattern: /!==|===/,
  },
  {
    name: 'operator glued to operands',
    why: 'minified code joins && and || to the names on both sides; prose spaces a logical connective out',
    pattern: /[\w$)\]](?:&&|\|\|)[\w$!(]/,
  },
  {
    name: 'void 0',
    why: 'the minifier spelling of undefined',
    pattern: /\bvoid 0\b/,
  },
];

export interface CodeShapeHit {
  name: string;
  match: string;
}

export function codeShape(s: string): CodeShapeHit | null {
  for (const c of CODE_SHAPES) {
    const m = c.pattern.exec(s);
    if (m) return { name: c.name, match: m[0] };
  }
  return null;
}

// Every string value of a parsed JSON file, with the path a reader uses to find it.
export function* jsonStrings(value: unknown, path = ''): Generator<[string, string]> {
  if (typeof value === 'string') yield [path, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* jsonStrings(v, `${path}[${i}]`);
  else if (value !== null && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) yield* jsonStrings(v, path === '' ? k : `${path}.${k}`);
}
