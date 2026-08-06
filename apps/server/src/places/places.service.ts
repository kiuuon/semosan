import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LegalDongRegion, SearchPlacesDto, parseRegionsParam } from './dto/search-places.dto';

const PAGE_SIZE = 20;
const TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
const MOBILE_OS = 'WEB';
const MOBILE_APP = 'semosan';

interface TourApiItem {
  contentid?: string | number;
  contenttypeid?: string | number;
  title?: string;
  addr1?: string;
  addr2?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string | number;
  mapy?: string | number;
  tel?: string;
}

interface TourApiBody {
  items?: {
    item?: TourApiItem | TourApiItem[];
  };
  numOfRows?: string | number;
  pageNo?: string | number;
  totalCount?: string | number;
}

interface TourApiResponse {
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: TourApiBody;
  };
}

export interface PlaceSearchItem {
  id: string;
  contentTypeId: string;
  name: string;
  address: string;
  imageUrl: string;
  lat: number | null;
  lng: number | null;
  tel: string;
}

export interface PlaceSearchResult {
  items: PlaceSearchItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNext: boolean;
}

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  constructor(private readonly configService: ConfigService) {}

  async search(dto: SearchPlacesDto): Promise<PlaceSearchResult> {
    const page = dto.page ?? 1;
    const keyword = dto.keyword?.trim() ?? '';
    const contentTypeId = dto.contentTypeId;
    const regions = parseRegionsParam(dto.regions);

    const responses = await Promise.all(
      regions.map((region) =>
        this.fetchTourApi({
          page,
          numOfRows: PAGE_SIZE,
          keyword,
          contentTypeId,
          region,
        }),
      ),
    );

    const seen = new Set<string>();
    const items: PlaceSearchItem[] = [];
    let totalCount = 0;
    let hasNext = false;

    for (const body of responses) {
      const regionTotal = Number(body?.totalCount ?? 0);
      totalCount += Number.isFinite(regionTotal) ? regionTotal : 0;
      hasNext = hasNext || page * PAGE_SIZE < regionTotal;

      for (const item of this.normalizeItems(body?.items?.item)) {
        const mapped = this.toPlaceItem(item);
        if (!mapped.id || seen.has(mapped.id)) {
          continue;
        }
        seen.add(mapped.id);
        items.push(mapped);
      }
    }

    return {
      items,
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      hasNext,
    };
  }

  private async fetchTourApi({
    page,
    numOfRows,
    keyword,
    contentTypeId,
    region,
  }: {
    page: number;
    numOfRows: number;
    keyword: string;
    contentTypeId?: string;
    region: LegalDongRegion;
  }): Promise<TourApiBody | undefined> {
    const serviceKey = this.configService.get<string>('TOUR_SERVICE_KEY');
    if (!serviceKey) {
      throw new InternalServerErrorException('관광 API 키가 설정되지 않았습니다.');
    }

    const url = this.buildUrl({
      serviceKey,
      page,
      numOfRows,
      keyword,
      contentTypeId,
      region,
    });

    let data: TourApiResponse;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Tour API HTTP ${response.status}`);
      }
      data = (await response.json()) as TourApiResponse;
    } catch (error) {
      this.logger.error('Failed to fetch tour place API', error);
      throw new InternalServerErrorException('장소 정보를 불러오지 못했습니다.');
    }

    const resultCode = data.response?.header?.resultCode;
    if (resultCode && resultCode !== '0000' && resultCode !== '00') {
      this.logger.error(`Tour API error: ${data.response?.header?.resultMsg ?? resultCode}`);
      throw new InternalServerErrorException('장소 정보를 불러오지 못했습니다.');
    }

    return data.response?.body;
  }

  private buildUrl({
    serviceKey,
    page,
    numOfRows,
    keyword,
    contentTypeId,
    region,
  }: {
    serviceKey: string;
    page: number;
    numOfRows: number;
    keyword: string;
    contentTypeId?: string;
    region: LegalDongRegion;
  }): string {
    const endpoint = keyword ? 'searchKeyword2' : 'areaBasedList2';
    const params = new URLSearchParams({
      serviceKey,
      numOfRows: String(numOfRows),
      pageNo: String(page),
      MobileOS: MOBILE_OS,
      MobileApp: MOBILE_APP,
      _type: 'json',
      lDongRegnCd: region.lDongRegnCd,
    });

    if (region.lDongSignguCd) {
      params.set('lDongSignguCd', region.lDongSignguCd);
    }

    if (contentTypeId) {
      params.set('contentTypeId', contentTypeId);
    }

    if (keyword) {
      params.set('keyword', keyword);
    }

    return `${TOUR_API_BASE_URL}/${endpoint}?${params.toString()}`;
  }

  private normalizeItems(item?: TourApiItem | TourApiItem[]): TourApiItem[] {
    if (!item) {
      return [];
    }
    return Array.isArray(item) ? item : [item];
  }

  private toPlaceItem(item: TourApiItem): PlaceSearchItem {
    const lat = item.mapy === undefined || item.mapy === '' ? null : Number(item.mapy);
    const lng = item.mapx === undefined || item.mapx === '' ? null : Number(item.mapx);
    const address = [item.addr1, item.addr2]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ');

    return {
      id: String(item.contentid ?? ''),
      contentTypeId: String(item.contenttypeid ?? ''),
      name: item.title?.trim() ?? '',
      address,
      imageUrl: item.firstimage?.trim() || item.firstimage2?.trim() || '',
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      tel: item.tel?.trim() ?? '',
    };
  }
}
