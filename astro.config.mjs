import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { remarkQuellen } from './src/lib/remark-quellen.mjs';
import { remarkGrafik } from './src/lib/remark-grafik.mjs';
import { remarkAbschnitte } from './src/lib/remark-abschnitte.mjs';

// GitHub Pages, Project Page: die Seite liegt dort unter einem Unterpfad
// (markusarzt.github.io/werbesitztwas/). Cloudflare Workers liefert dagegen
// direkt an der Domain-Wurzel aus (werbesitztwas.xxx.workers.dev/, ohne
// Unterpfad) - deshalb sind site/base hier ueber Umgebungsvariablen
// steuerbar, mit den GitHub-Pages-Werten als Standard. Fuer die
// Cloudflare-Vorschau in den Projekteinstellungen unter "Environment
// variables" (Build) setzen: SITE_BASE=/ und SITE_URL=<die workers.dev-URL>.
// Ohne diese Variablen (z.B. im GitHub-Actions-Workflow) gelten die
// bisherigen Standardwerte unveraendert.
const site = process.env.SITE_URL ?? 'https://markusarzt.github.io';
const base = process.env.SITE_BASE ?? '/werbesitztwas';

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
