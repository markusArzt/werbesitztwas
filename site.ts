// Zentrale Projektkonstanten. Bewusst hier und nicht in .env,
// damit jede Änderung im Git-Diff sichtbar ist.

export const MARKE = 'Wer besitzt was?';

export const UNTERTITEL = 'Vermögen in Österreich: die Zahlen, die Quellen, die Gegenargumente.';

// Solange false, traegt jede Seite ein noindex.
// Erst auf true stellen, wenn die Seite wirklich oeffentlich sein soll.
// Eine halbfertige Seite, die Google einmal indexiert hat, bleibt lange
// das erste Suchergebnis zum Projektnamen.
export const INDEXIERBAR = false;

// Solange false, wird die E-Mail-Erfassung (EmailErfassung.astro) auf keiner
// Seite eingebunden. Fuer eine zugangsbeschraenkte Vorschau mit ausgewaehlten
// Personen: keine Formulare, keine Datenerhebung, kein Grund fuer eine fertige
// Datenschutzerklaerung an dieser Stelle. Erst auf true stellen, wenn das
// Formular an einen echten Endpunkt angebunden ist (siehe README, Abschnitt
// "Vor dem Livegang") und die Datenschutzerklaerung dazu passt.
export const EMAIL_AKTIV = false;
