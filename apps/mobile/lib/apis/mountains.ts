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
