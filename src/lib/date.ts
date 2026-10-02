export function dayKey(timestamp: number = Date.now()): string {
  const d = new Date(timestamp);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function startOfDay(day: string): number {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, date ?? 1, 0, 0, 0, 0).getTime();
}

export function addDays(day: string, amount: number): string {
  return dayKey(startOfDay(day) + amount * 86_400_000);
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
}

export function formatDayLabel(day: string): string {
  const today = dayKey();
  if (day === today) return 'Hoy';
  if (day === addDays(today, -1)) return 'Ayer';
  const [, month, date] = day.split('-');
  return `${date}/${month}`;
}

export function elapsedLabel(timestamp: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
