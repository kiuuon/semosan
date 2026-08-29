import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  buildKakaoMountainQuery,
  pickKakaoMountainDocument,
  toLatLng,
  type KakaoKeywordDocument,
} from './kakao-local.util';

const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

type KakaoKeywordResponse = {
  documents?: KakaoKeywordDocument[];
};

export type KakaoMountainCoord = {
  lat: number;
  lng: number;
  placeName?: string;
  query: string;
};

@Injectable()
export class KakaoLocalService {
  private readonly logger = new Logger(KakaoLocalService.name);

  constructor(private readonly configService: ConfigService) {}

  async searchMountainCoord(name: string, region: string): Promise<KakaoMountainCoord | null> {
    const apiKey = this.configService.get<string>('KAKAO_REST_API_KEY')?.trim();
    if (!apiKey) {
      throw new InternalServerErrorException('카카오 REST API 키가 설정되지 않았습니다.');
    }

    const query = buildKakaoMountainQuery(name, region);
    const url = new URL(KAKAO_KEYWORD_URL);
    url.searchParams.set('query', query);
    url.searchParams.set('size', '5');

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
        },
      });
    } catch (error) {
      this.logger.error('Failed to fetch Kakao local API', error);
      throw new InternalServerErrorException('산 위치를 불러오지 못했습니다.');
    }

    if (response.status === 429) {
      throw new HttpException('산 위치 조회 한도를 초과했습니다.', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (response.status === 401 || response.status === 403) {
      const body = await response.text().catch(() => '');
      this.logger.error(`Kakao local API HTTP ${response.status}${body ? `: ${body.slice(0, 300)}` : ''}`);
      throw new InternalServerErrorException(
        '카카오 로컬 API 권한이 없습니다. REST API 키와 카카오맵 사용 설정을 확인해 주세요.',
      );
    }

    if (!response.ok) {
      this.logger.error(`Kakao local API HTTP ${response.status}`);
      throw new InternalServerErrorException('산 위치를 불러오지 못했습니다.');
    }

    const data = (await response.json()) as KakaoKeywordResponse;
    const document = pickKakaoMountainDocument(name, data.documents ?? []);
    const coord = toLatLng(document);
    if (!coord) {
      return null;
    }

    return {
      ...coord,
      query,
    };
  }
}
