import getInstance from './instance';

export type MountainSearchType = 'name' | 'region';

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

export interface MountainRecommendResult {
  items: MountainSearchItem[];
  season: string | null;
  theme: string | null;
  keywordLabel: string;
  headline: string;
  subline: string;
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

export async function searchMountains(params: {
  keyword: string;
  type: MountainSearchType;
  page?: number;
}): Promise<MountainSearchResult> {
  const instance = await getInstance();
  const { data } = await instance.get<MountainSearchResult>('/mountains', {
    params: {
      keyword: params.keyword.trim(),
      type: params.type,
      page: params.page ?? 1,
    },
  });
  return data;
}

export async function getRecommendedMountains(): Promise<MountainRecommendResult> {
  const instance = await getInstance();
  const { data } = await instance.get<MountainRecommendResult>('/mountains/recommend');
  return data;
}

export async function getMountainDetail(params: { id: string; name: string; region: string }): Promise<MountainDetail> {
  const instance = await getInstance();
  const { data } = await instance.get<MountainDetail>(`/mountains/${params.id}`, {
    params: {
      name: params.name.trim(),
      region: params.region.trim(),
    },
  });
  return data;
}

export interface MountainCoord {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  placeName?: string;
}

export async function getMountainCoordinates(params: {
  id: string;
  name: string;
  region: string;
}): Promise<MountainCoord> {
  const instance = await getInstance();
  const { data } = await instance.get<MountainCoord>(`/mountains/${params.id}/coordinates`, {
    params: {
      name: params.name.trim(),
      region: params.region.trim(),
    },
  });
  return data;
}

export interface MountainWeatherDay {
  date: string;
  weatherCode: number;
  weatherLabel: string;
  tMax: number | null;
  tMin: number | null;
  precipProb: number | null;
}

export interface MountainWeather {
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
  days: MountainWeatherDay[];
}

export async function getMountainWeather(params: {
  id: string;
  name: string;
  region: string;
  startDate?: string;
  endDate?: string;
}): Promise<MountainWeather> {
  const instance = await getInstance();
  const { data } = await instance.get<MountainWeather>(`/mountains/${params.id}/weather`, {
    params: {
      name: params.name.trim(),
      region: params.region.trim(),
      ...(params.startDate ? { startDate: params.startDate } : {}),
      ...(params.endDate ? { endDate: params.endDate } : {}),
    },
  });
  return data;
}
