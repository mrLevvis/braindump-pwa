const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Formatiert die übergebenen ISO-Zeitangabe als Uhrzeit im Format "HH:MM".
 * Bei ungültigen oder unerwarteten Datumswerten wird "--:--" zurückgegeben.
 * @param createdAtIso ISO-String der zu formatierenden Zeit, z.B. "2024-06-01T14:30:00Z"
 * @returns Formatierte Uhrzeit als String, z.B. "16:30" (je nach Zeitzone) oder "--:--" bei Fehlern
 */
export const formatCreatedTime = (createdAtIso: string): string => {
  const createdAt = new Date(createdAtIso);

  // Fail-safe fuer unerwartete oder defekte Datumswerte aus APIs/Seeds.
  if (Number.isNaN(createdAt.getTime())) return '--:--';

  return TIME_FORMATTER.format(createdAt);
};

/**
 * Formatiert die übergebenen ISO-Zeitangabe als Datum im Format "DD. MM. YYYY".
 * Bei ungültigen oder unerwarteten Datumswerten wird "--. --. ----" zurückgegeben.
 * @param createdAtIso ISO-String der zu formatierenden Zeit, z.B. "2024-06-01T14:30:00Z"
 * @returns Formatiertes Datum als String, z.B. "01. 06. 2024" oder "--. --. ----" bei Fehlern
 */
export const formatCreatedDateTime = (createdAtIso: string): string => {
  const createdAt = new Date(createdAtIso);

  // Fail-safe fuer unerwartete oder defekte Datumswerte aus APIs/Seeds.
  if (Number.isNaN(createdAt.getTime())) return '--. --. ----';

  return createdAt.toLocaleDateString();
}