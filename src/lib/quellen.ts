import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

export type Quelle = {
  wert: string;
  zahl?: number;
  beschreibung?: string;
  quelle: string;
  erhebungsjahr?: number;
  veroeffentlicht?: string;
  url?: string;
  abgerufen: string;
  konfidenz?: 'hoch' | 'mittel' | 'strittig';
  hinweis?: string;
  spanne?: string;
};

// Bewusst ueber process.cwd() statt import.meta.url aufgeloest: Astro buendelt
// diese Datei fuer Prerendering in einen Zwischenordner (dist/.prerender/...),
// wodurch ein relativer Pfad ab import.meta.url ins Leere zeigt, sobald die
// Datei nicht mehr an ihrem Quellort liegt. astro dev und astro build laufen
// beide mit dem Projekt-Wurzelverzeichnis als cwd, das bleibt stabil.
const pfad = join(process.cwd(), 'data/sources.yml');

export const quellen = yaml.load(readFileSync(pfad, 'utf8')) as Record<string, Quelle>;

export const quellenListe = Object.entries(quellen).sort(([a], [b]) => a.localeCompare(b));
