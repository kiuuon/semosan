import getInstance from './instance';

export type TourContentTypeId = '12' | '14' | '15' | '25' | '28' | '32' | '38' | '39';

export interface PlaceSearchRegion {
  lDongRegnCd: string;
  lDongSignguCd?: string;
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

export interface PlaceInfoItem {
  label: string;
  value: string;
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

/** 집중률 API 대상: 관광지·문화시설·쇼핑 */
export const CONCENTRATION_CONTENT_TYPE_IDS = new Set<string>(['12', '14', '38']);

export function toPlacesRegionsParam(regions: PlaceSearchRegion[]): string {
  return regions
    .map((region) => (region.lDongSignguCd ? `${region.lDongRegnCd}:${region.lDongSignguCd}` : region.lDongRegnCd))
    .join(',');
}

export async function searchPlaces(params: {
  regions: PlaceSearchRegion[];
  keyword?: string;
  contentTypeId?: TourContentTypeId;
  page?: number;
}): Promise<PlaceSearchResult> {
  const instance = await getInstance();
  const keyword = params.keyword?.trim() ?? '';

  const { data } = await instance.get<PlaceSearchResult>('/places/search', {
    params: {
      regions: toPlacesRegionsParam(params.regions),
      page: params.page ?? 1,
      ...(keyword ? { keyword } : {}),
      ...(params.contentTypeId ? { contentTypeId: params.contentTypeId } : {}),
    },
  });

  return data;
}

export async function getPlaceDetail(params: {
  id: string;
  contentTypeId: TourContentTypeId | string;
}): Promise<PlaceDetail> {
  const instance = await getInstance();
  const { data } = await instance.get<PlaceDetail>(`/places/${params.id}`, {
    params: {
      contentTypeId: params.contentTypeId,
    },
  });
  return data;
}

export async function getPlaceConcentrationRate(params: {
  name: string;
  areaCd: string;
  signguCd: string;
  startDate: string;
  endDate: string;
}): Promise<ConcentrationRateResult> {
  const instance = await getInstance();
  const { data } = await instance.get<ConcentrationRateResult>('/places/concentration-rate', {
    params,
  });
  return data;
}
