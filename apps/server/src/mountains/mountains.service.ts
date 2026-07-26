import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SearchMountainsDto } from './dto/search-mountains.dto';
import { MountainSearchType } from './types/mountain-search-type';

const PAGE_SIZE = 20;
const FOREST_API_BASE_URL = 'https://apis.data.go.kr/1400000/trailInfoService/getforeststoryservice';

interface ForestApiItem {
  mntnid?: string | number;
  mntnnm?: string;
  mntninfopoflc?: string;
  mntnattchimageseq?: string;
  mntninfohght?: string | number;
}

interface ForestApiBody {
  items?: {
    item?: ForestApiItem | ForestApiItem[];
  };
  numOfRows?: string | number;
  pageNo?: string | number;
  totalCount?: string | number;
}

interface ForestApiResponse {
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: ForestApiBody;
  };
}

export interface MountainSearchItem {
  id: string;
  name: string;
  region: string;
  height: number | null;
  imageUrl: string;
}

export interface MountainSearchResult {
  items: MountainSearchItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNext: boolean;
}

@Injectable()
export class MountainsService {
  private readonly logger = new Logger(MountainsService.name);

  constructor(private readonly configService: ConfigService) {}

  async search(dto: SearchMountainsDto): Promise<MountainSearchResult> {
    const serviceKey = this.configService.get<string>('FOREST_SERVICE_KEY');
    if (!serviceKey) {
      throw new InternalServerErrorException('산림청 API 키가 설정되지 않았습니다.');
    }

    const page = dto.page ?? 1;
    const keyword = dto.keyword.trim();
    const url = this.buildUrl({
      serviceKey,
      page,
      type: dto.type,
      keyword,
    });

    let data: ForestApiResponse;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Forest API HTTP ${response.status}`);
      }
      data = (await response.json()) as ForestApiResponse;
    } catch (error) {
      this.logger.error('Failed to fetch forest mountain API', error);
      throw new InternalServerErrorException('산 정보를 불러오지 못했습니다.');
    }

    const resultCode = data.response?.header?.resultCode;
    if (resultCode && resultCode !== '00') {
      this.logger.error(`Forest API error: ${data.response?.header?.resultMsg ?? resultCode}`);
      throw new InternalServerErrorException('산 정보를 불러오지 못했습니다.');
    }

    const body = data.response?.body;
    const totalCount = Number(body?.totalCount ?? 0);
    const items = this.normalizeItems(body?.items?.item).map((item) => this.toMountainItem(item));

    return {
      items,
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      hasNext: page * PAGE_SIZE < totalCount,
    };
  }

  private buildUrl({
    serviceKey,
    page,
    type,
    keyword,
  }: {
    serviceKey: string;
    page: number;
    type: MountainSearchType;
    keyword: string;
  }): string {
    const params = new URLSearchParams({
      serviceKey,
      pageNo: String(page),
      numOfRows: String(PAGE_SIZE),
      _type: 'json',
    });

    if (type === MountainSearchType.NAME) {
      params.set('mntnNm', keyword);
    } else {
      params.set('mntnAdd', keyword);
    }

    return `${FOREST_API_BASE_URL}?${params.toString()}`;
  }

  private normalizeItems(item?: ForestApiItem | ForestApiItem[]): ForestApiItem[] {
    if (!item) {
      return [];
    }
    return Array.isArray(item) ? item : [item];
  }

  private toMountainItem(item: ForestApiItem): MountainSearchItem {
    const height = item.mntninfohght === undefined || item.mntninfohght === '' ? null : Number(item.mntninfohght);

    return {
      id: String(item.mntnid ?? ''),
      name: item.mntnnm ?? '',
      region: item.mntninfopoflc ?? '',
      height: Number.isFinite(height) ? height : null,
      imageUrl: this.toImageUrl(item.mntnattchimageseq),
    };
  }

  private toImageUrl(raw?: string): string {
    if (!raw?.trim()) {
      return '';
    }

    try {
      const url = new URL(raw);
      if (url.searchParams.has('atchFileId') && !url.searchParams.get('atchFileId')?.trim()) {
        return '';
      }
      return raw;
    } catch {
      return /atchFileId=(?:&|$)/.test(raw) ? '' : raw;
    }
  }
}
