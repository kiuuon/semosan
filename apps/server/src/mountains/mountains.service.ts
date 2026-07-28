import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GetMountainDetailDto } from './dto/get-mountain-detail.dto';
import { SearchMountainsDto } from './dto/search-mountains.dto';
import { MountainSearchType } from './types/mountain-search-type';

const PAGE_SIZE = 20;
const DETAIL_SEARCH_PAGE_SIZE = 100;
const FOREST_API_BASE_URL = 'https://apis.data.go.kr/1400000/trailInfoService/getforeststoryservice';

interface ForestApiItem {
  mntnid?: string | number;
  mntnnm?: string;
  mntninfopoflc?: string;
  mntnattchimageseq?: string;
  mntninfohght?: string | number;
  mntnsbttlinfo?: string;
  mntninfodtlinfocont?: string;
  pbtrninfodscrt?: string;
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

export interface MountainDetail {
  id: string;
  name: string;
  region: string;
  height: number | null;
  imageUrl: string;
  subtitle: string;
  description: string;
  transportInfo: string;
}

@Injectable()
export class MountainsService {
  private readonly logger = new Logger(MountainsService.name);

  constructor(private readonly configService: ConfigService) {}

  async search(dto: SearchMountainsDto): Promise<MountainSearchResult> {
    const page = dto.page ?? 1;
    const keyword = dto.keyword.trim();
    const body = await this.fetchForestApi({
      page,
      numOfRows: PAGE_SIZE,
      type: dto.type,
      keyword,
    });

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

  async getDetail(id: string, dto: GetMountainDetailDto): Promise<MountainDetail> {
    const name = dto.name.trim();
    const region = dto.region.trim();
    const mountainId = id.trim();

    const body = await this.fetchForestApi({
      page: 1,
      numOfRows: DETAIL_SEARCH_PAGE_SIZE,
      type: MountainSearchType.NAME,
      keyword: name,
    });

    const items = this.normalizeItems(body?.items?.item);
    const matched =
      items.find((item) => String(item.mntnid ?? '') === mountainId) ??
      items.find(
        (item) =>
          (item.mntnnm ?? '').trim() === name &&
          (item.mntninfopoflc ?? '').includes(region.split(/[ㆍ,]/)[0]?.trim() ?? region),
      );

    if (!matched) {
      throw new NotFoundException('산 정보를 찾을 수 없습니다.');
    }

    return this.toMountainDetail(matched);
  }

  private async fetchForestApi({
    page,
    numOfRows,
    type,
    keyword,
  }: {
    page: number;
    numOfRows: number;
    type: MountainSearchType;
    keyword: string;
  }): Promise<ForestApiBody | undefined> {
    const serviceKey = this.configService.get<string>('FOREST_SERVICE_KEY');
    if (!serviceKey) {
      throw new InternalServerErrorException('산림청 API 키가 설정되지 않았습니다.');
    }

    const url = this.buildUrl({
      serviceKey,
      page,
      numOfRows,
      type,
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

    return data.response?.body;
  }

  private buildUrl({
    serviceKey,
    page,
    numOfRows,
    type,
    keyword,
  }: {
    serviceKey: string;
    page: number;
    numOfRows: number;
    type: MountainSearchType;
    keyword: string;
  }): string {
    const params = new URLSearchParams({
      serviceKey,
      pageNo: String(page),
      numOfRows: String(numOfRows),
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

  private toMountainDetail(item: ForestApiItem): MountainDetail {
    const height = item.mntninfohght === undefined || item.mntninfohght === '' ? null : Number(item.mntninfohght);

    return {
      id: String(item.mntnid ?? ''),
      name: item.mntnnm ?? '',
      region: item.mntninfopoflc ?? '',
      height: Number.isFinite(height) ? height : null,
      imageUrl: this.toImageUrl(item.mntnattchimageseq),
      subtitle: this.decodeForestText(item.mntnsbttlinfo),
      description: this.decodeForestText(item.mntninfodtlinfocont),
      transportInfo: this.decodeForestText(item.pbtrninfodscrt),
    };
  }

  private toImageUrl(raw?: string): string {
    if (!raw?.trim()) {
      return '';
    }

    try {
      const url = new URL(raw.trim());
      if (url.searchParams.has('atchFileId') && !url.searchParams.get('atchFileId')?.trim()) {
        return '';
      }
      return raw.trim();
    } catch {
      return /atchFileId=(?:&|$)/.test(raw) ? '' : raw.trim();
    }
  }

  private decodeForestText(raw?: string): string {
    if (!raw?.trim()) {
      return '';
    }

    let text = raw.trim();
    for (let i = 0; i < 2; i += 1) {
      text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)));
    }

    return text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/\r\n?/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
