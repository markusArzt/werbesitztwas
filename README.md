# Wer besitzt was?

Statische Astro-Seite zur Vermögensverteilung in Österreich. Läuft ohne Datenbank,
ohne Cookies und ohne externe Ressourcen. Modul A ist bereits enthalten und gebaut.

**Live:** https://markusarzt.github.io/werbesitztwas/ (Entwurf, für Suchmaschinen gesperrt)

## Loslegen

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # erzeugt dist/, läuft vorher automatisch den Quellen-Check
```

Node 20 oder neuer.

## Der wichtigste Mechanismus: der Quellen-Guard

`npm run build` ruft vorher `scripts/check-sources.mjs` auf. Das Skript bricht den Build ab, wenn

- im Content eine Quellen-ID referenziert wird, die es in `data/sources.yml` nicht gibt,
- ein Eintrag in `sources.yml` kein `wert`, `quelle` oder `abgerufen` hat,
- ein als `strittig` markierter Eintrag keinen `hinweis` trägt.

Damit ist es technisch unmöglich, eine Zahl zu veröffentlichen, deren Herkunft nicht dokumentiert ist.
Getestet: eine erfundene ID lässt den Build mit Fehlermeldung scheitern.

### Zahlen im Text belegen

Im Markdown genügt die ID:

```markdown
Der Median liegt bei rund 125.000 Euro. `{{src.at_median_nettovermoegen}}`
```

Daraus wird beim Bauen ein kleiner Beleg-Verweis auf `/daten#at_median_nettovermoegen`.
Strittige Werte bekommen automatisch eine andere Farbe. Die Quellenangabe steht nur an
einer Stelle — wenn ein neuer Datenstand kommt, änderst du `sources.yml` und alle Seiten stimmen.

## Struktur

```
data/sources.yml              zentrale Quellen-Registry
scripts/check-sources.mjs     Build-Guard
src/content/argumente/        die sechs Module (A liegt bei)
src/content/mythen/           je ein Einwand pro Datei, mit FAQ-Structured-Data
src/lib/remark-quellen.mjs    ersetzt {{src.id}} durch den Belegverweis
src/lib/quellen.ts            lädt sources.yml für /daten
src/layouts/                  Basis + Modul-Template
src/pages/                    Startseite, Hubs, /daten, Impressum, Datenschutz
```

## Ein neues Modul anlegen

1. Datei unter `src/content/argumente/` anlegen, Frontmatter nach dem Vorbild von Modul A
   (`modul`, `title`, `beschreibung`, `stand`, optional `og_title` und `naechstes_modul`).
2. Neue Zahlen zuerst in `data/sources.yml` eintragen, dann im Text referenzieren.
3. `npm run build`. Wenn er durchläuft, hat jede Zahl eine Quelle.

Der Abschnitt „Das sagt die Gegenseite" gehört in jedes Modul. Er ist kein Zugeständnis,
sondern der Grund, warum die Seite in einer Fachdiskussion standhält.

## Schreibweise: Umlaute ja, Bezeichner nein

Im **sichtbaren Text** stehen echte Umlaute und ß. Keine Ersatzschreibungen wie „oe" oder „ae" —
auf einer deutschsprachigen Kampagnenseite wirkt das unseriös.

In **Bezeichnern** bleibt alles ASCII, weil dort Umlaute Links und Styles brechen:

- Quellen-IDs in `data/sources.yml` (`at_anteil_untere_haelfte`)
- Dateinamen und Slugs (`verteilung-oesterreich.md` → `/argumente/verteilung-oesterreich/`)
- CSS-Variablen (`--flaeche`) und Klassennamen
- Variablen im Code

Slugs bewusst ohne Umlaute: URLs mit Umlauten werden von Browsern in Punycode umgeschrieben
und sehen beim Teilen unbrauchbar aus.

## Grafiken

Grafiken werden zur Bauzeit aus `data/sources.yml` erzeugt, nicht gezeichnet. Im Markdown steht nur:

    ```grafik
    verteilung
    ```

Damit können die Zahlen im Bild nicht von den Zahlen im Text abweichen — beide stammen aus
derselben Datei. Ausgabe ist statisches SVG: kein JavaScript, druckbar, im Dunkelmodus lesbar,
mit Quelle und Domain eingebrannt.

Neue Grafiken kommen in `src/lib/grafiken.mjs`. Werte holt man dort über `zahl(sources, 'id')` —
fehlt das numerische Feld `zahl` in der Registry, bricht der Build ab.

## Der Cache-Fallstrick

`npm run build` leert vor jedem Lauf `.astro` und `node_modules/.astro`.

Das ist nicht optional. Astro cached gerendertes Markdown und weiß nichts davon, dass die
Inhalte von `data/sources.yml` abhängen. Ohne das Leeren ändert man eine Zahl, der Build läuft
grün durch — und auf der Seite steht weiterhin der alte Wert. Diese stille Veralterung wäre
schlimmer als gar keine Prüfung, weil man sich in Sicherheit wiegt.

**Beim Entwickeln mit `npm run dev` gilt das genauso:** Nach jeder Änderung an `sources.yml`
den Dev-Server neu starten. Änderungen an Markdown-Dateien werden dagegen normal erkannt.

## Basispfad: warum Links nie absolut geschrieben werden

Die Seite liegt auf GitHub Pages unter dem Unterpfad `/werbesitztwas/`. Ein `href="/daten/"`
würde daher ins Leere zeigen. Deshalb gilt im ganzen Projekt:

```astro
import { pfad } from '../lib/pfad';
<a href={pfad('/daten/')}>Daten</a>
```

Beim Umzug auf eine eigene Domain ändert sich nur `base` in `astro.config.mjs` auf `'/'` —
kein Link muss angefasst werden. Das Remark-Plugin bekommt denselben Wert übergeben und
setzt ihn vor jeden Belegverweis.

## Sichtbarkeit

`src/lib/site.ts` enthält `INDEXIERBAR = false`. Solange das so steht, trägt jede Seite ein
`noindex, nofollow` und zeigt oben einen Entwurfs-Hinweis.

Wichtig: Eine `robots.txt` hilft hier **nicht**. Suchmaschinen lesen sie nur unter der
Domain-Wurzel `markusarzt.github.io/robots.txt`, und die gehört diesem Repository nicht.
Der wirksame Schutz ist ausschließlich das Meta-Tag.

GitHub Pages hat im Gratis-Tarif keinen Zugriffsschutz: Die URL ist öffentlich erreichbar,
auch unverlinkt. „Nicht gelauncht" heißt nicht „nicht sichtbar".

## Deploy

`.github/workflows/deploy.yml` baut bei jedem Push auf `main` und veröffentlicht.
In den Repo-Einstellungen einmalig **Settings → Pages → Source: GitHub Actions** setzen.

Der Quellen-Check hängt als `prebuild` am Build: Eine Zahl ohne dokumentierte Quelle lässt
den Deploy scheitern, nicht erst die Diskussion.

## Vor dem Livegang

- [ ] `src/lib/site.ts`: `INDEXIERBAR` auf `true`
- [ ] `astro.config.mjs`: `site` auf die echte Domain, `base` auf `'/'`
- [ ] `src/pages/impressum.astro` vollständig ausfüllen — die Seite ist eine „große Website"
      nach Mediengesetz, die verkürzte Offenlegung für kleine Websites gilt hier **nicht**.
      Erforderlich sind unter anderem Medieninhaber, Anschrift, vertretungsbefugte Organe und
      die grundlegende Richtung. Strafrahmen bis 20.000 Euro.
- [ ] Keine private Wohnadresse als Anschrift, wenn vermeidbar
- [ ] `src/pages/datenschutz.astro` ausfüllen und juristisch prüfen lassen
- [ ] Formular in `src/components/EmailErfassung.astro` anbinden. GitHub Pages nimmt keine
      Formulare entgegen — entweder das gehostete Formular des E-Mail-Dienstes einbetten oder
      eine kleine Funktion danebenstellen. Kein API-Schlüssel im Browser-Code.
- [ ] Auftragsverarbeitungsvertrag mit E-Mail-Anbieter und Hoster
- [ ] Plausible-Snippet in `src/layouts/Basis.astro` aktivieren und Domain eintragen
- [ ] Grafiken einsetzen, jeweils mit eingebrannter Quelle und Domain
- [ ] Lighthouse: LCP unter 2 s, Barrierefreiheit ohne Fehler

## Bewusst weggelassen

- **Google Fonts über CDN.** DSGVO-Risiko. Der System-Font-Stack läuft vorerst; wenn eine
  eigene Schrift kommt, als Datei selbst hosten.
- **Cookie-Banner.** Wird nicht gebraucht, solange keine Cookies gesetzt werden. Das ist ein
  Feature, kein Mangel — halte es so.
- **Kein Framework für den Rechner.** Das Schätz-Widget auf der Startseite ist gebaut —
  reines JS, einzige JavaScript-Insel der Seite, kein React. Die vier zugrunde liegenden
  Schwellenwerte (`at_median_nettovermoegen`, `at_mittelwert_nettovermoegen`,
  `at_schwelle_top10`, `at_schwelle_top5`) tragen ein `zahl`-Feld in `data/sources.yml`,
  aus dem `index.astro` die Werte zur Bauzeit ins Skript gibt — kein Fetch, kein Server.
- **OG-Bild-Generierung.** Nächster sinnvoller Ausbauschritt: Satori plus resvg im Build,
  das pro Seite ein 1200×630- und ein 1080×1350-Bild mit eingebrannter Quelle erzeugt.

## Lizenz

Inhalte unter CC BY 4.0. Code frei verwendbar.
