const isoDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** "2025-11-27" → "Nov 27, 2025", read as UTC so the day never shifts with the visitor's time zone. */
export const formatIsoDate = (date: string) => isoDate.format(new Date(`${date}T00:00:00Z`));
