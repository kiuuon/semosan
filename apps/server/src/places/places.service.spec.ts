import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PlacesService } from './places.service';

describe('PlacesService', () => {
  let service: PlacesService;
  let configService: jest.Mocked<ConfigService>;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlacesService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PlacesService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('TOUR_SERVICE_KEY가 없으면 InternalServerErrorException을 던진다', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(
      service.search({
        regions: '11:110',
        page: 1,
      }),
    ).rejects.toThrow(new InternalServerErrorException('관광 API 키가 설정되지 않았습니다.'));
  });

  it('키워드가 없으면 areaBasedList2를 호출한다', async () => {
    configService.get.mockReturnValue('test-tour-key');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: {
          header: { resultCode: '0000', resultMsg: 'OK' },
          body: {
            items: {
              item: {
                contentid: '1001',
                contenttypeid: '12',
                title: '경복궁',
                addr1: '서울특별시 종로구',
                firstimage: 'https://example.com/gyeongbok.jpg',
                mapx: '126.97',
                mapy: '37.57',
                tel: '02-123-4567',
              },
            },
            totalCount: 1,
          },
        },
      }),
    });

    const result = await service.search({
      regions: '11:110',
      contentTypeId: '12',
      page: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toContain('/areaBasedList2?');
    expect(requestedUrl).toContain('lDongRegnCd=11');
    expect(requestedUrl).toContain('lDongSignguCd=110');
    expect(requestedUrl).toContain('contentTypeId=12');
    expect(requestedUrl).not.toContain('keyword=');
    expect(result.items).toEqual([
      {
        id: '1001',
        contentTypeId: '12',
        name: '경복궁',
        address: '서울특별시 종로구',
        imageUrl: 'https://example.com/gyeongbok.jpg',
        lat: 37.57,
        lng: 126.97,
        tel: '02-123-4567',
      },
    ]);
  });

  it('키워드가 있으면 searchKeyword2를 호출한다', async () => {
    configService.get.mockReturnValue('test-tour-key');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: {
          header: { resultCode: '0000', resultMsg: 'OK' },
          body: {
            items: { item: [] },
            totalCount: 0,
          },
        },
      }),
    });

    await service.search({
      regions: '11:110',
      keyword: '  궁  ',
      contentTypeId: '32',
      page: 1,
    });

    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toContain('/searchKeyword2?');
    expect(requestedUrl).toContain('keyword=%EA%B6%81');
    expect(requestedUrl).toContain('contentTypeId=32');
  });

  it('소재지가 여러 개면 지역별로 요청하고 contentid 기준 중복을 제거한다', async () => {
    configService.get.mockReturnValue('test-tour-key');
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: '0000', resultMsg: 'OK' },
            body: {
              items: {
                item: [
                  {
                    contentid: '1001',
                    contenttypeid: '12',
                    title: '관악산전망대',
                    addr1: '서울 관악구',
                  },
                  {
                    contentid: '1002',
                    contenttypeid: '12',
                    title: '서울대공원',
                    addr1: '서울 관악구',
                  },
                ],
              },
              totalCount: 25,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: '0000', resultMsg: 'OK' },
            body: {
              items: {
                item: [
                  {
                    contentid: '1002',
                    contenttypeid: '12',
                    title: '서울대공원',
                    addr1: '경기 과천시',
                  },
                  {
                    contentid: '1003',
                    contenttypeid: '12',
                    title: '과천명소',
                    addr1: '경기 과천시',
                  },
                ],
              },
              totalCount: 5,
            },
          },
        }),
      });

    const result = await service.search({
      regions: '11:620,41:290',
      page: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.items.map((item) => item.id)).toEqual(['1001', '1002', '1003']);
    expect(result.totalCount).toBe(30);
    expect(result.hasNext).toBe(true);
  });
});
