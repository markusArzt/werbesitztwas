import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { remarkQuellen } from './src/lib/remark-quellen.mjs';
import { remarkGrafik } from './src/lib/remark-grafik.mjs';
import { remarkAbschnitte } from './src/lib/remark-abschnitte.mjs';

// GitHub Pages, Project Page: die Seite liegt unter einem Unterpfad.
// Bei Umzug auf eine eigene Domain: site aendern und base auf '/' setzen.
const site = 'https://markusarzt.github.io';
const base = '/werbesitztwas';

const sourcesPath = fileURLToPath(new URL('./data/sources.yml', import.meta.url));

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  markdown: {
    remarkPlugins: [
      [remarkGrafik, { sourcesPath, base }],
      [remarkQuellen, { sourcesPath, base }],
      // Nur Gestaltung: umschliesst die festen Modulabschnitte mit <section>.
      remarkAbschnitte,
    ],
    shikiConfig: { theme: 'github-light' },
  },
  build: { format: 'directory' },
  // CSS-Minimierung explizit auf esbuild statt des Astro-Standards
  // (lightningcss) umgestellt. Auf GitHub Actions brach der Produktions-Build
  // mit "[lightningcss minify] Invalid empty selector" ab, lokal liess sich
  // das trotz identischer global.css nicht reproduzieren - vermutlich eine
  // Paketversions-Differenz zwischen den Umgebungen (der Fehler lief ueber
  // Vites experimentellen rolldown-Pfad). esbuild minimiert CSS ebenso,
  // ohne diesen Codepfad zu durchlaufen.
  vite: {
    build: { cssMinify: 'esbuild' },
  },
});
