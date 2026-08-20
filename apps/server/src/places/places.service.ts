import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GetConcentrationRateDto } from './dto/get-concentration-rate.dto';
import { GetPlaceDetailDto } from './dto/get-place-detail.dto';
import { SearchPlacesDto, parseRegionsParam } from './dto/search-places.dto';
import { getContentTypeLabel, mapIntroToInfos, type PlaceInfoItem } from './tour-intro-fields';

const PAGE_SIZE = 20;
const TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
const CNCTR_API_BASE_URL = 'https://apis.data.go.kr/B551011/TatsCnctrRateService';
const MOBILE_OS = 'WEB';
const MOBILE_APP = 'semosan';
const PARTIAL_COVERAGE_MESSAGE = '대략 한달 안의 예보만 제공됩니다. 이후 날짜는 0으로 표시됩니다.';

type TourApiRecord = Record<string, unknown>;

interface TourApiBody {
  items?: {
    item?: TourApiRecord | TourApiRecord[];
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

export interface PlaceDetail {
  id: string;
  contentTypeId: string;
  contentTypeLabel: string;
  name: string;
  address: string;
  overview: string;
  homepage: string;
  tel: string;
  imageUrl: string;
  images: string[];
  lat: number | null;
  lng: number | null;
  lDongRegnCd: string;
  lDongSignguCd: string;
  infos: PlaceInfoItem[];
  extras: PlaceInfoItem[];
}

export type ConcentrationRateStatus = 'available' | 'out_of_range' | 'unavailable';

export interface ConcentrationRatePoint {
  date: string;
  rate: number;
}

export interface ConcentrationRateResult {
  status: ConcentrationRateStatus;
  message?: string;
  placeName?: string;
  points: ConcentrationRatePoint[];
  forecastStart?: string;
  forecastEnd?: string;
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
        this.fetchTourEndpoint(keyword ? 'searchKeyword2' : 'areaBasedList2', {
          numOfRows: String(PAGE_SIZE),
          pageNo: String(page),
          lDongRegnCd: region.lDongRegnCd,
          ...(region.lDongSignguCd ? { lDongSignguCd: region.lDongSignguCd } : {}),
          ...(contentTypeId ? { contentTypeId } : {}),
          ...(keyword ? { keyword } : {}),
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

  async getDetail(id: string, dto: GetPlaceDetailDto): Promise<PlaceDetail> {
    const contentId = id.trim();
    const contentTypeId = dto.contentTypeId.trim();

    if (!contentId) {
      throw new NotFoundException('장소 정보를 찾을 수 없습니다.');
    }

    const [commonBody, introBody, infoBody, imageBody] = await Promise.all([
      this.fetchTourEndpoint('detailCommon2', {
        contentId,
        numOfRows: '10',
        pageNo: '1',
      }),
      this.fetchTourEndpoint('detailIntro2', {
        contentId,
        contentTypeId,
        numOfRows: '10',
        pageNo: '1',
      }),
      this.fetchTourEndpoint('detailInfo2', {
        contentId,
        contentTypeId,
        numOfRows: '50',
        pageNo: '1',
      }),
      this.fetchTourEndpoint('detailImage2', {
        contentId,
        imageYN: 'Y',
        numOfRows: '30',
        pageNo: '1',
      }),
    ]);

    const common = this.normalizeItems(commonBody?.items?.item)[0];
    if (!common) {
      throw new NotFoundException('장소 정보를 찾을 수 없습니다.');
    }

    const intro = this.normalizeItems(introBody?.items?.item)[0] ?? null;
    const infoItems = this.normalizeItems(infoBody?.items?.item);
    const imageItems = this.normalizeItems(imageBody?.items?.item);

    return this.toPlaceDetail({
      common,
      intro,
      infoItems,
      imageItems,
      contentTypeId,
    });
  }

  async getConcentrationRate(dto: GetConcentrationRateDto): Promise<ConcentrationRateResult> {
    const name = dto.name.trim();
    const areaCd = dto.areaCd.trim();
    const signguCd = dto.signguCd.trim();
    const tripStart = this.toYmd(dto.startDate);
    const tripEnd = this.toYmd(dto.endDate);

    if (!name || !areaCd || !signguCd || !tripStart || !tripEnd) {
      return { status: 'unavailable', points: [] };
    }

    if (tripEnd < tripStart) {
      return { status: 'unavailable', points: [] };
    }

    let body: TourApiBody | undefined;
    try {
      body = await this.fetchTourEndpoint(
        'tatsCnctrRatedList',
        {
          areaCd,
          signguCd,
          tAtsNm: name,
          pageNo: '1',
          numOfRows: '100',
        },
        CNCTR_API_BASE_URL,
        false,
      );
    } catch (error) {
      this.logger.warn(`Failed to fetch concentration rate for ${name}`, error);
      return { status: 'unavailable', points: [] };
    }

    const items = this.normalizeItems(body?.items?.item);
    const series = items
      .map((item) => {
        const date = this.asString(item.baseYmd).replace(/-/g, '');
        const rate = this.toNumber(item.cnctrRate);
        const placeName = this.asString(item.tAtsNm);
        if (!date || rate == null || !placeName) {
          return null;
        }
        return { date, rate, placeName };
      })
      .filter((item): item is { date: string; rate: number; placeName: string } => item != null)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (series.length === 0) {
      return { status: 'unavailable', points: [] };
    }

    const placeName = series[0]?.placeName ?? name;
    const forecastStart = series[0]?.date;
    const forecastEnd = series[series.length - 1]?.date;
    const rateByDate = new Map(series.map((item) => [item.date, item.rate]));

    const points = this.eachYmd(tripStart, tripEnd).map((date) => ({
      date,
      rate: rateByDate.get(date) ?? 0,
    }));

    const hasMissing = points.some((point) => !rateByDate.has(point.date));

    return {
      status: 'available',
      placeName,
      points,
      forecastStart,
      forecastEnd,
      ...(hasMissing ? { message: PARTIAL_COVERAGE_MESSAGE } : {}),
    };
  }

  private async fetchTourEndpoint(
    endpoint: string,
    params: Record<string, string>,
    baseUrl: string = TOUR_API_BASE_URL,
    throwOnError = true,
  ): Promise<TourApiBody | undefined> {
    const serviceKey = this.configService.get<string>('TOUR_SERVICE_KEY');
    if (!serviceKey) {
      throw new InternalServerErrorException('관광 API 키가 설정되지 않았습니다.');
    }

    const searchParams = new URLSearchParams({
      serviceKey,
      MobileOS: MOBILE_OS,
      MobileApp: MOBILE_APP,
      _type: 'json',
      ...params,
    });

    const url = `${baseUrl}/${endpoint}?${searchParams.toString()}`;

    let data: TourApiResponse;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Tour API HTTP ${response.status}`);
      }
      data = (await response.json()) as TourApiResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch tour API (${endpoint})`, error);
      if (!throwOnError) {
        throw error;
      }
      throw new InternalServerErrorException('장소 정보를 불러오지 못했습니다.');
    }

    const resultCode = data.response?.header?.resultCode;
    if (resultCode && resultCode !== '0000' && resultCode !== '00') {
      this.logger.error(`Tour API error (${endpoint}): ${data.response?.header?.resultMsg ?? resultCode}`);
      if (!throwOnError) {
        throw new Error(data.response?.header?.resultMsg ?? resultCode);
      }
      throw new InternalServerErrorException('장소 정보를 불러오지 못했습니다.');
    }

    return data.response?.body;
  }

  private normalizeItems(item?: TourApiRecord | TourApiRecord[]): TourApiRecord[] {
    if (!item) {
      return [];
    }
    return Array.isArray(item) ? item : [item];
  }

  private toPlaceItem(item: TourApiRecord): PlaceSearchItem {
    const lat = this.toNumber(item.mapy);
    const lng = this.toNumber(item.mapx);

    return {
      id: this.asString(item.contentid),
      contentTypeId: this.asString(item.contenttypeid),
      name: this.asString(item.title),
      address: this.joinAddress(item.addr1, item.addr2),
      imageUrl: this.asString(item.firstimage) || this.asString(item.firstimage2),
      lat,
      lng,
      tel: this.asString(item.tel),
    };
  }

  private toPlaceDetail({
    common,
    intro,
    infoItems,
    imageItems,
    contentTypeId,
  }: {
    common: TourApiRecord;
    intro: TourApiRecord | null;
    infoItems: TourApiRecord[];
    imageItems: TourApiRecord[];
    contentTypeId: string;
  }): PlaceDetail {
    const resolvedTypeId = this.asString(common.contenttypeid) || contentTypeId;
    const imageUrl = this.asString(common.firstimage) || this.asString(common.firstimage2);
    const gallery = imageItems
      .map((item) => this.asString(item.originimgurl) || this.asString(item.smallimageurl))
      .filter(Boolean);
    const images = Array.from(new Set([imageUrl, ...gallery].filter(Boolean)));

    const tel =
      this.asString(common.tel) ||
      this.asString(intro?.infocenter) ||
      this.asString(intro?.infocenterculture) ||
      this.asString(intro?.sponsor1tel) ||
      this.asString(intro?.infocenterleports) ||
      this.asString(intro?.infocenterlodging) ||
      this.asString(intro?.infocentershopping) ||
      this.asString(intro?.infocenterfood) ||
      this.asString(intro?.infocentertourcourse);

    return {
      id: this.asString(common.contentid),
      contentTypeId: resolvedTypeId,
      contentTypeLabel: getContentTypeLabel(resolvedTypeId),
      name: this.asString(common.title),
      address: this.joinAddress(common.addr1, common.addr2),
      overview: this.cleanTourText(this.asString(common.overview)),
      homepage: this.extractHomepage(this.asString(common.homepage)),
      tel,
      imageUrl,
      images,
      lat: this.toNumber(common.mapy),
      lng: this.toNumber(common.mapx),
      lDongRegnCd: this.asString(common.lDongRegnCd) || this.asString(common.ldongregncd),
      lDongSignguCd: this.asString(common.lDongSignguCd) || this.asString(common.ldongsigngucd),
      infos: mapIntroToInfos(resolvedTypeId, intro).map((item) => ({
        ...item,
        value: this.cleanTourText(item.value),
      })),
      extras: infoItems
        .map((item) => ({
          label: this.asString(item.infoname),
          value: this.cleanTourText(this.asString(item.infotext)),
        }))
        .filter((item) => item.label && item.value),
    };
  }

  private toYmd(value: string): string {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}${match[2]}${match[3]}`;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private eachYmd(startYmd: string, endYmd: string): string[] {
    const cursor = new Date(
      Number(startYmd.slice(0, 4)),
      Number(startYmd.slice(4, 6)) - 1,
      Number(startYmd.slice(6, 8)),
    );
    const last = new Date(Number(endYmd.slice(0, 4)), Number(endYmd.slice(4, 6)) - 1, Number(endYmd.slice(6, 8)));

    if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime()) || cursor > last) {
      return [];
    }

    const dates: string[] = [];
    while (cursor <= last) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const day = String(cursor.getDate()).padStart(2, '0');
      dates.push(`${year}${month}${day}`);
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  private joinAddress(...parts: unknown[]): string {
    return parts
      .map((part) => this.asString(part))
      .filter(Boolean)
      .join(' ');
  }

  private asString(value: unknown): string {
    if (value === undefined || value === null) {
      return '';
    }
    return String(value).trim();
  }

  private toNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private extractHomepage(raw: string): string {
    if (!raw) {
      return '';
    }

    const hrefMatch = raw.match(/href=["']([^"']+)["']/i);
    if (hrefMatch?.[1]) {
      return hrefMatch[1].trim();
    }

    return this.cleanTourText(raw);
  }

  private cleanTourText(raw: string): string {
    if (!raw) {
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
      .replace(/<br\b[^>]*>/gi, '\n')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
