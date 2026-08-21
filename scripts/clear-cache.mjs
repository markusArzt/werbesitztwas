// Leert Astros Content-Cache vor jedem Build.
//
// Grund: Die Inhalte haengen an data/sources.yml, aber Astro kennt diese
// Abhaengigkeit nicht. Es cached das gerenderte Markdown in
// node_modules/.astro/data-store.json und baut es nicht neu, wenn sich nur
// die Quellendatei aendert. Ohne diesen Schritt aendert man eine Zahl in
// sources.yml, der Build laeuft gruen durch - und auf der Seite steht
// weiterhin der alte Wert. Stille Veralterung ist schlimmer als ein Fehler.
//
// Der Vite-Cache (node_modules/.vite) bleibt bewusst stehen, er haelt den
// Build schnell und ist von den Inhalten unabhaengig.

import { rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

for (const pfad of ['.astro', 'node_modules/.astro']) {
  rmSync(join(ROOT, pfad), { recursive: true, force: true });
}

console.log('Content-Cache geleert (sources.yml wird neu eingelesen).');
