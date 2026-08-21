# Schriften

Selbst gehostet, bewusst kein Google-Fonts-CDN: bei einer Einbindung über das CDN
würde bei jedem Seitenaufruf die IP-Adresse der Besucherin an Google übertragen.
Hier liegen die Dateien im Repository und werden von `src/styles/global.css`
über relative Pfade eingebunden. Vite hasht sie beim Build und setzt den
Basispfad selbst — deshalb funktionieren sie unter `/werbesitztwas/` und später
unter `/` ohne Änderung.

| Datei | Familie | Achsen | Verwendung |
|---|---|---|---|
| `archivo-latin.woff2` | Archivo Variable | `wght` 100–900, `wdth` 62–125 | Überschriften, Zahlen, Marginalien, Grafiktexte |
| `archivo-latin-ext.woff2` | Archivo Variable | dieselben | nur Latin Extended-A (z. B. „Milanović") |
| `sourceserif-latin.woff2` | Source Serif 4 Variable | `wght` 200–900 | Lauftext |
| `sourceserif-latin-ext.woff2` | Source Serif 4 Variable | dieselbe | nur Latin Extended-A |

Beide Familien stehen unter der SIL Open Font License 1.1 (siehe `LIZENZ-*.txt`)
und tragen die OpenType-Funktion `tnum`; die Seite schaltet sie überall dort ein,
wo Zahlen untereinander verglichen werden.

Die `-ext`-Dateien sind mit `fonttools` auf den Bereich U+0100–017F verkleinert.
Sie werden über `unicode-range` nur geladen, wenn ein Zeichen daraus vorkommt.
Herkunft der Rohdateien: npm-Pakete `@fontsource-variable/archivo` und
`@fontsource-variable/source-serif-4` (Subset „latin" bzw. „latin-ext").
