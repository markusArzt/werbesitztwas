// Erzeugt Grafiken zur Bauzeit direkt aus data/sources.yml.
//
// Der Sinn: Die Zahlen im Bild koennen nicht von den Zahlen im Text abweichen,
// weil beide aus derselben Datei stammen. Aendert die OeNB ihre Daten, aendert
// man einen Wert - Text und Grafik stimmen wieder.
//
// Ausgabe ist statisches SVG: kein JavaScript, druckbar, funktioniert im
// Dunkelmodus ueber CSS-Variablen.

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function zahl(sources, id) {
  const e = sources[id];
  if (!e || typeof e.zahl !== 'number') {
    throw new Error(`Grafik: Quelle "${id}" fehlt oder hat kein numerisches Feld "zahl"`);
  }
  return e.zahl;
}

function feld(sources, id, name) {
  const e = sources[id];
  if (!e || e[name] === undefined) {
    throw new Error(`Grafik: Quelle "${id}" fehlt oder hat kein Feld "${name}"`);
  }
  return e[name];
}

// Deutsche Zahlformate. Ab einer Million wird gerundet dargestellt, weil die
// Grafik ein Groessenverhaeltnis zeigen soll und keine Buchhaltung ist.
function eur(n) {
  if (n >= 1000000) {
    const mio = Math.round((n / 1000000) * 10) / 10;
    return `${String(mio).replace('.', ',')} Mio. €`;
  }
  // Bewusst ohne toLocaleString: das Ergebnis haengt von der ICU-Version der
  // Buildumgebung ab und liefert dort teils schmale Leerzeichen statt Punkte.
  const s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${s} €`;
}

function mrd(n) {
  const v = n < 10 ? Math.round(n * 100) / 100 : Math.round(n * 10) / 10;
  return `${String(v).replace('.', ',')} Mrd. €`;
}

function prozent(n) {
  return `${String(Math.round(n * 10) / 10).replace('.', ',')} %`;
}

// SVG-Koordinaten auf zwei Nachkommastellen, sonst steht im Markup
// 124.23529411764706 und jedes Diff wird unlesbar.
function r(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Verteilungsbalken mit ausgewiesener Datenluecke.
 *
 * Die Aussage der Grafik ist nicht der Balken, sondern das schraffierte Feld:
 * Die Grenze zum reichsten Prozent liegt irgendwo darin, und niemand weiss wo.
 */
function verteilung(sources) {
  const aUntere = zahl(sources, 'at_anteil_untere_haelfte');
  const cTop5 = zahl(sources, 'at_anteil_top5');
  const bMitte = Math.round((100 - aUntere - cTop5) * 10) / 10;

  const schaetzMin = zahl(sources, 'at_anteil_top1_roh');
  const schaetzMax = zahl(sources, 'at_anteil_top1_oenb_simulation');

  const X = 16, W = 368, Y = 58, H = 52;
  const px = (anteil) => (W * anteil) / 100;

  const x1 = X + px(aUntere);
  const x2 = x1 + px(bMitte);

  // Vermoegen ist aufsteigend sortiert, das reichste Prozent liegt ganz rechts.
  const bandLinks = X + px(100 - schaetzMax);
  const bandRechts = X + px(100 - schaetzMin);

  const stand = sources.at_anteil_top5?.abgerufen ?? '';

  return `<figure class="grafik">
<svg viewBox="0 0 400 300" width="100%" role="img" aria-labelledby="gt-vert gd-vert" xmlns="http://www.w3.org/2000/svg">
<title id="gt-vert">Verteilung des privaten Nettovermögens in Österreich</title>
<desc id="gd-vert">Ein waagrechter Balken stellt das gesamte private Nettovermögen dar. Die ärmere Hälfte der Haushalte hält ${aUntere} Prozent, die mittleren 45 Prozent halten rund ${bMitte} Prozent, die reichsten 5 Prozent halten ${cTop5} Prozent. Ein schraffiertes Feld über dem rechten Teil des Balkens markiert den Bereich, in dem die Grenze zum reichsten Prozent liegen könnte: Schätzungen reichen von ${schaetzMin} bis ${schaetzMax} Prozent des Gesamtvermögens. Amtlich erhoben wird dieser Wert in Österreich nicht.</desc>

<defs>
  <pattern id="schraffur" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="7" stroke="var(--daten-unbekannt)" stroke-width="2.4"/>
  </pattern>
</defs>

<text x="${X}" y="22" class="g-titel">Wem gehört das Vermögen in Österreich?</text>
<text x="${X}" y="40" class="g-unter">Anteile am privaten Nettovermögen, Haushalte aufsteigend sortiert</text>

<rect x="${X}" y="${Y}" width="${px(aUntere)}" height="${H}" fill="var(--daten-1)"/>
<rect x="${x1}" y="${Y}" width="${px(bMitte)}" height="${H}" fill="var(--daten-2)"/>
<rect x="${x2}" y="${Y}" width="${px(cTop5)}" height="${H}" fill="var(--daten-3)"/>
<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="var(--linie)" stroke-width="1"/>

<rect x="${bandLinks}" y="${Y}" width="${bandRechts - bandLinks}" height="${H}" fill="url(#schraffur)"/>
<line x1="${bandLinks}" y1="${Y - 8}" x2="${bandLinks}" y2="${Y + H + 8}" stroke="var(--daten-unbekannt)" stroke-width="1.5" stroke-dasharray="3 3"/>
<line x1="${bandRechts}" y1="${Y - 8}" x2="${bandRechts}" y2="${Y + H + 8}" stroke="var(--daten-unbekannt)" stroke-width="1.5" stroke-dasharray="3 3"/>

<circle cx="${(bandLinks + bandRechts) / 2}" cy="${Y + H / 2 - 2}" r="15" fill="var(--flaeche)" stroke="var(--daten-unbekannt)" stroke-width="1.5"/>
<text x="${(bandLinks + bandRechts) / 2}" y="${Y + H / 2 + 6}" class="g-frage" text-anchor="middle">?</text>

<text x="${X}" y="140" class="g-hinweis">Irgendwo in diesem Feld verläuft die Grenze zum reichsten 1 %.</text>
<text x="${X}" y="155" class="g-hinweis">Schätzungen reichen von ${schaetzMin} % bis ${schaetzMax} % des Gesamtvermögens.</text>
<text x="${X}" y="170" class="g-hinweis g-hinweis--stark">Amtlich erhoben wird dieser Wert nicht.</text>

<rect x="${X}" y="196" width="11" height="11" fill="var(--daten-1)"/>
<text x="${X + 19}" y="205" class="g-legende">Ärmere Hälfte der Haushalte: unter ${aUntere} %</text>
<rect x="${X}" y="216" width="11" height="11" fill="var(--daten-2)"/>
<text x="${X + 19}" y="225" class="g-legende">Die mittleren 45 %: rund ${bMitte} %</text>
<rect x="${X}" y="236" width="11" height="11" fill="var(--daten-3)"/>
<text x="${X + 19}" y="245" class="g-legende">Reichste 5 %: ${cTop5} % — Höchstwert im Euroraum</text>

<text x="${X}" y="276" class="g-quelle">Quellen: EZB, Distributional Wealth Accounts; OeNB, HFCS 2023.</text>
<text x="${X}" y="289" class="g-quelle">Stand ${esc(stand)} · werbesitztwas.at · CC BY 4.0</text>
</svg>
<figcaption>Alle Werte mit Quelle und Datenstand unter <a href="{{BASIS}}/daten/">Daten und Quellen</a>.</figcaption>
</figure>`;
}

/**
 * Erbschaften: Wer erbt ueberhaupt, und wie gross sind die Abstaende.
 *
 * Die Aussage ist nicht der einzelne Betrag, sondern zweimal ein Verhaeltnis.
 * Oben: Erben ist keine Mehrheitserfahrung.
 * Unten: Der Durchschnittsbalken ist absichtlich winzig. Beide Balken haben
 * denselben Massstab, sonst waere der Vergleich wertlos. Die gestrichelte
 * Linie bei einer Million zeigt, dass eine Schwelle in dieser Hoehe weit
 * oberhalb der normalen Erbschaft und weit unterhalb der Spitze liegt.
 */
function erbschaften(sources) {
  const quote = zahl(sources, 'at_erbquote_haushalte');
  const ohne = Math.round((100 - quote) * 10) / 10;

  const schnitt = zahl(sources, 'at_erbe_durchschnitt');
  const top1 = zahl(sources, 'at_erbe_top1');
  const schwelle = zahl(sources, 'at_erbe_schwelle_million');

  const X = 16, W = 368;
  const px = (wert) => (W * wert) / top1;

  const wSchnitt = Math.max(px(schnitt), 2);
  const xSchwelle = X + px(schwelle);
  const faktor = Math.round(top1 / schnitt);

  const stand = sources.at_erbquote_haushalte?.abgerufen ?? '';

  return `<figure class="grafik">
<svg viewBox="0 0 400 300" width="100%" role="img" aria-labelledby="gt-erb gd-erb" xmlns="http://www.w3.org/2000/svg">
<title id="gt-erb">Wer in Österreich erbt und wie viel</title>
<desc id="gd-erb">Zwei Darstellungen. Oben ein Balken für alle Haushalte: ${prozent(quote)} haben jemals geerbt oder etwas geschenkt bekommen, ${prozent(ohne)} noch nie. Unten zwei Balken im selben Maßstab: Die durchschnittliche Erbschaft beträgt ${eur(schnitt)}, im obersten Prozent der Erbschaftsverteilung werden im Schnitt ${eur(top1)} übertragen, also rund das ${faktor}-Fache. Eine gestrichelte Linie markiert die Höhe von einer Million Euro. Sie liegt weit oberhalb der durchschnittlichen Erbschaft. Erbschaften über dieser Höhe fließen weniger als einem Prozent der Bevölkerung zu.</desc>

<text x="${X}" y="22" class="g-titel">Erben ist die Ausnahme, große Erben sind die Ausnahme davon</text>
<text x="${X}" y="40" class="g-unter">Haushalte in Österreich und die Höhe der Erbschaften</text>

<text x="${X}" y="60" class="g-legende">Haben schon einmal geerbt oder etwas geschenkt bekommen</text>
<rect x="${X}" y="66" width="${W}" height="20" fill="var(--daten-1)"/>
<rect x="${X}" y="66" width="${r((W * quote) / 100)}" height="20" fill="var(--daten-3)"/>
<rect x="${X}" y="66" width="${W}" height="20" fill="none" stroke="var(--linie)" stroke-width="1"/>
<text x="${X}" y="100" class="g-legende">${prozent(quote)} ja</text>
<text x="${X + W}" y="100" class="g-legende" text-anchor="end">${prozent(ohne)} nie</text>

<text x="${X}" y="128" class="g-legende">Wer überhaupt erbt, im Schnitt</text>
<text x="${X + W}" y="128" class="g-legende" text-anchor="end">${eur(schnitt)}</text>
<rect x="${X}" y="134" width="${r(wSchnitt)}" height="18" fill="var(--daten-2)"/>

<text x="${X}" y="172" class="g-legende">Oberstes Prozent der Erbschaften, im Schnitt</text>
<text x="${X + W}" y="172" class="g-legende" text-anchor="end">${eur(top1)}</text>
<rect x="${X}" y="178" width="${W}" height="18" fill="var(--daten-3)"/>

<line x1="${r(xSchwelle)}" y1="${126}" x2="${r(xSchwelle)}" y2="${202}" stroke="var(--daten-unbekannt)" stroke-width="1.5" stroke-dasharray="3 3"/>
<text x="${r(xSchwelle + 5)}" y="214" class="g-hinweis">Schwelle ${eur(schwelle)}</text>

<text x="${X}" y="236" class="g-hinweis">Beide Balken im selben Maßstab. Der Abstand beträgt rund das ${faktor}-Fache.</text>
<text x="${X}" y="251" class="g-hinweis g-hinweis--stark">Erbschaften über einer Million erhalten weniger als 1 % der Bevölkerung.</text>

<text x="${X}" y="276" class="g-quelle">Quellen: OeNB, HFCS Austria 2023 (Erbquote); Grünberger/Derndorfer/</text>
<text x="${X}" y="289" class="g-quelle">Schnetzer 2024, Schätzung für 2025 · Stand ${esc(stand)} · werbesitztwas.at · CC BY 4.0</text>
</svg>
<figcaption>Alle Werte mit Quelle und Datenstand unter <a href="{{BASIS}}/daten/">Daten und Quellen</a>.</figcaption>
</figure>`;
}

/**
 * Betriebsvermoegen: wer besitzt welches, und wie verteilt es sich.
 *
 * Die einfachste starke Grafik des Projekts, weil der obere Balken praktisch
 * nur aus einem Segment besteht. Genau deshalb braucht er den unteren Teil:
 * Ein Balken, der zu 95 Prozent einfaerbig ist, wirkt fuer sich genommen wie
 * ein Darstellungsfehler. Die drei Besitzquoten darunter machen aus dem
 * Eindruck eine nachvollziehbare Aussage - je wichtiger die Vermoegensart
 * fuer Verfuegungsgewalt ist, desto weniger Haushalte haben ueberhaupt
 * welche davon.
 *
 * Das schraffierte Feld am rechten Rand ist bewusst OHNE Messwert. Die EZB
 * weist einzelne Vermoegensarten nicht unterhalb des obersten Zehntels aus;
 * eine Grenze einzuzeichnen, waere hier erfunden. Die Schraffur markiert
 * deshalb keinen Bereich, sondern eine Leerstelle - Breite rein grafisch,
 * so auch im desc-Text ausgewiesen.
 */
function betriebsvermoegen(sources) {
  const top10 = zahl(sources, 'at_anteil_betriebsvermoegen_top10');
  const rest = Math.round((100 - top10) * 10) / 10;

  const quoten = [
    ['Das eigene Zuhause', zahl(sources, 'at_beteiligung_hauptwohnsitz')],
    ['Weitere Immobilien', zahl(sources, 'at_beteiligung_weitere_immobilien')],
    ['Betriebsvermögen', zahl(sources, 'at_beteiligung_betriebsvermoegen')],
  ];

  const X = 16, W = 368;
  const px = (anteil) => (W * anteil) / 100;

  const Y = 64, H = 28;
  const xTop10 = X + px(rest);

  const HB = 34;
  const xBand = X + W - HB;

  const zeilen = quoten.map(([bez, wert], i) => {
    const y = 150 + i * 28;
    const farbe = i === quoten.length - 1 ? 'var(--daten-3)' : 'var(--daten-2)';
    return `<text x="${X}" y="${y}" class="g-legende">${esc(bez)}</text>
<text x="${X + W}" y="${y}" class="g-legende" text-anchor="end">${prozent(wert)}</text>
<rect x="${X}" y="${y + 4}" width="${r(px(wert))}" height="12" fill="${farbe}"/>
<rect x="${X}" y="${y + 4}" width="${W}" height="12" fill="none" stroke="var(--linie)" stroke-width="1"/>`;
  }).join('\n');

  const stand = sources.at_anteil_betriebsvermoegen_top10?.abgerufen ?? '';

  return `<figure class="grafik">
<svg viewBox="0 0 400 300" width="100%" role="img" aria-labelledby="gt-betr gd-betr" xmlns="http://www.w3.org/2000/svg">
<title id="gt-betr">Betriebsvermögen in Österreich: wer es besitzt und wie es verteilt ist</title>
<desc id="gd-betr">Zwei Darstellungen. Oben ein Balken für das gesamte Betriebsvermögen der privaten Haushalte: ${prozent(top10)} entfallen auf das reichste Zehntel der Haushalte, die übrigen 90 Prozent der Haushalte halten zusammen ${prozent(rest)}. Am rechten Ende des Balkens markiert ein schraffiertes Feld, dass nicht veröffentlicht wird, wie sich der Anteil innerhalb des reichsten Zehntels verteilt. Die Breite dieses Feldes ist rein grafisch und enthält keinen Messwert. Unten drei Balken im selben Maßstab für den Anteil der Haushalte, die die jeweilige Vermögensart überhaupt besitzen: das eigene Zuhause ${prozent(quoten[0][1])}, weitere Immobilien ${prozent(quoten[1][1])}, Betriebsvermögen ${prozent(quoten[2][1])}.</desc>

<defs>
  <pattern id="schraffur-betr" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="7" stroke="var(--daten-unbekannt)" stroke-width="2.4"/>
  </pattern>
</defs>

<text x="${X}" y="22" class="g-titel">Wenige besitzen Betriebe, ein Zehntel hält fast alles</text>
<text x="${X}" y="40" class="g-unter">Unternehmens- und Betriebsvermögen der privaten Haushalte</text>

<text x="${X}" y="58" class="g-legende">Anteil am gesamten Betriebsvermögen</text>
<rect x="${X}" y="${Y}" width="${r(px(rest))}" height="${H}" fill="var(--daten-1)"/>
<rect x="${r(xTop10)}" y="${Y}" width="${r(px(top10))}" height="${H}" fill="var(--daten-3)"/>
<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="var(--linie)" stroke-width="1"/>

<rect x="${xBand}" y="${Y}" width="${HB}" height="${H}" fill="url(#schraffur-betr)"/>
<line x1="${xBand}" y1="${Y - 8}" x2="${xBand}" y2="${Y + H + 8}" stroke="var(--daten-unbekannt)" stroke-width="1.5" stroke-dasharray="3 3"/>
<circle cx="${xBand + HB / 2}" cy="${Y + H / 2}" r="11" fill="var(--flaeche)" stroke="var(--daten-unbekannt)" stroke-width="1.5"/>
<text x="${xBand + HB / 2}" y="${Y + H / 2 + 5}" class="g-frage" text-anchor="middle">?</text>

<text x="${X}" y="112" class="g-legende">Die anderen 90 % der Haushalte: ${prozent(rest)}</text>
<text x="${X + W}" y="112" class="g-legende" text-anchor="end">Reichstes Zehntel: ${prozent(top10)}</text>

<text x="${X}" y="136" class="g-legende">Anteil der Haushalte, die überhaupt welche besitzen</text>
${zeilen}

<text x="${X}" y="244" class="g-hinweis">Das schraffierte Feld ist ein Hinweis, kein gemessener Wert.</text>
<text x="${X}" y="259" class="g-hinweis g-hinweis--stark">Wie sich diese ${prozent(top10)} im Zehntel verteilen, wird nicht veröffentlicht.</text>

<text x="${X}" y="276" class="g-quelle">Quellen: EZB, Distributional Wealth Accounts, Auswertung Momentum</text>
<text x="${X}" y="289" class="g-quelle">Institut; OeNB, HFCS 2023 · Stand ${esc(stand)} · werbesitztwas.at · CC BY 4.0</text>
</svg>
<figcaption>Alle Werte mit Quelle und Datenstand unter <a href="{{BASIS}}/daten/">Daten und Quellen</a>.</figcaption>
</figure>`;
}

/**
 * Steuersaetze nach Art des Zuflusses.
 *
 * Die Aussage der Grafik ist ausdruecklich NICHT "Kapital wird niedriger
 * besteuert als Arbeit". Diese Aussage waere angreifbar: Der ausgeschuettete
 * Unternehmensgewinn liegt mit 44,18 Prozent in der Naehe der oberen
 * Tarifstufen, und 27,5 Prozent gelten fuer jedes Wertpapierdepot gleich,
 * auch fuer ein sehr kleines.
 *
 * Die Aussage ist die Reihenfolge der Zeilen und die Faerbung: Nach unten
 * sinkt der Satz, und gleichzeitig steigt die Voraussetzung. Die dunkel
 * eingefaerbten Zeilen setzen voraus, dass man ueber die Form und den
 * Zeitpunkt entscheiden kann - also Vermoegen haelt und nicht Lohn bezieht.
 * Deshalb steht ueber der Grafik "Zufluss", nicht "Einkommen".
 *
 * Die gestrichelte Senkrechte liegt beim Spitzengrenzsteuersatz auf Arbeit
 * und laeuft durch alle Zeilen. Sie ist der Vergleichsmassstab.
 *
 * Bewusst ohne Datenluecken-Schraffur, anders als die drei Grafiken davor:
 * Hier ist nichts unbekannt. Alle Werte sind geltendes Recht und exakt.
 * Was fehlt, ist die effektive Belastung sehr grosser Vermoegen - die steht
 * im Text und laesst sich nicht als Balken darstellen, ohne sie zu erfinden.
 */
function steuersaetze(sources) {
  const arbeitVon = zahl(sources, 'at_einkommensteuer_eingangssatz');
  const arbeitBis = zahl(sources, 'at_einkommensteuer_spitzensatz');

  // wahl: true bedeutet, dass ueber Form oder Zeitpunkt des Zuflusses
  // entschieden werden kann. Nicht "niedriger", sondern "gestaltbar".
  const zeilen = [
    {
      bez: 'Arbeitseinkommen',
      von: arbeitVon,
      bis: arbeitBis,
      wahl: false,
    },
    {
      bez: 'Ausgeschütteter Unternehmensgewinn',
      bis: zahl(sources, 'at_gesamtbelastung_ausschuettung'),
      wahl: true,
    },
    {
      bez: 'Dividenden, Kursgewinne',
      bis: zahl(sources, 'at_kest_kapitalertraege'),
      wahl: false,
    },
    {
      bez: 'Zinsen aus Spareinlagen',
      bis: zahl(sources, 'at_kest_zinsen'),
      wahl: false,
    },
    {
      bez: 'Gewinn, der im Unternehmen bleibt',
      bis: zahl(sources, 'at_koest_satz'),
      wahl: true,
    },
    {
      bez: 'Wertzuwachs ohne Verkauf',
      bis: zahl(sources, 'at_unrealisierte_wertzuwaechse'),
      wahl: true,
    },
    {
      bez: 'Erbschaft oder Schenkung',
      bis: zahl(sources, 'at_erbschaftsteuer_2008'),
      wahl: true,
    },
  ];

  const X = 16, W = 368;
  // Skala aus den Daten, nicht fest verdrahtet: Aendert sich der
  // Spitzensteuersatz, aendert sich die Achse mit.
  const skala = Math.ceil(Math.max(...zeilen.map((z) => z.bis)) / 10) * 10;
  const px = (satz) => (W * satz) / skala;

  const Y0 = 70, SCHRITT = 20, HB = 10;
  const yAchse = Y0 + zeilen.length * SCHRITT + 6;
  const xSpitze = X + px(arbeitBis);

  const balken = zeilen.map((z, i) => {
    const y = Y0 + i * SCHRITT;
    const farbe = z.wahl ? 'var(--daten-3)' : 'var(--daten-2)';
    const x0 = X + px(z.von ?? 0);
    // Nullwerte bekommen einen Stummel, sonst wirkt die Zeile wie ein Fehler.
    const breite = Math.max(px(z.bis) - px(z.von ?? 0), 2);
    const wertText = z.von === undefined
      ? prozent(z.bis)
      : `${prozent(z.von)} bis ${prozent(z.bis)}`;
    return `<text x="${X}" y="${y}" class="g-legende">${esc(z.bez)}</text>
<text x="${X + W}" y="${y}" class="g-legende" text-anchor="end">${wertText}</text>
<rect x="${r(x0)}" y="${y + 4}" width="${r(breite)}" height="${HB}" fill="${farbe}"/>`;
  }).join('\n');

  const ticks = [0, skala / 3, (skala / 3) * 2, skala].map((t) => {
    const x = X + px(t);
    return `<line x1="${r(x)}" y1="${yAchse}" x2="${r(x)}" y2="${yAchse + 4}" stroke="var(--linie)" stroke-width="1"/>
<text x="${r(x)}" y="${yAchse + 15}" class="g-quelle" text-anchor="middle">${prozent(t)}</text>`;
  }).join('\n');

  const stand = sources.at_kest_kapitalertraege?.abgerufen ?? '';

  return `<figure class="grafik">
<svg viewBox="0 0 400 300" width="100%" role="img" aria-labelledby="gt-steu gd-steu" xmlns="http://www.w3.org/2000/svg">
<title id="gt-steu">Steuersätze in Österreich nach Art des Zuflusses</title>
<desc id="gd-steu">Sieben waagrechte Balken zeigen, wie hoch ein zusätzlicher Euro besteuert wird, je nachdem, woher er kommt. Arbeitseinkommen: ein Grenzsteuersatz von ${prozent(arbeitVon)} bis ${prozent(arbeitBis)}, dargestellt als Spanne; der höchste Wert gilt nur für Einkommensteile über einer Million Euro. Ausgeschütteter Unternehmensgewinn: ${prozent(zeilen[1].bis)}, zusammengesetzt aus Körperschaftsteuer und Kapitalertragsteuer. Dividenden und Kursgewinne: ${prozent(zeilen[2].bis)}. Zinsen aus Spareinlagen: ${prozent(zeilen[3].bis)}. Gewinn, der im Unternehmen bleibt: ${prozent(zeilen[4].bis)}, die Kapitalertragsteuer entsteht erst bei späterer Ausschüttung. Wertzuwachs ohne Verkauf: ${prozent(zeilen[5].bis)}, besteuert wird erst bei Realisierung. Erbschaft oder Schenkung: ${prozent(zeilen[6].bis)}. Eine gestrichelte Senkrechte markiert den Spitzengrenzsteuersatz auf Arbeit als Vergleichsmaßstab. Dunkel eingefärbt sind jene vier Zeilen, bei denen über Form oder Zeitpunkt des Zuflusses entschieden werden kann. Alle Werte sind geltendes Recht, Stand 2026, und keine Schätzungen.</desc>

<text x="${X}" y="22" class="g-titel">Was der Staat vom nächsten Euro nimmt</text>
<text x="${X}" y="40" class="g-unter">Steuersatz nach Art des Zuflusses, Rechtsstand 2026</text>
<text x="${X}" y="58" class="g-legende">Grenzsteuersätze, ohne Sozialversicherungsbeiträge</text>

<line x1="${r(xSpitze)}" y1="${Y0 - 10}" x2="${r(xSpitze)}" y2="${yAchse}" stroke="var(--daten-unbekannt)" stroke-width="1.5" stroke-dasharray="3 3"/>

${balken}

<line x1="${X}" y1="${yAchse}" x2="${X + W}" y2="${yAchse}" stroke="var(--linie)" stroke-width="1"/>
${ticks}

<rect x="${X}" y="${yAchse + 22}" width="11" height="11" fill="var(--daten-3)"/>
<text x="${X + 19}" y="${yAchse + 31}" class="g-hinweis">Form und Zeitpunkt sind wählbar — wenn es etwas zu gestalten gibt.</text>
<text x="${X}" y="${yAchse + 46}" class="g-hinweis g-hinweis--stark">Die Sätze gelten für alle gleich. Die Wahl nicht.</text>

<text x="${X}" y="276" class="g-quelle">Quellen: BMF; USP; WKO. Rechtsstand 2026, ohne Sozialversicherung.</text>
<text x="${X}" y="289" class="g-quelle">Stand ${esc(stand)} · werbesitztwas.at · CC BY 4.0</text>
</svg>
<figcaption>Alle Werte mit Quelle und Datenstand unter <a href="{{BASIS}}/daten/">Daten und Quellen</a>.</figcaption>
</figure>`;
}

/**
 * Elefantenkurve: drei belegte Punkte, keine Kurve.
 *
 * Die Aussage der Grafik ist bewusst nicht die bekannte Form. Zwischen den
 * drei Punkten ist nichts gezeichnet, weil zwischen den drei Punkten nichts
 * belegt ist, was der Methodenkritik standhaelt. Wer die geschwungene Linie
 * zeichnet, behauptet fuer jedes Perzentil einen Wert - und genau diese
 * Werte sind der angegriffene Teil.
 *
 * Der untere Teil traegt deshalb die Kritik selbst: dieselbe Zeitspanne,
 * dasselbe Datenmaterial, drei Rechenwege, drei Ergebnisse. Der Abstand
 * zwischen 24 und 41 Prozent ist die eigentliche Aussage der Grafik.
 *
 * Anders als bei den Grafiken der Module A bis D gibt es hier keine
 * Schraffur. Die Luecke ist nicht eine fehlende Messung, sondern eine
 * offene Methodenfrage. Dafuer ist der leere Raum zwischen den Punkten das
 * ehrlichere Bild.
 */
function elefantenkurve(sources) {
  const punkte = [
    {
      id: 'welt_gic_median',
      buchstabe: 'A',
      kurz: 'Globale Mitte, rund das 50. Perzentil',
      anker: 'start',
    },
    {
      id: 'welt_gic_p80',
      buchstabe: 'B',
      kurz: 'Rund das 80. Perzentil: untere Mitte der reichen Länder',
      anker: 'mitte',
    },
    {
      id: 'welt_gic_top1',
      buchstabe: 'C',
      kurz: 'Das reichste Prozent weltweit',
      anker: 'end',
    },
  ].map((p) => ({
    ...p,
    wachstum: zahl(sources, p.id),
    perzentil: feld(sources, p.id, 'perzentil'),
    text: feld(sources, p.id, 'kurzwert'),
  }));

  const rechnungen = [
    ['Wie veröffentlicht', 'welt_wachstum_original'],
    ['Gleicher Länderkreis', 'welt_wachstum_konsistent'],
    ['Zusätzlich konstante Bevölkerung', 'welt_wachstum_konstantbev'],
  ].map(([bez, id]) => ({ bez, id, wert: zahl(sources, id) }));

  const TX = 16, W = 348;          // Textspalte
  const PX = 46, PW = 318;         // Plotflaeche, Platz links fuer die Achse

  // Obere Flaeche: 0 bis 80 Prozent Wachstum.
  const SKALA = 80;
  const yBase = 118, yTop = 62;
  const py = (v) => yBase - ((yBase - yTop) * v) / SKALA;
  const px = (p) => PX + (PW * p) / 100;

  const gitter = [0, 40, 80].map((t) => `<line x1="${PX}" y1="${r(py(t))}" x2="${PX + PW}" y2="${r(py(t))}" stroke="var(--linie)" stroke-width="1" opacity="${t === 0 ? 1 : 0.35}"/>
<text x="${PX - 6}" y="${r(py(t)) + 3}" class="g-quelle" text-anchor="end">${prozent(t)}</text>`).join('\n');

  const marken = punkte.map((p) => {
    const x = px(p.perzentil), y = py(p.wachstum);
    // Der Buchstabe steht in der Beschriftung des Punktes, nicht in einer
    // eigenen Zeile unter der Achse - dort stiesse er mit "reicher" zusammen.
    const t = `${p.buchstabe} · ${p.text}`;
    const label = p.anker === 'start'
      ? `<text x="${r(x + 9)}" y="${r(y + 4)}" class="g-legende">${esc(t)}</text>`
      : p.anker === 'end'
        ? `<text x="${r(x - 9)}" y="${r(y - 5)}" class="g-legende" text-anchor="end">${esc(t)}</text>`
        : `<text x="${r(x)}" y="${r(y - 10)}" class="g-legende" text-anchor="middle">${esc(t)}</text>`;
    return `<circle cx="${r(x)}" cy="${r(y)}" r="5" fill="var(--daten-3)"/>
${label}`;
  }).join('\n');

  const zeilen = punkte.map((p, i) => {
    const y = 144 + i * 12;
    return `<text x="${TX}" y="${y}" class="g-hinweis">${p.buchstabe} · ${esc(p.kurz)}</text>`;
  }).join('\n');

  // Untere Flaeche: derselbe Zeitraum, drei Rechenwege.
  const skalaB = Math.ceil(Math.max(...rechnungen.map((z) => z.wert)) / 10) * 10;
  const pxB = (v) => (W * v) / skalaB;

  const balken = rechnungen.map((z, i) => {
    const y = 212 + i * 18;
    // Der letzte Balken ist der weiteste; er bekommt die Signalfarbe, weil
    // er zeigt, wie viel die Bereinigung ausmacht.
    const farbe = i === rechnungen.length - 1 ? 'var(--daten-3)' : 'var(--daten-2)';
    return `<text x="${TX}" y="${y}" class="g-legende">${esc(z.bez)}</text>
<text x="${TX + W}" y="${y}" class="g-legende" text-anchor="end">${prozent(z.wert)}</text>
<rect x="${TX}" y="${y + 4}" width="${r(pxB(z.wert))}" height="8" fill="${farbe}"/>`;
  }).join('\n');

  const stand = sources.welt_wachstum_konstantbev?.abgerufen ?? '';

  return `<figure class="grafik">
<svg viewBox="0 0 400 300" width="100%" role="img" aria-labelledby="gt-elef gd-elef" xmlns="http://www.w3.org/2000/svg">
<title id="gt-elef">Weltweites Einkommenswachstum 1988 bis 2008 und die Frage, wie es gerechnet wird</title>
<desc id="gd-elef">Zwei Darstellungen. Oben drei einzelne Punkte in einem Koordinatensystem. Die waagrechte Achse ist die weltweite Einkommensverteilung von den ärmsten zu den reichsten Menschen, die senkrechte Achse das reale Einkommenswachstum zwischen 1988 und 2008. Punkt A liegt rund um das 50. Perzentil bei ${esc(punkte[0].text)}. Punkt B liegt rund um das 80. Perzentil, wo überwiegend die untere Mitte der reichen Länder liegt, bei ${esc(punkte[1].text)}. Punkt C liegt beim reichsten Prozent weltweit bei ${esc(punkte[2].text)}. Zwischen den Punkten ist bewusst keine Linie gezeichnet, weil der Verlauf dazwischen von der Rechenweise abhängt. Unten drei Balken im selben Maßstab für das durchschnittliche weltweite Einkommenswachstum im selben Zeitraum, je nach Rechenweise: wie veröffentlicht ${prozent(rechnungen[0].wert)}, bei gleichem Länderkreis in beiden Jahren ${prozent(rechnungen[1].wert)}, bei zusätzlich konstant gehaltenen Bevölkerungsanteilen der Länder ${prozent(rechnungen[2].wert)}.</desc>

<text x="${TX}" y="22" class="g-titel">Die Elefantenkurve, ohne die Kurve</text>
<text x="${TX}" y="38" class="g-unter">Reales Einkommenswachstum 1988 bis 2008, nach weltweitem Einkommensperzentil</text>

${gitter}
${marken}

<text x="${PX}" y="${yBase + 13}" class="g-quelle">ärmer</text>
<text x="${PX + PW}" y="${yBase + 13}" class="g-quelle" text-anchor="end">reicher</text>

${zeilen}

<text x="${TX}" y="182" class="g-hinweis g-hinweis--stark">Der Verlauf zwischen den Punkten hängt davon ab, wie gerechnet wird.</text>

<text x="${TX}" y="198" class="g-unter">Durchschnittliches Wachstum weltweit, derselbe Zeitraum</text>
${balken}

<text x="${TX}" y="278" class="g-quelle">Quellen: Lakner/Milanović 2016; Corlett 2016, Resolution Foundation.</text>
<text x="${TX}" y="291" class="g-quelle">Stand ${esc(stand)} · werbesitztwas.at · CC BY 4.0</text>
</svg>
<figcaption>Alle Werte mit Quelle und Datenstand unter <a href="{{BASIS}}/daten/">Daten und Quellen</a>.</figcaption>
</figure>`;
}

/**
 * Die drei Forderungen, geordnet nach ihrer Angreifbarkeit.
 *
 * Die Aussage der Grafik ist bewusst nicht, wie viel die Forderungen
 * einbringen, sondern wie wenig. Oben liegt der Bundeshaushalt in voller
 * Breite; der Streifen, um den es hier geht, ist darin kaum zu sehen. Genau
 * das ist der Punkt des Moduls: Wer mit dem Aufkommen argumentiert, bekommt
 * dieses Bild vorgehalten. Also zeigen wir es selbst.
 *
 * Unten dieselben Zahlen vergroessert. Drei Zeilen, drei Belastbarkeiten:
 * Die Hauptforderung hat gar kein Aufkommen (Stummel, weil null hier keine
 * Luecke ist, sondern das Argument). Die Erbschaftssteuer ist eine Spanne
 * nach Abzug von Ausweicheffekten. Die Mindeststeuer ist schraffiert, weil
 * sie auf einer Reichenliste beruht - dieselbe Kennzeichnung wie in Modul A
 * fuer Werte, die geschaetzt und nicht erhoben sind.
 */
function forderungen(sources) {
  const budget = zahl(sources, 'at_bva_2026_auszahlungen');
  const erbMin = feld(sources, 'at_erbst_aufkommen_1mio', 'zahl_min');
  const erbMax = feld(sources, 'at_erbst_aufkommen_1mio', 'zahl_max');
  const mind = zahl(sources, 'at_mindeststeuer_100mio');

  const summeMin = erbMin + mind;
  const summeMax = erbMax + mind;
  const anteilMin = (summeMin / budget) * 100;
  const anteilMax = (summeMax / budget) * 100;

  const X = 16, W = 368;

  // Oben: Massstab des Bundeshaushalts.
  const pxB = (v) => (W * v) / budget;
  const YB = 54, HB = 24;
  const xSummeMin = X + pxB(summeMin);
  const xSummeMax = X + pxB(summeMax);
  // Mindestbreite, sonst verschwindet der Streifen ganz - er soll klein
  // aussehen, aber auffindbar bleiben.
  const breiteSumme = Math.max(xSummeMax - X, 3);

  // Unten: dieselben Werte, eigener Massstab.
  const zoomMax = Math.ceil(Math.max(erbMax, mind)) + 2;
  const pxZ = (v) => (W * v) / zoomMax;

  const zeilen = [
    {
      bez: '1 · Vermögensregister ab hoher Schwelle',
      wert: 'kein Aufkommen',
      von: 0,
      bis: 0,
      art: 'null',
    },
    {
      bez: '2 · Erbschaftssteuer ab 1 Mio. €',
      wert: `${mrd(erbMin)} bis ${mrd(erbMax)}`,
      von: erbMin,
      bis: erbMax,
      art: 'spanne',
    },
    {
      bez: '3 · Mindeststeuer 2 % ab 100 Mio. €',
      wert: mrd(mind),
      von: 0,
      bis: mind,
      art: 'schaetzung',
    },
  ];

  const Y0 = 160, SCHRITT = 24, HZ = 9;
  const yAchse = Y0 + (zeilen.length - 1) * SCHRITT + 5 + HZ + 7;

  const balken = zeilen.map((z, i) => {
    const y = Y0 + i * SCHRITT;
    const x0 = X + pxZ(z.von);
    const breite = Math.max(pxZ(z.bis) - pxZ(z.von), 3);
    const fuell = z.art === 'schaetzung'
      ? 'url(#schraffur-ford)'
      : z.art === 'null'
        ? 'var(--daten-1)'
        : 'var(--daten-3)';
    // Die Nullzeile bekommt zusaetzlich einen Rahmen, damit der Stummel
    // nicht wie ein abgeschnittener Balken wirkt.
    const rahmen = z.art === 'null'
      ? ` stroke="var(--linie)" stroke-width="1"`
      : z.art === 'schaetzung'
        ? ` stroke="var(--daten-unbekannt)" stroke-width="1"`
        : '';
    return `<text x="${X}" y="${y}" class="g-legende">${esc(z.bez)}</text>
<text x="${X + W}" y="${y}" class="g-legende" text-anchor="end">${esc(z.wert)}</text>
<rect x="${r(x0)}" y="${y + 5}" width="${r(breite)}" height="${HZ}" fill="${fuell}"${rahmen}/>`;
  }).join('\n');

  const ticks = [0, 1, 2, 3, 4].filter((t) => t <= zoomMax).map((t) => {
    const x = X + pxZ(t);
    return `<line x1="${r(x)}" y1="${yAchse}" x2="${r(x)}" y2="${yAchse + 4}" stroke="var(--linie)" stroke-width="1"/>
<text x="${r(x)}" y="${yAchse + 15}" class="g-quelle" text-anchor="middle">${t}</text>`;
  }).join('\n');

  const stand = sources.at_bva_2026_auszahlungen?.abgerufen ?? '';

  return `<figure class="grafik">
<svg viewBox="0 0 400 300" width="100%" role="img" aria-labelledby="gt-ford gd-ford" xmlns="http://www.w3.org/2000/svg">
<title id="gt-ford">Was die drei Forderungen einbringen würden, gemessen am Bundeshaushalt</title>
<desc id="gd-ford">Zwei Darstellungen. Oben ein Balken über die volle Breite für die Auszahlungen des Bundes im Jahr 2026 in Höhe von ${mrd(budget)}. Ein schmaler Streifen an seinem linken Rand markiert das geschätzte Aufkommen beider Abgaben zusammen, ${mrd(summeMin)} bis ${mrd(summeMax)}, also rund ${prozent(anteilMin)} bis ${prozent(anteilMax)} der Auszahlungen. Unten dieselben Werte in einem eigenen, stark vergrößerten Maßstab von null bis ${zoomMax} Milliarden Euro, aufgeteilt auf drei Zeilen. Erste Zeile, das Vermögensregister ab hoher Schwelle: kein Aufkommen, weil es keine Abgabe ist. Zweite Zeile, die Erbschaftssteuer ab einer Million Euro: ${mrd(erbMin)} bis ${mrd(erbMax)}, dargestellt als Spanne, nach Abzug von Ausweichreaktionen. Dritte Zeile, eine effektive Mindeststeuer von zwei Prozent auf Vermögen über 100 Millionen Euro: ${mrd(mind)}, schraffiert dargestellt, weil dieser Wert auf einer Reichenliste beruht und nicht auf einer amtlichen Erhebung. Die beiden Schätzungen sind methodisch nicht sauber addierbar, weil nur bei der Erbschaftssteuer Ausweichverhalten berücksichtigt ist.</desc>

<defs>
  <pattern id="schraffur-ford" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="7" stroke="var(--daten-unbekannt)" stroke-width="2.4"/>
  </pattern>
</defs>

<text x="${X}" y="22" class="g-titel">Drei Forderungen, nach Angreifbarkeit geordnet</text>
<text x="${X}" y="38" class="g-unter">Geschätztes jährliches Aufkommen, verglichen mit den Auszahlungen des Bundes 2026</text>

<rect x="${X}" y="${YB}" width="${W}" height="${HB}" fill="var(--daten-1)"/>
<rect x="${X}" y="${YB}" width="${r(breiteSumme)}" height="${HB}" fill="var(--daten-3)"/>
<rect x="${X}" y="${YB}" width="${W}" height="${HB}" fill="none" stroke="var(--linie)" stroke-width="1"/>
<text x="${X + W}" y="${YB - 6}" class="g-legende" text-anchor="end">Auszahlungen des Bundes 2026: ${mrd(budget)}</text>

<line x1="${r(xSummeMin)}" y1="${YB + HB}" x2="${r(X)}" y2="${YB + HB + 14}" stroke="var(--daten-unbekannt)" stroke-width="1" stroke-dasharray="3 3"/>
<line x1="${r(xSummeMax)}" y1="${YB + HB}" x2="${r(X + W)}" y2="${YB + HB + 14}" stroke="var(--daten-unbekannt)" stroke-width="1" stroke-dasharray="3 3"/>

<text x="${X}" y="${YB + HB + 30}" class="g-hinweis">Beide Abgaben zusammen: ${mrd(summeMin)} bis ${mrd(summeMax)} —</text>
<text x="${X}" y="${YB + HB + 45}" class="g-hinweis">rund ${prozent(anteilMin)} bis ${prozent(anteilMax)} der Auszahlungen des Bundes.</text>

<text x="${X}" y="${Y0 - 20}" class="g-unter">Dieselben Werte, vergrößert (Mrd. €)</text>
${balken}

<line x1="${X}" y1="${yAchse}" x2="${X + W}" y2="${yAchse}" stroke="var(--linie)" stroke-width="1"/>
${ticks}

<text x="${X}" y="${yAchse + 33}" class="g-hinweis g-hinweis--stark">Das ist wenig. Das ist nicht der Einwand, sondern der Punkt.</text>
<text x="${X}" y="${yAchse + 48}" class="g-hinweis">Schraffiert: geschätzt aus Reichenlisten, nicht amtlich erhoben.</text>

<text x="${X}" y="276" class="g-quelle">Quellen: Budgetdienst des Parlaments; Grünberger u. a. 2024; EU Tax Observatory 2025.</text>
<text x="${X}" y="289" class="g-quelle">Stand ${esc(stand)} · werbesitztwas.at · CC BY 4.0</text>
</svg>
<figcaption>Alle Werte mit Quelle und Datenstand unter <a href="{{BASIS}}/daten/">Daten und Quellen</a>.</figcaption>
</figure>`;
}

export const GRAFIKEN = { verteilung, erbschaften, betriebsvermoegen, steuersaetze, elefantenkurve, forderungen };

export function grafikSvg(id, sources) {
  const bauer = GRAFIKEN[id];
  if (!bauer) throw new Error(`Unbekannte Grafik: "${id}". Bekannt: ${Object.keys(GRAFIKEN).join(', ')}`);
  return bauer(sources);
}
