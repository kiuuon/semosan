import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import {
  OPEN_METEO_ATTRIBUTION,
  OPEN_METEO_FORECAST_DAYS,
  OPEN_METEO_PAST_DAYS_MAX,
  toFiniteNumber,
  weatherLabelFromCode,
  type WeatherDay,
} from './open-meteo.util';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 60 * 60 * 1000;

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    precipitation?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

export type WeatherCurrent = {
  temperature: number | null;
  weatherCode: number;
  weatherLabel: string;
  precipitation: number | null;
  windSpeed: number | null;
};

export type MountainWeatherForecast = {
  attribution: string;
  forecastUntil: string | null;
  current: WeatherCurrent | null;
  days: WeatherDay[];
};

type CacheEntry = {
  expiresAt: number;
  data: MountainWeatherForecast;
};

@Injectable()
export class OpenMeteoService {
  private readonly logger = new Logger(OpenMeteoService.name);
  private readonly cache = new Map<string, CacheEntry>();

  async getForecast(lat: number, lng: number, pastDays = 0): Promise<MountainWeatherForecast> {
    const resolvedPastDays = Math.min(OPEN_METEO_PAST_DAYS_MAX, Math.max(0, Math.trunc(pastDays)));
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},p${resolvedPastDays}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const url = new URL(OPEN_METEO_URL);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('timezone', 'Asia/Seoul');
    url.searchParams.set('forecast_days', String(OPEN_METEO_FORECAST_DAYS));
    if (resolvedPastDays > 0) {
      url.searchParams.set('past_days', String(resolvedPastDays));
    }
    url.searchParams.set('current', 'temperature_2m,weather_code,precipitation,wind_speed_10m');
    url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      this.logger.error('Failed to fetch Open-Meteo API', error);
      throw new InternalServerErrorException('날씨를 불러오지 못했습니다.');
    }

    if (response.status === 429) {
      throw new HttpException('날씨 조회 한도를 초과했습니다.', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (!response.ok) {
      this.logger.error(`Open-Meteo API HTTP ${response.status}`);
      throw new InternalServerErrorException('날씨를 불러오지 못했습니다.');
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    const data = this.toForecast(payload);
    this.cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data });
    return data;
  }

  private toForecast(payload: OpenMeteoResponse): MountainWeatherForecast {
    const dates = payload.daily?.time ?? [];
    const days: WeatherDay[] = dates.map((date, index) => {
      const weatherCode = toFiniteNumber(payload.daily?.weather_code?.[index]) ?? 0;
      return {
        date,
        weatherCode,
        weatherLabel: weatherLabelFromCode(weatherCode),
        tMax: toFiniteNumber(payload.daily?.temperature_2m_max?.[index]),
        tMin: toFiniteNumber(payload.daily?.temperature_2m_min?.[index]),
        precipProb: toFiniteNumber(payload.daily?.precipitation_probability_max?.[index]),
      };
    });

    const currentCode = toFiniteNumber(payload.current?.weather_code);
    const current =
      payload.current && currentCode != null
        ? {
            temperature: toFiniteNumber(payload.current.temperature_2m),
            weatherCode: currentCode,
            weatherLabel: weatherLabelFromCode(currentCode),
            precipitation: toFiniteNumber(payload.current.precipitation),
            windSpeed: toFiniteNumber(payload.current.wind_speed_10m),
          }
        : null;

    return {
      attribution: OPEN_METEO_ATTRIBUTION,
      forecastUntil: days[days.length - 1]?.date ?? null,
      current,
      days,
    };
  }
}
