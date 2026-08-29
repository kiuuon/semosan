import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { MountainCoord } from '../schemas/mountain-coord.schema';
import { KakaoLocalService } from './kakao-local.service';
import { MountainsService } from './mountains.service';
import { OpenMeteoService } from './open-meteo.service';
import { pastDaysFromStart } from './open-meteo.util';
import { MountainSearchType } from './types/mountain-search-type';

describe('MountainsService', () => {
  let service: MountainsService;
  let configService: jest.Mocked<ConfigService>;
  let kakaoLocalService: jest.Mocked<Pick<KakaoLocalService, 'searchMountainCoord'>>;
  let openMeteoService: jest.Mocked<Pick<OpenMeteoService, 'getForecast'>>;
  let mountainCoordModel: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    kakaoLocalService = {
      searchMountainCoord: jest.fn(),
    };
    openMeteoService = {
      getForecast: jest.fn(),
    };
    mountainCoordModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MountainsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: KakaoLocalService,
          useValue: kakaoLocalService,
        },
        {
          provide: OpenMeteoService,
          useValue: openMeteoService,
        },
        {
          provide: getModelToken(MountainCoord.name),
          useValue: mountainCoordModel,
        },
      ],
    }).compile();

    service = module.get(MountainsService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('FOREST_SERVICE_KEY가 없으면 InternalServerErrorException을 던진다', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(
      service.search({
        keyword: '북한산',
        type: MountainSearchType.NAME,
        page: 1,
      }),
    ).rejects.toThrow(new InternalServerErrorException('산림청 API 키가 설정되지 않았습니다.'));
  });

  it('산 이름 검색 결과를 매핑한다', async () => {
    configService.get.mockReturnValue('test-service-key');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: {
          header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
          body: {
            items: {
              item: {
                mntnid: 20000001,
                mntnnm: '북한산',
                mntninfopoflc: '서울특별시',
                mntninfohght: '836',
                mntnattchimageseq: 'https://example.com/bukhansan.jpg',
              },
            },
            totalCount: 1,
          },
        },
      }),
    });

    const result = await service.search({
      keyword: '  북한산  ',
      type: MountainSearchType.NAME,
      page: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toContain('mntnNm=%EB%B6%81%ED%95%9C%EC%82%B0');
    expect(requestedUrl).toContain('pageNo=1');
    expect(requestedUrl).toContain('numOfRows=20');
    expect(requestedUrl).toContain('_type=json');
    expect(requestedUrl).not.toContain('mntnAdd=');

    expect(result).toEqual({
      items: [
        {
          id: '20000001',
          name: '북한산',
          region: '서울특별시',
          height: 836,
          imageUrl: 'https://example.com/bukhansan.jpg',
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      hasNext: false,
    });
  });

  it('지역 검색은 mntnAdd로 요청한다', async () => {
    configService.get.mockReturnValue('test-service-key');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: {
          header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
          body: {
            items: {
              item: [
                {
                  mntnid: '1',
                  mntnnm: '개화산',
                  mntninfopoflc: '서울특별시 강서구',
                  mntninfohght: 128,
                  mntnattchimageseq: '',
                },
              ],
            },
            totalCount: 25,
          },
        },
      }),
    });

    const result = await service.search({
      keyword: '서울',
      type: MountainSearchType.REGION,
      page: 1,
    });

    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toContain('mntnAdd=%EC%84%9C%EC%9A%B8');
    expect(requestedUrl).not.toContain('mntnNm=');
    expect(result.hasNext).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      id: '1',
      name: '개화산',
      region: '서울특별시 강서구',
      height: 128,
      imageUrl: '',
    });
  });

  it('atchFileId가 비어 있으면 imageUrl을 빈 문자열로 반환한다', async () => {
    configService.get.mockReturnValue('test-service-key');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: {
          header: { resultCode: '00' },
          body: {
            items: {
              item: {
                mntnid: '3',
                mntnnm: '이미지없는산',
                mntninfopoflc: '서울특별시',
                mntninfohght: 100,
                mntnattchimageseq: 'http://www.forest.go.kr/newkfsweb/cmm/fms/getImage.do?fileSn=1&atchFileId=',
              },
            },
            totalCount: 1,
          },
        },
      }),
    });

    const result = await service.search({
      keyword: '이미지',
      type: MountainSearchType.NAME,
      page: 1,
    });

    expect(result.items[0].imageUrl).toBe('');
  });

  it('단일 item도 배열로 정규화한다', async () => {
    configService.get.mockReturnValue('test-service-key');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: {
          header: { resultCode: '00' },
          body: {
            items: {
              item: {
                mntnid: '9',
                mntnnm: '테스트산',
                mntninfopoflc: '',
                mntninfohght: '',
                mntnattchimageseq: '',
              },
            },
            totalCount: 1,
          },
        },
      }),
    });

    const result = await service.search({
      keyword: '테스트',
      type: MountainSearchType.NAME,
      page: 1,
    });

    expect(result.items).toEqual([
      {
        id: '9',
        name: '테스트산',
        region: '',
        height: null,
        imageUrl: '',
      },
    ]);
  });

  it('산림청 API HTTP 오류면 InternalServerErrorException을 던진다', async () => {
    configService.get.mockReturnValue('test-service-key');
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      service.search({
        keyword: '북한산',
        type: MountainSearchType.NAME,
        page: 1,
      }),
    ).rejects.toThrow(new InternalServerErrorException('산 정보를 불러오지 못했습니다.'));
  });

  it('산림청 API resultCode가 실패면 InternalServerErrorException을 던진다', async () => {
    configService.get.mockReturnValue('test-service-key');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: {
          header: { resultCode: '99', resultMsg: 'SERVICE ERROR' },
        },
      }),
    });

    await expect(
      service.search({
        keyword: '북한산',
        type: MountainSearchType.NAME,
        page: 1,
      }),
    ).rejects.toThrow(new InternalServerErrorException('산 정보를 불러오지 못했습니다.'));
  });

  describe('getDetail', () => {
    it('id로 산을 찾아 상세 정보를 반환한다', async () => {
      configService.get.mockReturnValue('test-service-key');
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: '00' },
            body: {
              items: {
                item: [
                  {
                    mntnid: 20000001,
                    mntnnm: '다른산',
                    mntninfopoflc: '강원도',
                    mntninfohght: 100,
                    mntnattchimageseq: '',
                    mntnsbttlinfo: '다른 부제',
                    mntninfodtlinfocont: '다른 설명',
                    pbtrninfodscrt: '다른 교통',
                  },
                  {
                    mntnid: 20000059,
                    mntnnm: '관악산',
                    mntninfopoflc: '서울특별시 관악구ㆍ금천구, 경기도 안양시ㆍ과천시',
                    mntninfohght: '632',
                    mntnattchimageseq:
                      'http://www.forest.go.kr/newkfsweb/cmm/fms/getImage.do?fileSn=1&atchFileId=FILE_123',
                    mntnsbttlinfo: '수차례 화마가 쓸고 갔던 불의 산',
                    mntninfodtlinfocont: '관악산은 서울시 관악구와 금천구에 걸쳐 있다.&lt;BR&gt;위험한 암릉이 있다.',
                    pbtrninfodscrt: '지하철이 가장 편리하다. &lt;BR&gt;&amp;gt; 2호선 신림역&#xD;&#xA;버스 이용 가능',
                  },
                ],
              },
              totalCount: 2,
            },
          },
        }),
      });

      const result = await service.getDetail('20000059', {
        name: '관악산',
        region: '서울특별시 관악구ㆍ금천구, 경기도 안양시ㆍ과천시',
      });

      const requestedUrl = fetchMock.mock.calls[0][0] as string;
      expect(requestedUrl).toContain('mntnNm=');
      expect(result).toEqual({
        id: '20000059',
        name: '관악산',
        region: '서울특별시 관악구ㆍ금천구, 경기도 안양시ㆍ과천시',
        height: 632,
        imageUrl: 'http://www.forest.go.kr/newkfsweb/cmm/fms/getImage.do?fileSn=1&atchFileId=FILE_123',
        subtitle: '수차례 화마가 쓸고 갔던 불의 산',
        description: '관악산은 서울시 관악구와 금천구에 걸쳐 있다.\n위험한 암릉이 있다.',
        transportInfo: '지하철이 가장 편리하다. \n> 2호선 신림역\n버스 이용 가능',
      });
    });

    it('산이 없으면 NotFoundException을 던진다', async () => {
      configService.get.mockReturnValue('test-service-key');
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: '00' },
            body: {
              items: { item: [] },
              totalCount: 0,
            },
          },
        }),
      });

      await expect(
        service.getDetail('999', {
          name: '없는산',
          region: '서울',
        }),
      ).rejects.toThrow(new NotFoundException('산 정보를 찾을 수 없습니다.'));
    });
  });

  describe('getCoordinates', () => {
    const dto = {
      name: '관악산',
      region: '서울특별시 관악구ㆍ금천구, 경기도 안양시ㆍ과천시',
    };

    it('캐시가 이름·소재지와 같으면 카카오를 호출하지 않는다', async () => {
      mountainCoordModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          externalId: '20000059',
          name: '관악산',
          region: dto.region,
          lat: 37.4419,
          lng: 126.9638,
          placeName: '관악산',
        }),
      });

      await expect(service.getCoordinates('20000059', dto)).resolves.toEqual({
        id: '20000059',
        name: '관악산',
        region: dto.region,
        lat: 37.4419,
        lng: 126.9638,
        placeName: '관악산',
      });

      expect(kakaoLocalService.searchMountainCoord).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('캐시가 없으면 카카오 결과를 저장하고 반환한다', async () => {
      mountainCoordModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      kakaoLocalService.searchMountainCoord.mockResolvedValue({
        lat: 37.4419,
        lng: 126.9638,
        placeName: '관악산',
        query: '관악산 서울특별시 관악구',
      });
      mountainCoordModel.findOneAndUpdate.mockResolvedValue({
        lat: 37.4419,
        lng: 126.9638,
        placeName: '관악산',
      });

      await expect(
        service.getCoordinates(' 20000059 ', { name: ' 관악산 ', region: ` ${dto.region} ` }),
      ).resolves.toEqual({
        id: '20000059',
        name: '관악산',
        region: dto.region,
        lat: 37.4419,
        lng: 126.9638,
        placeName: '관악산',
      });

      expect(kakaoLocalService.searchMountainCoord).toHaveBeenCalledWith('관악산', dto.region);
      expect(mountainCoordModel.findOneAndUpdate).toHaveBeenCalledWith(
        { externalId: '20000059' },
        {
          externalId: '20000059',
          name: '관악산',
          region: dto.region,
          query: '관악산 서울특별시 관악구',
          lat: 37.4419,
          lng: 126.9638,
          placeName: '관악산',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('이름이나 소재지가 바뀌면 카카오를 다시 조회한다', async () => {
      mountainCoordModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          externalId: '20000059',
          name: '관악산',
          region: '이전 소재지',
          lat: 1,
          lng: 1,
        }),
      });
      kakaoLocalService.searchMountainCoord.mockResolvedValue({
        lat: 37.4419,
        lng: 126.9638,
        query: '관악산 서울특별시 관악구',
      });
      mountainCoordModel.findOneAndUpdate.mockResolvedValue({
        lat: 37.4419,
        lng: 126.9638,
      });

      await service.getCoordinates('20000059', dto);

      expect(kakaoLocalService.searchMountainCoord).toHaveBeenCalledWith('관악산', dto.region);
    });

    it('카카오에서 위치를 못 찾으면 NotFoundException을 던진다', async () => {
      mountainCoordModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      kakaoLocalService.searchMountainCoord.mockResolvedValue(null);

      await expect(service.getCoordinates('20000059', dto)).rejects.toThrow(
        new NotFoundException('산 위치를 찾을 수 없습니다.'),
      );
      expect(mountainCoordModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getWeather', () => {
    const dto = {
      name: '관악산',
      region: '서울특별시 관악구',
    };
    const forecast = {
      attribution: 'Weather data by Open-Meteo.com',
      forecastUntil: '2026-09-13',
      current: {
        temperature: 24,
        weatherCode: 2,
        weatherLabel: '구름 조금',
        precipitation: 0,
        windSpeed: 3,
      },
      days: [
        {
          date: '2026-08-29',
          weatherCode: 2,
          weatherLabel: '구름 조금',
          tMax: 28,
          tMin: 18,
          precipProb: 10,
        },
        {
          date: '2026-08-30',
          weatherCode: 61,
          weatherLabel: '비',
          tMax: 22,
          tMin: 16,
          precipProb: 80,
        },
        {
          date: '2026-09-13',
          weatherCode: 0,
          weatherLabel: '맑음',
          tMax: 25,
          tMin: 15,
          precipProb: 0,
        },
      ],
    };

    beforeEach(() => {
      mountainCoordModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          externalId: '20000059',
          name: '관악산',
          region: dto.region,
          lat: 37.4419,
          lng: 126.9638,
        }),
      });
      openMeteoService.getForecast.mockResolvedValue(forecast);
    });

    it('날짜가 없으면 오늘부터 최대 7일을 반환한다', async () => {
      await expect(service.getWeather('20000059', dto)).resolves.toEqual({
        attribution: forecast.attribution,
        forecastUntil: '2026-09-13',
        truncated: false,
        tooOld: false,
        current: forecast.current,
        days: forecast.days.slice(0, 7),
      });
      expect(openMeteoService.getForecast).toHaveBeenCalledWith(37.4419, 126.9638, 0);
    });

    it('여정 시작일이 과거라면 지난 날짜도 포함한다', async () => {
      const tripDays = [
        {
          date: '2026-08-25',
          weatherCode: 0,
          weatherLabel: '맑음',
          tMax: 30,
          tMin: 20,
          precipProb: 0,
        },
        {
          date: '2026-08-26',
          weatherCode: 2,
          weatherLabel: '구름 조금',
          tMax: 29,
          tMin: 19,
          precipProb: 10,
        },
        {
          date: '2026-08-27',
          weatherCode: 3,
          weatherLabel: '흐림',
          tMax: 27,
          tMin: 18,
          precipProb: 20,
        },
        {
          date: '2026-08-28',
          weatherCode: 61,
          weatherLabel: '비',
          tMax: 24,
          tMin: 17,
          precipProb: 70,
        },
        forecast.days[0],
      ];
      openMeteoService.getForecast.mockResolvedValue({
        ...forecast,
        days: [...tripDays, forecast.days[2]],
      });

      await expect(
        service.getWeather('20000059', {
          ...dto,
          startDate: '2026-08-25',
          endDate: '2026-08-29',
        }),
      ).resolves.toEqual({
        attribution: forecast.attribution,
        forecastUntil: '2026-09-13',
        truncated: false,
        tooOld: false,
        current: forecast.current,
        days: tripDays,
      });
      expect(openMeteoService.getForecast).toHaveBeenCalledWith(37.4419, 126.9638, pastDaysFromStart('2026-08-25'));
    });

    it('여정 기간과 겹치는 날만 남기고 16일 이후는 자른다', async () => {
      await expect(
        service.getWeather('20000059', {
          ...dto,
          startDate: '2026-08-30',
          endDate: '2026-09-20',
        }),
      ).resolves.toEqual({
        attribution: forecast.attribution,
        forecastUntil: '2026-09-13',
        truncated: true,
        tooOld: false,
        current: forecast.current,
        days: [forecast.days[1], forecast.days[2]],
      });
      expect(openMeteoService.getForecast).toHaveBeenCalledWith(37.4419, 126.9638, pastDaysFromStart('2026-08-30'));
    });

    it('예보보다 오래된 여정이면 tooOld다', async () => {
      await expect(
        service.getWeather('20000059', {
          ...dto,
          startDate: '2026-01-01',
          endDate: '2026-01-03',
        }),
      ).resolves.toEqual({
        attribution: forecast.attribution,
        forecastUntil: '2026-09-13',
        truncated: false,
        tooOld: true,
        current: forecast.current,
        days: [],
      });
    });
  });
});
