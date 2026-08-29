import { HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OpenMeteoService } from './open-meteo.service';

describe('OpenMeteoService', () => {
  let service: OpenMeteoService;
  let fetchMock: jest.Mock;

  const payload = {
    current: {
      temperature_2m: 24.2,
      weather_code: 2,
      precipitation: 0,
      wind_speed_10m: 3.1,
    },
    daily: {
      time: ['2026-08-29', '2026-08-30'],
      weather_code: [2, 61],
      temperature_2m_max: [28.4, 22.1],
      temperature_2m_min: [18.2, 16.0],
      precipitation_probability_max: [10, 80],
    },
  };

  beforeEach(async () => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenMeteoService],
    }).compile();

    service = module.get(OpenMeteoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('예보를 매핑하고 같은 좌표는 캐시한다', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    const first = await service.getForecast(37.4419, 126.9638);
    const second = await service.getForecast(37.44191, 126.96379);

    expect(first).toEqual({
      attribution: 'Weather data by Open-Meteo.com',
      forecastUntil: '2026-08-30',
      current: {
        temperature: 24.2,
        weatherCode: 2,
        weatherLabel: '구름 조금',
        precipitation: 0,
        windSpeed: 3.1,
      },
      days: [
        {
          date: '2026-08-29',
          weatherCode: 2,
          weatherLabel: '구름 조금',
          tMax: 28.4,
          tMin: 18.2,
          precipProb: 10,
        },
        {
          date: '2026-08-30',
          weatherCode: 61,
          weatherLabel: '비',
          tMax: 22.1,
          tMin: 16,
          precipProb: 80,
        },
      ],
    });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.toString()).toContain('https://api.open-meteo.com/v1/forecast');
    expect(requestedUrl.searchParams.get('latitude')).toBe('37.4419');
    expect(requestedUrl.searchParams.get('longitude')).toBe('126.9638');
    expect(requestedUrl.searchParams.get('timezone')).toBe('Asia/Seoul');
    expect(requestedUrl.searchParams.get('forecast_days')).toBe('16');
    expect(requestedUrl.searchParams.get('past_days')).toBeNull();
  });

  it('지난 일수가 있으면 past_days를 붙여 조회한다', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    await service.getForecast(37.4419, 126.9638, 4);

    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get('past_days')).toBe('4');
  });

  it('429이면 TOO_MANY_REQUESTS 예외를 던진다', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
    });

    await expect(service.getForecast(37, 127)).rejects.toThrow(
      new HttpException('날씨 조회 한도를 초과했습니다.', HttpStatus.TOO_MANY_REQUESTS),
    );
  });

  it('HTTP 오류면 InternalServerErrorException을 던진다', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(service.getForecast(37, 127)).rejects.toThrow(
      new InternalServerErrorException('날씨를 불러오지 못했습니다.'),
    );
  });

  it('네트워크 오류면 InternalServerErrorException을 던진다', async () => {
    fetchMock.mockRejectedValue(new Error('network'));

    await expect(service.getForecast(37, 127)).rejects.toThrow(
      new InternalServerErrorException('날씨를 불러오지 못했습니다.'),
    );
  });
});
