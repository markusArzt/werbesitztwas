// Umschließt die festen Abschnitte eines Moduls mit <section>-Elementen,
// damit sie gestaltet werden können.
//
// Warum überhaupt: Die Modultexte tragen laut Projektkonvention immer die
// gleichen Überschriften — „In 20 Sekunden" ist die Kurzfassung, „Das sagt
// die Gegenseite" ist der Abschnitt, der die Seite in einer Fachdiskussion
// trägt. Ohne Umschließung sind das im HTML nur h2-Elemente unter vielen,
// und CSS kann Überschriften nicht nach ihrem Text auswählen.
//
// Das Plugin ändert keinen Text: Es fügt öffnende und schließende Tags ein
// und lässt die Trennlinie (`---`) weg, wo eine Abschnittskante sie ersetzt.
// Wird eine Überschrift im Content umbenannt, fällt der Abschnitt auf die
// normale Textgestaltung zurück — kein Fehler, nur weniger Auszeichnung.

const ABSCHNITTE = [
  ['in 20 sekunden', 'kurzfassung'],
  ['das sagt die gegenseite', 'gegenseite'],
  ['quellen', 'quellen'],
  ['weiter', 'weiter'],
];

function text(knoten) {
  if (typeof knoten.value === 'string') return knoten.value;
  if (Array.isArray(knoten.children)) return knoten.children.map(text).join('');
  return '';
}

function art(knoten) {
  if (!knoten || knoten.type !== 'heading' || knoten.depth !== 2) return null;
  const t = text(knoten).trim().toLowerCase().replace(/\s+/g, ' ');
  const treffer = ABSCHNITTE.find(([name]) => name === t);
  return treffer ? treffer[1] : null;
}

export function remarkAbschnitte() {
  return function transformer(tree) {
    const neu = [];
    let offen = false;

    const schliessen = () => {
      if (offen) {
        neu.push({ type: 'html', value: '</section>' });
        offen = false;
      }
    };

    tree.children.forEach((knoten, i) => {
      // Eine Trennlinie beendet einen offenen Abschnitt. Die Kante des
      // Kastens trennt dann schon — eine zweite Linie wäre doppelt.
      if (knoten.type === 'thematicBreak') {
        if (offen) {
          schliessen();
          return;
        }
        if (art(tree.children[i + 1])) return;
        neu.push(knoten);
        return;
      }

      const kennung = art(knoten);
      if (knoten.type === 'heading' && knoten.depth <= 2) schliessen();

      if (kennung) {
        neu.push({
          type: 'html',
          value: `<section class="abschnitt abschnitt--${kennung}">`,
        });
        offen = true;
      }

      neu.push(knoten);
    });

    schliessen();
    tree.children = neu;
  };
}
