export function monthToHalfYear(month: string): string {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const mm = Number(monthText);
  const half = mm <= 6 ? 1 : 2;
  return `${year}-H${half}`;
}

export function isMonthText(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}
