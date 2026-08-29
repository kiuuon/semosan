import { pastDaysFromStart, sliceWeatherDays, toFiniteNumber, weatherLabelFromCode } from './open-meteo.util';

describe('open-meteo.util', () => {
  describe('weatherLabelFromCode', () => {
    it('WMO 코드를 한글 날씨 문구로 바꾼다', () => {
      expect(weatherLabelFromCode(0)).toBe('맑음');
      expect(weatherLabelFromCode(2)).toBe('구름 조금');
      expect(weatherLabelFromCode(3)).toBe('흐림');
      expect(weatherLabelFromCode(61)).toBe('비');
      expect(weatherLabelFromCode(71)).toBe('눈');
      expect(weatherLabelFromCode(95)).toBe('뇌우');
    });

    it('모르는 코드는 알 수 없음을 반환한다', () => {
      expect(weatherLabelFromCode(999)).toBe('알 수 없음');
    });
  });

  describe('toFiniteNumber', () => {
    it('숫자와 숫자 문자열만 반환한다', () => {
      expect(toFiniteNumber(12.4)).toBe(12.4);
      expect(toFiniteNumber('8')).toBe(8);
      expect(toFiniteNumber('abc')).toBeNull();
      expect(toFiniteNumber(undefined)).toBeNull();
    });
  });

  describe('sliceWeatherDays', () => {
    const days = [
      { date: '2026-08-29', weatherCode: 0, weatherLabel: '맑음', tMax: 28, tMin: 18, precipProb: 0 },
      { date: '2026-09-13', weatherCode: 1, weatherLabel: '대체로 맑음', tMax: 25, tMin: 15, precipProb: 10 },
    ];

    it('기간과 겹치는 날만 남긴다', () => {
      expect(sliceWeatherDays(days, '2026-08-29', '2026-08-31')).toEqual({
        days: [days[0]],
        truncated: false,
        tooOld: false,
        forecastUntil: '2026-09-13',
      });
    });

    it('예보보다 뒤의 날짜가 있으면 truncated다', () => {
      expect(sliceWeatherDays(days, '2026-09-10', '2026-09-20')).toEqual({
        days: [days[1]],
        truncated: true,
        tooOld: false,
        forecastUntil: '2026-09-13',
      });
    });

    it('예보보다 앞의 기간이면 tooOld다', () => {
      expect(sliceWeatherDays(days, '2026-01-01', '2026-01-05')).toEqual({
        days: [],
        truncated: false,
        tooOld: true,
        forecastUntil: '2026-09-13',
      });
    });

    it('날짜가 비어 있고 예보도 없으면 빈 결과를 반환한다', () => {
      expect(sliceWeatherDays([], undefined, undefined)).toEqual({
        days: [],
        truncated: false,
        tooOld: false,
        forecastUntil: null,
      });
    });
  });

  describe('pastDaysFromStart', () => {
    it('시작일이 오늘보다 이전이면 지난 일수를 반환한다', () => {
      expect(pastDaysFromStart('2026-08-25', '2026-08-29')).toBe(4);
    });

    it('시작일이 오늘이거나 이후면 0이다', () => {
      expect(pastDaysFromStart('2026-08-29', '2026-08-29')).toBe(0);
      expect(pastDaysFromStart('2026-09-01', '2026-08-29')).toBe(0);
    });

    it('시작일이 없으면 0이다', () => {
      expect(pastDaysFromStart(undefined, '2026-08-29')).toBe(0);
    });
  });
});
