export const MAX_TRIP_DAYS = 30;

function toDateOnly(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 시작일·종료일 포함 일수 */
export function getInclusiveDayCount(startDate: string, endDate: string) {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function isWithinMaxTripDays(startDate: string, endDate: string) {
  return getInclusiveDayCount(startDate, endDate) <= MAX_TRIP_DAYS;
}

/** 시작일 기준 선택 가능한 최대 종료일 (포함 30일) */
export function getMaxTripEndDate(startDate: string) {
  const date = toDateOnly(startDate);
  date.setDate(date.getDate() + (MAX_TRIP_DAYS - 1));
  return toDateKey(date);
}
