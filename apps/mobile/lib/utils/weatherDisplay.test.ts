import { formatTemp, formatWeatherDate, formatWeatherDateParts, weatherIonicon } from './weatherDisplay';

describe('weatherDisplay', () => {
  it('날씨 코드를 아이콘 이름으로 바꾼다', () => {
    expect(weatherIonicon(0)).toBe('sunny');
    expect(weatherIonicon(2)).toBe('partly-sunny');
    expect(weatherIonicon(3)).toBe('cloudy');
    expect(weatherIonicon(61)).toBe('rainy');
    expect(weatherIonicon(71)).toBe('snow');
    expect(weatherIonicon(95)).toBe('thunderstorm');
  });

  it('온도를 반올림해 표시한다', () => {
    expect(formatTemp(24.4)).toBe('24°');
    expect(formatTemp(24.6)).toBe('25°');
    expect(formatTemp(null)).toBe('-');
  });

  it('날짜를 월.일 (요일) 형식으로 바꾼다', () => {
    expect(formatWeatherDateParts('2026-08-29')).toEqual({ date: '8.29', weekday: '토' });
    expect(formatWeatherDate('2026-08-29')).toBe('8.29 (토)');
  });
});
