// Baut Links, die auch unter einem Basispfad funktionieren.
// Auf GitHub Pages liegt die Seite unter /werbesitztwas/, später unter einer
// eigenen Domain unter /. Nie absolute Pfade wie "/daten/" direkt schreiben,
// sondern immer pfad('/daten/').

const BASIS = import.meta.env.BASE_URL ?? '/';

export function pfad(ziel: string): string {
  const b = BASIS.endsWith('/') ? BASIS.slice(0, -1) : BASIS;
  const z = ziel.startsWith('/') ? ziel : `/${ziel}`;
  return `${b}${z}` || '/';
}
