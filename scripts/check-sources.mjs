#!/usr/bin/env node
// Bricht den Build ab, wenn im Content eine Quellen-ID referenziert wird,
// die es in data/sources.yml nicht gibt - oder wenn ein Eintrag unvollstaendig ist.
//
// Das ist der Kern der Glaubwuerdigkeitsstrategie: Es soll technisch unmöglich
// sein, eine Zahl zu veröffentlichen, die keine belegte Herkunft hat.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import yaml from 'js-yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const SOURCES = join(ROOT, 'data/sources.yml');
const CONTENT = join(ROOT, 'src/content');

const PLACEHOLDER = /\{\{\s*src\.([a-zA-Z0-9_]+)\s*\}\}/g;
const PFLICHTFELDER = ['wert', 'quelle', 'abgerufen'];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(md|mdx|astro)$/.test(name)) out.push(full);
  }
  return out;
}

const sources = yaml.load(readFileSync(SOURCES, 'utf8')) ?? {};
const bekannt = new Set(Object.keys(sources));
const benutzt = new Set();
const fehler = [];
const warnungen = [];

// Schluessel muessen ASCII bleiben - IDs wie Feldnamen.
// Anlass: Ein Aufraeum-Skript hat "veroeffentlicht" zu "veroeffentlicht" mit
// Umlaut gemacht. Das lief still durch, weil ein unbekanntes optionales Feld
// einfach nichts anzeigt. Auf der Registry gepruefte Schluessel, nicht auf Rohtext:
// mehrzeilige hinweis-Bloecke enthalten Doppelpunkte und wuerden sonst anschlagen.
const nichtAscii = (s) => /[^\x00-\x7F]/.test(s);

for (const [id, eintrag] of Object.entries(sources)) {
  if (nichtAscii(id)) fehler.push(`sources.yml: Quellen-ID "${id}" enthaelt Nicht-ASCII-Zeichen`);
  if (eintrag && typeof eintrag === 'object') {
    for (const feld of Object.keys(eintrag)) {
      if (nichtAscii(feld)) {
        fehler.push(`sources.yml: "${id}" hat den Feldnamen "${feld}" mit Nicht-ASCII-Zeichen`);
      }
    }
  }
}

for (const [id, eintrag] of Object.entries(sources)) {
  if (eintrag === null || typeof eintrag !== 'object') {
    fehler.push(`sources.yml: "${id}" ist kein Objekt`);
    continue;
  }
  for (const feld of PFLICHTFELDER) {
    if (!eintrag[feld]) fehler.push(`sources.yml: "${id}" fehlt das Pflichtfeld "${feld}"`);
  }
  if (eintrag.konfidenz === 'strittig' && !eintrag.hinweis) {
    fehler.push(`sources.yml: "${id}" ist als strittig markiert, hat aber keinen Hinweis`);
  }
}

for (const datei of walk(CONTENT)) {
  const text = readFileSync(datei, 'utf8');
  for (const treffer of text.matchAll(PLACEHOLDER)) {
    const id = treffer[1];
    benutzt.add(id);
    if (!bekannt.has(id)) {
      fehler.push(`${relative(ROOT, datei)}: unbekannte Quellen-ID "${id}"`);
    }
  }
}

for (const id of bekannt) {
  if (!benutzt.has(id)) warnungen.push(`sources.yml: "${id}" wird nirgends verwendet`);
}

// Sekundaerquellen sind erlaubt, aber sie sollen sichtbar bleiben.
const sekundaer = Object.entries(sources)
  .filter(([id, e]) => e?.sekundaerquelle && benutzt.has(id))
  .map(([id]) => id);
if (sekundaer.length) {
  console.warn(`  Offen: ${sekundaer.length} verwendete Zahl(en) haengen an einer Sekundaerquelle.`);
  for (const id of sekundaer) console.warn(`    - ${id}: Primaerstudie vor dem Livegang beschaffen`);
}

for (const w of warnungen) console.warn(`  Hinweis: ${w}`);

if (fehler.length) {
  console.error(`\nQuellen-Check fehlgeschlagen (${fehler.length}):\n`);
  for (const f of fehler) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}

console.log(`Quellen-Check ok: ${benutzt.size} von ${bekannt.size} Eintraegen referenziert.`);
