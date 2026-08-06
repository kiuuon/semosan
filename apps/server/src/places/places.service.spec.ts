import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

  describe('getDetail', () => {
    it('공통/소개/반복/이미지 API를 호출하고 정규화한다', async () => {
      configService.get.mockReturnValue('test-tour-key');
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: {
              header: { resultCode: '0000', resultMsg: 'OK' },
              body: {
                items: {
                  item: {
                    contentid: '2733967',
                    contenttypeid: '12',
                    title: '가회동성당',
                    addr1: '서울특별시 종로구 북촌로 57',
                    homepage: '<a href="https://gahoe.or.kr">홈페이지</a>',
                    firstimage: 'https://example.com/main.jpg',
                    mapx: '126.98',
                    mapy: '37.58',
                    overview: '소개입니다.<br>두 번째 줄',
                  },
                },
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
                  item: {
                    contentid: '2733967',
                    contenttypeid: '12',
                    infocenter: '02-763-1570',
                    restdate: '매주 월요일',
                    usetime: '10:00~18:00<br>월요일 휴무',
                    parking: '가능',
                  },
                },
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
                  item: {
                    contentid: '2733967',
                    contenttypeid: '12',
                    infoname: '화장실',
                    infotext: '있음<br/>남녀구분',
                  },
                },
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
                    { originimgurl: 'https://example.com/1.jpg' },
                    { originimgurl: 'https://example.com/main.jpg' },
                  ],
                },
              },
            },
          }),
        });

      const result = await service.getDetail('2733967', { contentTypeId: '12' });

      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(fetchMock.mock.calls[0][0]).toContain('/detailCommon2?');
      expect(fetchMock.mock.calls[1][0]).toContain('/detailIntro2?');
      expect(fetchMock.mock.calls[2][0]).toContain('/detailInfo2?');
      expect(fetchMock.mock.calls[3][0]).toContain('/detailImage2?');
      expect(result).toEqual({
        id: '2733967',
        contentTypeId: '12',
        contentTypeLabel: '관광지',
        name: '가회동성당',
        address: '서울특별시 종로구 북촌로 57',
        overview: '소개입니다.\n두 번째 줄',
        homepage: 'https://gahoe.or.kr',
        tel: '02-763-1570',
        imageUrl: 'https://example.com/main.jpg',
        images: ['https://example.com/main.jpg', 'https://example.com/1.jpg'],
        lat: 37.58,
        lng: 126.98,
        infos: [
          { label: '이용시간', value: '10:00~18:00\n월요일 휴무' },
          { label: '휴무일', value: '매주 월요일' },
          { label: '문의', value: '02-763-1570' },
          { label: '주차', value: '가능' },
        ],
        extras: [{ label: '화장실', value: '있음\n남녀구분' }],
      });
    });

    it('공통정보가 없으면 NotFoundException을 던진다', async () => {
      configService.get.mockReturnValue('test-tour-key');
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: '0000', resultMsg: 'OK' },
            body: { items: {} },
          },
        }),
      });

      await expect(service.getDetail('999', { contentTypeId: '12' })).rejects.toThrow(
        new NotFoundException('장소 정보를 찾을 수 없습니다.'),
      );
    });
  });
});
