// Wandelt {{src.id}} im Markdown in einen Belegverweis um.
// Autor:innen schreiben nur die ID, die Quellenangabe wird zentral gepflegt.

import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';

const PLACEHOLDER = /\{\{\s*src\.([a-zA-Z0-9_]+)\s*\}\}/g;

function escape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function remarkQuellen({ sourcesPath, base = '/' }) {
  const praefix = base.endsWith('/') ? base.slice(0, -1) : base;
  const sources = yaml.load(readFileSync(sourcesPath, 'utf8')) ?? {};

  const beleg = (id) => {
    const e = sources[id];
    if (!e) return `<sup class="beleg beleg--fehlt" title="Quelle fehlt">?</sup>`;
    const titel = escape(`${e.quelle}${e.erhebungsjahr ? `, Erhebung ${e.erhebungsjahr}` : ''}`);
    const strittig = e.konfidenz === 'strittig' ? ' beleg--strittig' : '';
    return `<sup class="beleg${strittig}"><a href="${praefix}/daten/#${escape(id)}" title="${titel}">Quelle</a></sup>`;
  };

  return function transformer(tree) {
    walk(tree, null, -1);

    function walk(node, parent, index) {
      if (node.type === 'inlineCode') {
        const m = /^\{\{\s*src\.([a-zA-Z0-9_]+)\s*\}\}$/.exec(node.value ?? '');
        if (m && parent) {
          parent.children[index] = { type: 'html', value: beleg(m[1]) };
          return;
        }
      }

      if (node.type === 'text' && parent && PLACEHOLDER.test(node.value ?? '')) {
        PLACEHOLDER.lastIndex = 0;
        const teile = [];
        let letzter = 0;
        let m;
        while ((m = PLACEHOLDER.exec(node.value)) !== null) {
          if (m.index > letzter) {
            teile.push({ type: 'text', value: node.value.slice(letzter, m.index) });
          }
          teile.push({ type: 'html', value: beleg(m[1]) });
          letzter = m.index + m[0].length;
        }
        if (letzter < node.value.length) {
          teile.push({ type: 'text', value: node.value.slice(letzter) });
        }
        parent.children.splice(index, 1, ...teile);
        return;
      }

      if (Array.isArray(node.children)) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          walk(node.children[i], node, i);
        }
      }
    }
  };
}
