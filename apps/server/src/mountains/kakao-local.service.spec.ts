import { HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { KakaoLocalService } from './kakao-local.service';

describe('KakaoLocalService', () => {
  let service: KakaoLocalService;
  let configService: jest.Mocked<ConfigService>;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KakaoLocalService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(KakaoLocalService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('KAKAO_REST_API_KEY가 없으면 InternalServerErrorException을 던진다', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(service.searchMountainCoord('관악산', '서울특별시 관악구')).rejects.toThrow(
      new InternalServerErrorException('카카오 REST API 키가 설정되지 않았습니다.'),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('키워드 검색 결과에서 산 좌표를 반환한다', async () => {
    configService.get.mockReturnValue('test-kakao-key');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        documents: [
          {
            place_name: '관악산',
            x: '126.9638',
            y: '37.4419',
            category_name: '여행 > 관광,명소 > 산',
          },
        ],
      }),
    });

    await expect(service.searchMountainCoord('관악산', '서울특별시 관악구ㆍ금천구')).resolves.toEqual({
      lat: 37.4419,
      lng: 126.9638,
      placeName: '관악산',
      query: '관악산 서울특별시 관악구',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.toString()).toContain('https://dapi.kakao.com/v2/local/search/keyword.json');
    expect(requestedUrl.searchParams.get('query')).toBe('관악산 서울특별시 관악구');
    expect(requestedUrl.searchParams.get('size')).toBe('5');
    expect(fetchMock.mock.calls[0][1]).toEqual({
      headers: {
        Authorization: 'KakaoAK test-kakao-key',
      },
    });
  });

  it('문서가 없거나 좌표가 없으면 null을 반환한다', async () => {
    configService.get.mockReturnValue('test-kakao-key');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ documents: [] }),
    });

    await expect(service.searchMountainCoord('없는산', '서울')).resolves.toBeNull();
  });

  it('429이면 TOO_MANY_REQUESTS 예외를 던진다', async () => {
    configService.get.mockReturnValue('test-kakao-key');
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
    });

    await expect(service.searchMountainCoord('관악산', '서울')).rejects.toThrow(
      new HttpException('산 위치 조회 한도를 초과했습니다.', HttpStatus.TOO_MANY_REQUESTS),
    );
  });

  it('401/403이면 REST 키·권한 안내 예외를 던진다', async () => {
    configService.get.mockReturnValue('test-kakao-key');
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"errorType":"AccessDeniedError"}',
    });

    await expect(service.searchMountainCoord('관악산', '서울')).rejects.toThrow(
      new InternalServerErrorException(
        '카카오 로컬 API 권한이 없습니다. REST API 키와 카카오맵 사용 설정을 확인해 주세요.',
      ),
    );
  });

  it('카카오 HTTP 오류면 InternalServerErrorException을 던진다', async () => {
    configService.get.mockReturnValue('test-kakao-key');
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(service.searchMountainCoord('관악산', '서울')).rejects.toThrow(
      new InternalServerErrorException('산 위치를 불러오지 못했습니다.'),
    );
  });

  it('네트워크 오류면 InternalServerErrorException을 던진다', async () => {
    configService.get.mockReturnValue('test-kakao-key');
    fetchMock.mockRejectedValue(new Error('network'));

    await expect(service.searchMountainCoord('관악산', '서울')).rejects.toThrow(
      new InternalServerErrorException('산 위치를 불러오지 못했습니다.'),
    );
  });
});
