import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function weatherIonicon(code: number): IoniconName {
  if (code === 0) return 'sunny';
  if (code <= 2) return 'partly-sunny';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'cloud';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code === 85 || code === 86) return 'snow';
  if (code === 95 || code === 96 || code === 99) return 'thunderstorm';
  return 'partly-sunny';
}

export function formatTemp(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? '-' : `${Math.round(value)}°`;
}

export function formatWeatherDateParts(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return { date: dateKey, weekday: '' };
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  return { date: `${month}.${day}`, weekday };
}

export function formatWeatherDate(dateKey: string) {
  const { date, weekday } = formatWeatherDateParts(dateKey);
  return weekday ? `${date} (${weekday})` : date;
}
