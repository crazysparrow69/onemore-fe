const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function ageOn(birthDate: string, onDate: string): number {
  const [birthYear = 0, birthMonth = 0, birthDay = 0] = birthDate
    .split('-')
    .map(Number);
  const [year = 0, month = 0, day = 0] = onDate.split('-').map(Number);
  const birthdayPassed =
    month > birthMonth || (month === birthMonth && day >= birthDay);
  return year - birthYear - (birthdayPassed ? 0 : 1);
}
