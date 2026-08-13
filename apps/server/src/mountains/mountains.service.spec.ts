import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { MountainsService } from './mountains.service';
import { MountainSearchType } from './types/mountain-search-type';

describe('MountainsService', () => {
  let service: MountainsService;
  let configService: jest.Mocked<ConfigService>;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MountainsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
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
});
