export const OPEN_METEO_FORECAST_DAYS = 16;
export const OPEN_METEO_DETAIL_DAYS = 7;
export const OPEN_METEO_PAST_DAYS_MAX = 92;
export const OPEN_METEO_ATTRIBUTION = 'Weather data by Open-Meteo.com';
const SEOUL_DAY_MS = 24 * 60 * 60 * 1000;

export function seoulDateKey(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

export function pastDaysFromStart(startDate?: string, today = seoulDateKey()) {
  const start = startDate?.trim();
  if (!start) return 0;

  const startMs = Date.parse(`${start}T00:00:00+09:00`);
  const todayMs = Date.parse(`${today}T00:00:00+09:00`);
  if (!Number.isFinite(startMs) || !Number.isFinite(todayMs)) return 0;

  return Math.min(OPEN_METEO_PAST_DAYS_MAX, Math.max(0, Math.round((todayMs - startMs) / SEOUL_DAY_MS)));
}

export type WeatherDay = {
  date: string;
  weatherCode: number;
  weatherLabel: string;
  tMax: number | null;
  tMin: number | null;
  precipProb: number | null;
};

export function weatherLabelFromCode(code: number) {
  if (code === 0) return '맑음';
  if (code === 1) return '대체로 맑음';
  if (code === 2) return '구름 조금';
  if (code === 3) return '흐림';
  if (code === 45 || code === 48) return '안개';
  if (code >= 51 && code <= 57) return '이슬비';
  if (code >= 61 && code <= 67) return '비';
  if (code >= 71 && code <= 77) return '눈';
  if (code >= 80 && code <= 82) return '소나기';
  if (code === 85 || code === 86) return '눈 소나기';
  if (code === 95 || code === 96 || code === 99) return '뇌우';
  return '알 수 없음';
}

export function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sliceWeatherDays(days: WeatherDay[], startDate?: string, endDate?: string) {
  const start = startDate?.trim() || days[0]?.date;
  const end = endDate?.trim() || start;
  if (!start || !end) {
    return { days: [], truncated: false, tooOld: false, forecastUntil: days[days.length - 1]?.date ?? null };
  }

  const rangeStart = start <= end ? start : end;
  const rangeEnd = start <= end ? end : start;
  const forecastFrom = days[0]?.date ?? null;
  const forecastUntil = days[days.length - 1]?.date ?? null;
  const sliced = days.filter((day) => day.date >= rangeStart && day.date <= rangeEnd);
  const truncated = Boolean(forecastUntil && rangeEnd > forecastUntil);
  const tooOld = Boolean(forecastFrom && rangeEnd < forecastFrom);

  return { days: sliced, truncated, tooOld, forecastUntil };
}
