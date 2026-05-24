const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

export const formatCreatedTime = (createdAtIso: string): string => {
  const createdAt = new Date(createdAtIso);

  // Fail-safe fuer unerwartete oder defekte Datumswerte aus APIs/Seeds.
  if (Number.isNaN(createdAt.getTime())) return '--:--';

  return TIME_FORMATTER.format(createdAt);
};
