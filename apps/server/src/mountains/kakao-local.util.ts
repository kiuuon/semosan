export type KakaoKeywordDocument = {
  x?: string;
  y?: string;
  place_name?: string;
  category_name?: string;
};

export function buildKakaoMountainQuery(name: string, region: string) {
  const firstRegion = region.split(/[ㆍ,/]/)[0]?.trim() ?? '';
  return [name.trim(), firstRegion].filter(Boolean).join(' ');
}

export function pickKakaoMountainDocument(name: string, documents: KakaoKeywordDocument[]) {
  if (documents.length === 0) {
    return null;
  }

  const normalizedName = name.replace(/\s/g, '');
  const nameMatch = documents.find((document) =>
    (document.place_name ?? '').replace(/\s/g, '').includes(normalizedName),
  );
  if (nameMatch) {
    return nameMatch;
  }

  const mountainMatch = documents.find((document) => /산|등산|명소/.test(document.category_name ?? ''));
  return mountainMatch ?? documents[0];
}

export function toLatLng(document: KakaoKeywordDocument | null) {
  if (!document) {
    return null;
  }

  const lat = Number(document.y);
  const lng = Number(document.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    placeName: document.place_name?.trim() || undefined,
  };
}
