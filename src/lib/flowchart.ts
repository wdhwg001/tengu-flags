// Draws a flow effect's flowchart from the row's own Mermaid text, in the browser. The renderer is a separate chunk,
// loaded by a dynamic import the first time a detail holding a flowchart opens, so a reader who never opens one
// never downloads it. Nothing is fetched beyond the renderer's own code.
import type { Mermaid } from 'mermaid';

let renderer: Promise<Mermaid> | null = null;
let serial = 0;

function load(): Promise<Mermaid> {
  renderer ??= import('mermaid').then(({ default: mermaid }) => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    mermaid.initialize({
      startOnLoad: false,
      // Labels are drawn as text, never as markup, and no click binding runs.
      securityLevel: 'strict',
      // A chart that fails to parse rejects the promise instead of drawing an error picture into the page.
      suppressErrorRendering: true,
      theme: dark ? 'dark' : 'neutral',
    });
    return mermaid;
  });
  return renderer;
}

// The SVG markup of one chart; Mermaid queues concurrent calls and runs them one at a time.
export async function drawFlowchart(source: string): Promise<string> {
  const mermaid = await load();
  serial += 1;
  const { svg } = await mermaid.render(`flowchart-${serial}`, source);
  return svg;
}
