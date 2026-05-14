export function bucketCountsByDay(dates: Date[], dayCount: number): { key: string; label: string; count: number }[] {
  const map = new Map<string, number>();
  const keys: string[] = [];

  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    keys.push(key);
    map.set(key, 0);
  }

  for (const dt of dates) {
    const key = dt.toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }

  return keys.map((key) => ({
    key,
    label: key.slice(5),
    count: map.get(key) ?? 0,
  }));
}
