import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MountainCoord, type MountainCoordDocument } from '../schemas/mountain-coord.schema';
import { KakaoLocalService } from './kakao-local.service';

import {
  getCurrentSeasonCode,
  getRecommendCopy,
  MOUNTAIN_SEASON_LABELS,
  MOUNTAIN_THEME_LABELS,
  pickDailyRecommendKeyword,
  seededShuffle,
  type MountainSeasonCode,
  type MountainThemeCode,
} from './constants/mountain-recommend';
import { GetMountainDetailDto } from './dto/get-mountain-detail.dto';
import { GetMountainWeatherDto } from './dto/get-mountain-weather.dto';
import { RecommendMountainsDto } from './dto/recommend-mountains.dto';
import { SearchMountainsDto } from './dto/search-mountains.dto';
import { OpenMeteoService } from './open-meteo.service';
import { OPEN_METEO_DETAIL_DAYS, pastDaysFromStart, sliceWeatherDays, type WeatherDay } from './open-meteo.util';
import { MountainSearchType } from './types/mountain-search-type';

const PAGE_SIZE = 20;
const RECOMMEND_FETCH_SIZE = 20;
const RECOMMEND_LIMIT = 4;
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

export interface MountainRecommendResult {
  items: MountainSearchItem[];
  season: MountainSeasonCode | null;
  theme: MountainThemeCode | null;
  keywordLabel: string;
  headline: string;
  subline: string;
}

export interface MountainCoordResult {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  placeName?: string;
}

export interface MountainWeatherResult {
  attribution: string;
  forecastUntil: string | null;
  truncated: boolean;
  tooOld: boolean;
  current: {
    temperature: number | null;
    weatherCode: number;
    weatherLabel: string;
    precipitation: number | null;
    windSpeed: number | null;
  } | null;
  days: WeatherDay[];
}

@Injectable()
export class MountainsService {
  private readonly logger = new Logger(MountainsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly kakaoLocalService: KakaoLocalService,
    private readonly openMeteoService: OpenMeteoService,
    @InjectModel(MountainCoord.name) private readonly mountainCoordModel: Model<MountainCoordDocument>,
  ) {}

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

  async recommend(dto: RecommendMountainsDto): Promise<MountainRecommendResult> {
    const now = new Date();
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const hasExplicitFilter = Boolean(dto.season || dto.theme);
    const daily = hasExplicitFilter ? null : pickDailyRecommendKeyword(now);

    const season = (dto.season ?? (daily?.kind === 'season' ? daily.code : null)) as MountainSeasonCode | null;
    const theme = (dto.theme ?? (daily?.kind === 'theme' ? daily.code : null)) as MountainThemeCode | null;
    const keywordLabel =
      (theme ? MOUNTAIN_THEME_LABELS[theme] : null) ??
      (season ? MOUNTAIN_SEASON_LABELS[season] : null) ??
      daily?.label ??
      MOUNTAIN_SEASON_LABELS[getCurrentSeasonCode(now)];

    const probe = await this.fetchForestApi({
      page: 1,
      numOfRows: 1,
      seasonCode: season ?? undefined,
      themeCode: theme ?? undefined,
    });
    const totalCount = Number(probe?.totalCount ?? 0);
    const maxPage = Math.max(1, Math.ceil(totalCount / RECOMMEND_FETCH_SIZE));
    const page = (seed % maxPage) + 1;

    const body = await this.fetchForestApi({
      page,
      numOfRows: RECOMMEND_FETCH_SIZE,
      seasonCode: season ?? undefined,
      themeCode: theme ?? undefined,
    });

    const mapped = this.normalizeItems(body?.items?.item).map((item) => this.toMountainItem(item));
    const withImage = mapped.filter((item) => Boolean(item.imageUrl));

    const seenIds = new Set(withImage.map((item) => item.id));
    const pool = [...withImage];

    // 사진 있는 산이 부족하면 다른 페이지에서 보충
    let attempts = 0;
    while (pool.length < RECOMMEND_LIMIT && maxPage > 1 && attempts < Math.min(4, maxPage - 1)) {
      attempts += 1;
      const nextPage = ((seed + attempts) % maxPage) + 1;
      if (nextPage === page) continue;

      const nextBody = await this.fetchForestApi({
        page: nextPage,
        numOfRows: RECOMMEND_FETCH_SIZE,
        seasonCode: season ?? undefined,
        themeCode: theme ?? undefined,
      });
      const nextMapped = this.normalizeItems(nextBody?.items?.item).map((item) => this.toMountainItem(item));
      for (const item of nextMapped) {
        if (!item.imageUrl || seenIds.has(item.id)) continue;
        seenIds.add(item.id);
        pool.push(item);
      }
    }

    const items = seededShuffle(pool, seed).slice(0, RECOMMEND_LIMIT);
    const copy = getRecommendCopy(keywordLabel);

    return {
      items,
      season,
      theme,
      keywordLabel,
      headline: copy.headline,
      subline: copy.subline,
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

  async getCoordinates(id: string, dto: GetMountainDetailDto): Promise<MountainCoordResult> {
    const mountainId = id.trim();
    const name = dto.name.trim();
    const region = dto.region.trim();

    const cached = await this.mountainCoordModel.findOne({ externalId: mountainId }).exec();
    if (cached && cached.name === name && cached.region === region) {
      return {
        id: cached.externalId,
        name: cached.name,
        region: cached.region,
        lat: cached.lat,
        lng: cached.lng,
        placeName: cached.placeName,
      };
    }

    const found = await this.kakaoLocalService.searchMountainCoord(name, region);
    if (!found) {
      throw new NotFoundException('산 위치를 찾을 수 없습니다.');
    }

    const saved = await this.mountainCoordModel.findOneAndUpdate(
      { externalId: mountainId },
      {
        externalId: mountainId,
        name,
        region,
        query: found.query,
        lat: found.lat,
        lng: found.lng,
        placeName: found.placeName,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return {
      id: mountainId,
      name,
      region,
      lat: saved?.lat ?? found.lat,
      lng: saved?.lng ?? found.lng,
      placeName: saved?.placeName ?? found.placeName,
    };
  }

  async getWeather(id: string, dto: GetMountainWeatherDto): Promise<MountainWeatherResult> {
    const coord = await this.getCoordinates(id, dto);
    const startDate = dto.startDate?.trim();
    const endDate = dto.endDate?.trim() || startDate;
    const forecast = await this.openMeteoService.getForecast(coord.lat, coord.lng, pastDaysFromStart(startDate));

    if (!startDate) {
      return {
        attribution: forecast.attribution,
        forecastUntil: forecast.forecastUntil,
        truncated: false,
        tooOld: false,
        current: forecast.current,
        days: forecast.days.slice(0, OPEN_METEO_DETAIL_DAYS),
      };
    }

    const sliced = sliceWeatherDays(forecast.days, startDate, endDate);

    return {
      attribution: forecast.attribution,
      forecastUntil: sliced.forecastUntil,
      truncated: sliced.truncated,
      tooOld: sliced.tooOld,
      current: forecast.current,
      days: sliced.days,
    };
  }

  private async fetchForestApi({
    page,
    numOfRows,
    type,
    keyword,
    seasonCode,
    themeCode,
  }: {
    page: number;
    numOfRows: number;
    type?: MountainSearchType;
    keyword?: string;
    seasonCode?: string;
    themeCode?: string;
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
      seasonCode,
      themeCode,
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
    seasonCode,
    themeCode,
  }: {
    serviceKey: string;
    page: number;
    numOfRows: number;
    type?: MountainSearchType;
    keyword?: string;
    seasonCode?: string;
    themeCode?: string;
  }): string {
    const params = new URLSearchParams({
      serviceKey,
      pageNo: String(page),
      numOfRows: String(numOfRows),
      _type: 'json',
    });

    if (type && keyword) {
      if (type === MountainSearchType.NAME) {
        params.set('mntnNm', keyword);
      } else {
        params.set('mntnAdd', keyword);
      }
    }

    if (seasonCode) {
      params.set('mntnInfoSsnCd', seasonCode);
    }

    if (themeCode) {
      params.set('mntnInfoThmCd', themeCode);
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
