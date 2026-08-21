// Ersetzt einen Codeblock mit der Sprache "grafik" durch die fertige SVG-Grafik.
//
// Im Markdown schreiben Autor:innen nur:
//
//     ```grafik
//     verteilung
//     ```
//
// Kein Import, kein JSX, kein MDX noetig - die Inhalte bleiben einfaches Markdown.

import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { grafikSvg } from './grafiken.mjs';

export function remarkGrafik({ sourcesPath, base = '/' }) {
  const sources = yaml.load(readFileSync(sourcesPath, 'utf8')) ?? {};
  const praefix = base.endsWith('/') ? base.slice(0, -1) : base;

  return function transformer(tree, datei) {
    walk(tree, null, -1);

    function walk(node, parent, index) {
      if (node.type === 'code' && node.lang === 'grafik' && parent) {
        const id = (node.value ?? '').trim();
        let svg;
        try {
          svg = grafikSvg(id, sources);
        } catch (err) {
          // Bewusst harter Abbruch: eine kaputte Grafik darf nicht still
          // durchrutschen, sonst steht auf der Seite eine leere Flaeche.
          throw new Error(`${datei?.path ?? 'Markdown'}: ${err.message}`);
        }
        parent.children[index] = { type: 'html', value: svg.replaceAll('{{BASIS}}', praefix) };
        return;
      }
      if (Array.isArray(node.children)) {
        for (let i = node.children.length - 1; i >= 0; i--) walk(node.children[i], node, i);
      }
    }
  };
}
