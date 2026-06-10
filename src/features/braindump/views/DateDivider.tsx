const LABEL_FMT = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

export function DateDivider({ dateIso }: Readonly<{ dateIso: string }>) {
  const label = LABEL_FMT.format(new Date(`${dateIso}T00:00:00`));

  return (
    <li className="flex items-center gap-3 py-1 select-none" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <time
        dateTime={dateIso}
        className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide"
      >
        {label}
      </time>
      <span className="h-px flex-1 bg-border" />
    </li>
  );
}
