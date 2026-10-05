// Version order and the change rows a version carries. Pure: the page, the tools and the tests share it.

type Part = number | string;

function parts(v: string): Part[] {
  return v.split(/[.-]/).map((x) => (/^\d+$/.test(x) ? Number(x) : x));
}

// Numeric parts compare as numbers, so 2.1.100 sorts after 2.1.99; a missing part reads as 0.
export function cmpVersion(a: string, b: string): number {
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x === y) continue;
    if (typeof x === 'number' && typeof y === 'number') return x - y;
    return String(x) < String(y) ? -1 : 1;
  }
  return 0;
}

// The change rows a version carries: those that had happened by that version.
export function changesFor<T extends { enteredAt: { version: string } }>(changes: readonly T[], version: string): T[] {
  return changes.filter((c) => cmpVersion(c.enteredAt.version, version) <= 0);
}
