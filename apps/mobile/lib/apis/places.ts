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

export function toPlacesRegionsParam(regions: PlaceSearchRegion[]): string {
  return regions
    .map((region) =>
      region.lDongSignguCd ? `${region.lDongRegnCd}:${region.lDongSignguCd}` : region.lDongRegnCd,
    )
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
