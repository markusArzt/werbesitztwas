# Gestaltung

Kurzdokumentation der visuellen Identität. Was hier steht, betrifft nur die
Darstellung — Inhalte, `data/sources.yml`, die Build-Guards und die
Berechnungslogik in `src/lib/grafiken.mjs` sind unverändert.

## Die Idee in einem Satz

Ein amtliches Register mit einer sichtbaren Leerstelle: Papier statt Weiß,
Stempelviolett für die eigene Stimme, Messing ausschließlich für das, was
nicht gemessen ist.

**Die Farbsemantik ist die eigentliche Entscheidung und sollte beim Weiterbauen
eingehalten werden:**

| Farbe | Bedeutung | wo sie vorkommt |
|---|---|---|
| Messing (`--warnung`, `--daten-unbekannt`) | nicht gemessen, geschätzt, offen | Schraffuren in den Grafiken, strittige Belege, Konfidenzmarke „strittig“, der schraffierte Ausklang unter jeder H1 |
| Stempelviolett (`--akzent`, `--daten-3`) | die eigene Stimme der Seite und der konzentrierte Anteil in den Daten | Links, aktive Navigation, Absendeknopf, Fokusring, der Balken „reichste 5 %“ |
| Papier und Tinte (`--flaeche`, `--text`) | alles Übrige | Fläche, Text, Linien |

Messing bedeutet nie „Warnung“ im Sinn von Gefahr und Violett nie „schön“ —
wer eine dieser Farben dekorativ einsetzt, macht die Grafiken unlesbar, weil
dort dieselben Variablen dieselbe Bedeutung tragen.

## Signaturelement

Unter jeder Seitenüberschrift läuft eine 6 px starke Regel, die auf den letzten
gut 20 % in eine Schraffur ausläuft (`h1::after`). Sie sagt dasselbe wie jede
der sechs Grafiken: Der letzte Teil ist nicht erhoben. Dieselbe Schraffur
markiert im Register die strittigen Einträge und im Entwurfshinweis den noch
offenen Stand. Sie ist bewusst **nicht** für gemessene Abstände verwendet —
das Zahlenpaar auf der Startseite bekommt deshalb Violett, kein Messing.

## Geänderte Variablen (Namen bestehen unverändert weiter)

| Variable | vorher | hell | dunkel |
|---|---|---|---|
| `--text` | `#16171a` | `#191d18` | `#e8eae2` |
| `--text-leise` | `#5c5f66` | `#555c53` | `#a2aa9c` |
| `--linie` | `#dcdde0` | `#c4c8bb` | `#383d36` |
| `--flaeche` | `#ffffff` | `#edeee7` | `#171916` |
| `--flaeche-ruhig` | `#f6f6f4` | `#dde0d5` | `#22261f` |
| `--akzent` | `#8a3324` | `#46356f` | `#b6a6ea` |
| `--warnung` | `#7a5c00` | `#7a5f06` | `#d9b752` |
| `--breite` | `42rem` | `34rem` | — |
| `--lh` | `1.65` | `1.62` | — |

Grafikvariablen, Namen ebenfalls unverändert:

| Variable | hell | dunkel |
|---|---|---|
| `--daten-1` | `#c9ccc0` | `#333831` |
| `--daten-2` | `#7f8a7c` | `#79857a` |
| `--daten-3` | `#46356f` | `#8b7cc8` |
| `--daten-unbekannt` | `#7a5f06` | `#d9b752` |

## Neu ergänzte Variablen

Bewusst ohne `--daten-`-Präfix, damit die Trennung zu den Grafikfarben klar
bleibt. Diese vier tauchen in `src/lib/grafiken.mjs` **nicht** auf:

| Variable | Zweck |
|---|---|
| `--linie-stark` | kräftigere Linie für Kanten, Randnotizen, Eingabefelder |
| `--akzent-flaeche` | Hinterlegung des angesprungenen Registereintrags (`:target`) |
| `--akzent-text` | Textfarbe auf violetter Fläche (Knopf, Sprungmarke) |
| `--schraffur` | das Signaturmuster als `repeating-linear-gradient`, gleiche Geometrie wie das SVG-`<pattern>` (7 px Periode, 45°) |

Dazu Maß- und Schriftvariablen: `--rand` (Marginalspalte), `--radius`,
`--stufe` (Abschnittsabstand), `--schrift-display`, `--schrift-text`,
`--schrift-kennung`.

## Typografie

- **Archivo Variable** (Gewichts- *und* Breitenachse) für Überschriften,
  Etiketten, Zahlen und die Texte in den SVGs. Die Breitenachse trägt Arbeit:
  Überschriften laufen leicht schmal (92 %), Etiketten breit (112–116 %) —
  deutsche Komposita brauchen das eine, Formularbezeichnungen das andere.
- **Source Serif 4 Variable** für den Lauftext.
- Systemschrift monospace nur für die Quellen-IDs im Register.
- `tnum` ist überall aktiv, wo Zahlen untereinander stehen: Register,
  Tabellen, Kennzahlen, Grafikbeschriftungen.

Beide Familien liegen unter `src/schrift/` (SIL OFL, Lizenzen dabei), werden
über relative Pfade in `global.css` eingebunden und von Vite gehasht — kein
Google-CDN, und der Basispfad stimmt automatisch. Die `-ext`-Dateien decken
nur Latin Extended-A ab und werden per `unicode-range` fast nie geladen.
Erstladung: rund 141 KB.

## Struktur

- **Marginalspalte** links ab 62 rem für den Apparat: Modulkennung, Datenstand,
  Wegweiser durch die sechs Module. Darunter klappt sie über den Text.
  Die Textbahn steht auf jedem Seitentyp an derselben Stelle.
- **`src/lib/remark-abschnitte.mjs`** (neu) umschließt die vier festen
  Modulabschnitte mit `<section class="abschnitt abschnitt--…">`. Ohne das
  kann CSS „Das sagt die Gegenseite“ nicht von jeder anderen H2 unterscheiden.
  Das Plugin fügt nur Tags ein und lässt die `---`-Linie weg, wo eine
  Abschnittskante sie ersetzt. Wird eine Überschrift im Content umbenannt,
  fällt der Abschnitt auf normale Textgestaltung zurück — kein Build-Fehler.
- **`/daten`** gruppiert nach ID-Präfix (`at_`, `eu_`, `welt_`) und zeigt die
  Konfidenz als Marke: ausgefüllt = hoch, halb = mittel, schraffiert =
  strittig. **Bewusst kein Filter:** jeder Belegverweis springt auf
  `/daten#id`; eine Filterung, die Einträge ausblendet, würde diese Links
  ins Leere laufen lassen.

## Bewegung

Eine einzige Regung: Grafiken blenden beim Scrollen ein (260 ms, 10 px).
Der Beobachter sitzt inline in `Basis.astro`, setzt die Klasse nur, wenn
`prefers-reduced-motion` nicht widerspricht, und hat ein Sicherheitsnetz nach
dem Laden. Ohne JavaScript ist alles von Anfang an sichtbar.

## Barrierefreiheit

Sprungmarke zum Inhalt, sichtbarer Fokusring auf allen fokussierbaren
Elementen, `aria-current` in der Navigation und im Modulwegweiser,
Buchstabenkennungen mit Klartext für Screenreader. Alle Text-auf-Fläche-Paare
liegen in beiden Modi über 4,5:1, die Datenflächen über 3:1 gegen die
Grundfläche.

## Offene Punkte

- **`hinweis` in `data/sources.yml` wird auf `/daten` öffentlich ausgegeben.**
  Viele Einträge enthalten dort Redaktionsanweisungen („KORREKTUR: …“, „NICHT
  zu … verkürzen“, „Vor dem Livegang versuchen, …“). Das ist keine
  Gestaltungsfrage, sondern eine inhaltliche Entscheidung, die ich nicht
  angefasst habe — aber sie sollte vor dem Livegang fallen: entweder ein
  zweites Feld für die öffentliche Erläuterung, oder `hinweis` nur bei
  `konfidenz: strittig` ausgeben.
- **Vorgefundener Layoutfehler in `forderungen()` (Modul F).** Zwei Zeilen
  liegen nur 3 px auseinander und überlagern sich: der Hinweis bei
  `YB + HB + 45` = y 123 und die Beschriftung `Dieselben Werte, vergrößert`
  bei `Y0 - 20` = y 126. Das passiert mit jeder Schrift, auch mit der alten
  Systemschrift, ist also kein Effekt der neuen Typografie — und die
  Layoutlogik dieser Datei sollte ich laut Auftrag nicht anfassen. Fix wäre
  eine Zeile: `Y0` von `146` auf `160` setzen (der Rest der Grafik hat unten
  Luft). Die langen Untertitel- und Quellenzeilen, die vorher an den rechten
  Rand stießen, passen jetzt: `.g-unter` und `.g-quelle` laufen auf 90 %
  Breite — das ist der einzige Eingriff, den die Grafiken bekommen haben.
- Der Rechner auf der Startseite ist weiterhin Platzhalter und als Randnotiz
  gestaltet; wenn er kommt, gehört er als Formularpanel gebaut (wie die
  E-Mail-Erfassung), nicht als Kasten.
- Ein OG-Bild-Generator würde die Typografie der Seite übernehmen können —
  Archivo mit `tnum` und die Schraffur reichen für ein Kartenmotiv.
