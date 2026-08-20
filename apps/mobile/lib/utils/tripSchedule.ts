export type TripScheduleStatus = 'upcoming' | 'ongoing' | 'past';

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function toTripDay(date: string) {
  return startOfDay(new Date(date));
}

export function getTripScheduleStatus(startDate: string, endDate: string, now = new Date()): TripScheduleStatus {
  const today = startOfDay(now);
  const start = toTripDay(startDate);
  const end = toTripDay(endDate);

  if (today.getTime() < start.getTime()) return 'upcoming';
  if (today.getTime() > end.getTime()) return 'past';
  return 'ongoing';
}

/** 일정이 먼 것일수록 위: 다가오는/진행중은 시작일 내림차순, 지난 일정은 종료일 오름차순 */
export function compareTripsByDistance(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string },
  status: TripScheduleStatus,
) {
  if (status === 'past') {
    return toTripDay(a.endDate).getTime() - toTripDay(b.endDate).getTime();
  }

  return toTripDay(b.startDate).getTime() - toTripDay(a.startDate).getTime();
}
