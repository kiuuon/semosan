import legalDong from '../data/legal-dong.json';

export type LegalDongCodes = {
  lDongRegnCd: string;
  lDongRegnNm: string;
  lDongSignguCd?: string;
  lDongSignguNm?: string;
};

type Sigungu = {
  lDongSignguCd: string;
  lDongSignguNm: string;
};

type Sido = {
  lDongRegnCd: string;
  lDongRegnNm: string;
  sigungu: Sigungu[];
};

/** 산림청 소재지 표기와 KorService2 법정동 명칭 차이를 맞춘다. */
const SIDO_ALIASES: Record<string, string> = {
  서울: '서울특별시',
  서울시: '서울특별시',
  서울특별시: '서울특별시',
  부산: '부산광역시',
  부산시: '부산광역시',
  부산광역시: '부산광역시',
  대구: '대구광역시',
  대구시: '대구광역시',
  대구광역시: '대구광역시',
  인천: '인천광역시',
  인천시: '인천광역시',
  인천광역시: '인천광역시',
  광주: '전남광주통합특별시',
  광주시: '전남광주통합특별시',
  광주광역시: '전남광주통합특별시',
  전남: '전남광주통합특별시',
  전라남도: '전남광주통합특별시',
  전남광주통합특별시: '전남광주통합특별시',
  대전: '대전광역시',
  대전시: '대전광역시',
  대전광역시: '대전광역시',
  울산: '울산광역시',
  울산시: '울산광역시',
  울산광역시: '울산광역시',
  세종: '세종특별자치시',
  세종시: '세종특별자치시',
  세종특별자치시: '세종특별자치시',
  경기: '경기도',
  경기도: '경기도',
  충북: '충청북도',
  충청북도: '충청북도',
  충남: '충청남도',
  충청남도: '충청남도',
  경북: '경상북도',
  경상북도: '경상북도',
  경남: '경상남도',
  경상남도: '경상남도',
  제주: '제주특별자치도',
  제주도: '제주특별자치도',
  제주특별자치도: '제주특별자치도',
  강원: '강원특별자치도',
  강원도: '강원특별자치도',
  강원특별자치도: '강원특별자치도',
  전북: '전북특별자치도',
  전라북도: '전북특별자치도',
  전북특별자치도: '전북특별자치도',
};

const SIDO_LIST = (legalDong as { sido: Sido[] }).sido;

const SIDO_BY_NAME = new Map(SIDO_LIST.map((sido) => [sido.lDongRegnNm, sido]));

/** 긴 별칭부터 매칭되도록 정렬 */
const SIDO_ALIAS_KEYS = Object.keys(SIDO_ALIASES).sort((a, b) => b.length - a.length);

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function resolveSido(rawName: string): Sido | undefined {
  const canonical = SIDO_ALIASES[rawName] ?? rawName;
  return SIDO_BY_NAME.get(canonical);
}

function findSigungu(sido: Sido, token: string): Sigungu | undefined {
  const normalized = normalizeWhitespace(token);
  if (!normalized) return undefined;

  const exact = sido.sigungu.find((item) => item.lDongSignguNm === normalized);
  if (exact) return exact;

  // "수원시 영통구"처럼 시·구가 붙어 있는 경우, 가장 긴 이름부터 매칭
  const candidates = sido.sigungu
    .filter((item) => normalized.includes(item.lDongSignguNm) || item.lDongSignguNm.includes(normalized))
    .sort((a, b) => b.lDongSignguNm.length - a.lDongSignguNm.length);

  return candidates[0];
}

function parseSegment(segment: string): LegalDongCodes[] {
  const text = normalizeWhitespace(segment);
  if (!text) return [];

  const aliasKey = SIDO_ALIAS_KEYS.find((key) => text === key || text.startsWith(`${key} `));
  if (!aliasKey) return [];

  const sido = resolveSido(aliasKey);
  if (!sido) return [];

  const remainder = normalizeWhitespace(text.slice(aliasKey.length));
  if (!remainder) {
    return [
      {
        lDongRegnCd: sido.lDongRegnCd,
        lDongRegnNm: sido.lDongRegnNm,
      },
    ];
  }

  const tokens = remainder
    .split(/[ㆍ·]/)
    .map((token) => normalizeWhitespace(token))
    .filter(Boolean);

  const results: LegalDongCodes[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const sigungu = findSigungu(sido, token);
    if (!sigungu) continue;

    const key = `${sido.lDongRegnCd}:${sigungu.lDongSignguCd}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      lDongRegnCd: sido.lDongRegnCd,
      lDongRegnNm: sido.lDongRegnNm,
      lDongSignguCd: sigungu.lDongSignguCd,
      lDongSignguNm: sigungu.lDongSignguNm,
    });
  }

  if (results.length === 0) {
    return [
      {
        lDongRegnCd: sido.lDongRegnCd,
        lDongRegnNm: sido.lDongRegnNm,
      },
    ];
  }

  return results;
}

/**
 * 산 소재지 문자열을 KorService2 법정동 코드로 매핑한다.
 * 예: "서울특별시 관악구ㆍ금천구, 경기도 안양시" → 여러 코드 배열
 */
export function mapRegionToLegalDong(region: string): LegalDongCodes[] {
  const normalized = normalizeWhitespace(region);
  if (!normalized) return [];

  const segments = normalized
    .split(',')
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean);

  const results: LegalDongCodes[] = [];
  const seen = new Set<string>();

  for (const segment of segments) {
    for (const mapped of parseSegment(segment)) {
      const key = `${mapped.lDongRegnCd}:${mapped.lDongSignguCd ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(mapped);
    }
  }

  return results;
}
