import { describe, expect, it } from 'vitest';
import { CODE_SHAPES, codeShape, jsonStrings } from '../../tools/lib/codeshape.ts';

// One minified fragment per pattern, each refused by that pattern and no earlier one.
const REFUSED: Record<string, string> = {
  'keyword after ; or }': 'a=b;return c',
  'statement opening a block': 'function q(){return r}',
  'arrow function': 'isEnabled:()=>x("tengu_foo",false)',
  'minified boolean': 'k("tengu_foo",!1)',
  'optional chain': 'Kd()?.[name]',
  'strict comparison': 'a.mode==="on"',
  'operator glued to operands': 'UT(g,s)&&x(n)',
  'void 0': 'n=void 0',
};

// The text the data does publish: a prompt sentence, a tool description, a Mermaid flowchart of a flow effect,
// settings keys, the project's own notation for an override, and a sentence with a semicolon in it.
const ACCEPTED = [
  "The user hasn't heard from you in a while. As you continue, keep them updated when there's something to tell — a finding, a change of plan.",
  'Executes a given bash command and returns its output. The working directory persists between commands; shell state does not.',
  'flowchart TD\n  A[Session starts] --> B{Gate on?}\n  B -- yes --> C[Insert the reminder]\n  B -- no --> D[Skip it]\n  C ==> E((Done))',
  '"permissions.defaultMode"',
  'env.CLAUDE_CODE_USE_BEDROCK',
  '`VAR ?? read(gate, default)` replaces in both directions, `VAR || read(...)` forces on, `if (VAR) return false` forces off',
  'In 2.1.286 the parser at offset 204618142 read tengu_rosy_pine (default null); in 2.1.287 it reads tengu_hidden_volcano.',
];

describe('the code-shape rule', () => {
  it('has a refused specimen for every pattern', () => {
    expect(Object.keys(REFUSED).sort()).toEqual(CODE_SHAPES.map((c) => c.name).sort());
  });

  for (const [name, specimen] of Object.entries(REFUSED)) {
    it(`refuses a minified fragment by "${name}"`, () => {
      expect(codeShape(specimen)?.name).toBe(name);
    });
  }

  it('refuses a made-up read site in the minifier shape, return glued to its boolean', () => {
    expect(codeShape('if(!q(process.env.SOME_VAR))return!1')?.name).toBe('minified boolean');
  });

  for (const specimen of ACCEPTED) {
    it(`accepts ${JSON.stringify(specimen.slice(0, 40))}`, () => {
      expect(codeShape(specimen)).toBeNull();
    });
  }

  it('reaches every string of a nested data value', () => {
    const paths = [...jsonStrings({ a: ['x', { b: 'y' }], c: 1 })].map(([path]) => path);
    expect(paths).toEqual(['a[0]', 'a[1].b']);
  });
});
