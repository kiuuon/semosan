/** 산림청 mntnInfoSsnCd — 단일 계절만 사용 */
export const MOUNTAIN_SEASON_CODES = {
  SPRING: '01',
  SUMMER: '02',
  AUTUMN: '03',
  WINTER: '04',
} as const;

export type MountainSeasonCode = (typeof MOUNTAIN_SEASON_CODES)[keyof typeof MOUNTAIN_SEASON_CODES];

export const MOUNTAIN_SEASON_LABELS: Record<MountainSeasonCode, string> = {
  '01': '봄',
  '02': '여름',
  '03': '가을',
  '04': '겨울',
};

/** 산림청 mntnInfoThmCd — 확정된 주제만 사용 */
export const MOUNTAIN_THEME_CODES = {
  VALLEY: '01',
  FOLIAGE: '02',
  SILVER_GRASS: '03',
  SUNRISE_SUNSET: '06',
  ROCK_RIDGE: '08',
  AZALEA: '09',
  SNOWSCAPE: '11',
} as const;

export type MountainThemeCode = (typeof MOUNTAIN_THEME_CODES)[keyof typeof MOUNTAIN_THEME_CODES];

export const MOUNTAIN_THEME_LABELS: Record<MountainThemeCode, string> = {
  '01': '계곡',
  '02': '단풍',
  '03': '억새',
  '06': '일출·일몰',
  '08': '암릉',
  '09': '철쭉',
  '11': '설경',
};

export const ALLOWED_MOUNTAIN_SEASON_CODES = Object.values(MOUNTAIN_SEASON_CODES);
export const ALLOWED_MOUNTAIN_THEME_CODES = Object.values(MOUNTAIN_THEME_CODES);

export type DailyRecommendKeyword =
  | { kind: 'season'; code: MountainSeasonCode; label: string }
  | { kind: 'theme'; code: MountainThemeCode; label: string };

/** 월(1–12) 기준 현재 계절 코드 */
export function getSeasonCodeForMonth(month: number): MountainSeasonCode {
  if (month >= 3 && month <= 5) return MOUNTAIN_SEASON_CODES.SPRING;
  if (month >= 6 && month <= 8) return MOUNTAIN_SEASON_CODES.SUMMER;
  if (month >= 9 && month <= 11) return MOUNTAIN_SEASON_CODES.AUTUMN;
  return MOUNTAIN_SEASON_CODES.WINTER;
}

export function getCurrentSeasonCode(now = new Date()): MountainSeasonCode {
  return getSeasonCodeForMonth(now.getMonth() + 1);
}

/** 시즌에 맞는 오늘의 키워드 후보 (날짜마다 하나 선택) */
export function getDailyKeywordPool(season: MountainSeasonCode): DailyRecommendKeyword[] {
  const seasonLabel = MOUNTAIN_SEASON_LABELS[season];
  const seasonKeyword: DailyRecommendKeyword = { kind: 'season', code: season, label: seasonLabel };

  if (season === MOUNTAIN_SEASON_CODES.SPRING) {
    return [
      seasonKeyword,
      { kind: 'theme', code: MOUNTAIN_THEME_CODES.VALLEY, label: MOUNTAIN_THEME_LABELS['01'] },
      { kind: 'theme', code: MOUNTAIN_THEME_CODES.SUNRISE_SUNSET, label: MOUNTAIN_THEME_LABELS['06'] },
      { kind: 'theme', code: MOUNTAIN_THEME_CODES.ROCK_RIDGE, label: MOUNTAIN_THEME_LABELS['08'] },
    ];
  }

  if (season === MOUNTAIN_SEASON_CODES.SUMMER) {
    return [
      seasonKeyword,
      { kind: 'theme', code: MOUNTAIN_THEME_CODES.VALLEY, label: MOUNTAIN_THEME_LABELS['01'] },
      { kind: 'theme', code: MOUNTAIN_THEME_CODES.ROCK_RIDGE, label: MOUNTAIN_THEME_LABELS['08'] },
      { kind: 'theme', code: MOUNTAIN_THEME_CODES.SUNRISE_SUNSET, label: MOUNTAIN_THEME_LABELS['06'] },
    ];
  }

  if (season === MOUNTAIN_SEASON_CODES.AUTUMN) {
    return [
      seasonKeyword,
      { kind: 'theme', code: MOUNTAIN_THEME_CODES.FOLIAGE, label: MOUNTAIN_THEME_LABELS['02'] },
      { kind: 'theme', code: MOUNTAIN_THEME_CODES.SILVER_GRASS, label: MOUNTAIN_THEME_LABELS['03'] },
      { kind: 'theme', code: MOUNTAIN_THEME_CODES.ROCK_RIDGE, label: MOUNTAIN_THEME_LABELS['08'] },
    ];
  }

  return [
    seasonKeyword,
    { kind: 'theme', code: MOUNTAIN_THEME_CODES.SNOWSCAPE, label: MOUNTAIN_THEME_LABELS['11'] },
    { kind: 'theme', code: MOUNTAIN_THEME_CODES.SUNRISE_SUNSET, label: MOUNTAIN_THEME_LABELS['06'] },
    { kind: 'theme', code: MOUNTAIN_THEME_CODES.ROCK_RIDGE, label: MOUNTAIN_THEME_LABELS['08'] },
  ];
}

export function pickDailyRecommendKeyword(now = new Date()): DailyRecommendKeyword {
  const season = getCurrentSeasonCode(now);
  const pool = getDailyKeywordPool(season);
  const index = Math.floor(Math.random() * pool.length);
  return pool[index]!;
}

export function getDayOfYear(now = new Date()): number {
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDailySeed(now = new Date()): number {
  return now.getFullYear() * 1000 + getDayOfYear(now);
}

/** 키워드에 맞는 추천 카피 */
export function getRecommendCopy(keywordLabel: string): { headline: string; subline: string } {
  const copyByLabel: Record<string, { headline: string; subline: string }> = {
    봄: {
      headline: '봄바람 부는 산으로',
      subline: '지금 시즌에 맞춰 골라봤어요',
    },
    여름: {
      headline: '가볍게 떠나는 여름 산행',
      subline: '지금 시즌에 맞춰 골라봤어요',
    },
    가을: {
      headline: '가을 산이 가장 예쁜 때',
      subline: '지금 시즌에 맞춰 골라봤어요',
    },
    겨울: {
      headline: '맑고 차가운 겨울 능선',
      subline: '지금 시즌에 맞춰 골라봤어요',
    },
    계곡: {
      headline: '물소리 따라가는 하루',
      subline: '계곡이 있어 걷기 좋은 산이에요',
    },
    단풍: {
      headline: '단풍이 물들기 시작했어요',
      subline: '지금 가장 예쁜 단풍 산을 골랐어요',
    },
    억새: {
      headline: '은빛 물결 보러 갈래요?',
      subline: '억새가 펼쳐진 능선을 모았어요',
    },
    '일출·일몰': {
      headline: '해가 머무는 산 정상',
      subline: '일출·일몰 보기에 좋은 곳이에요',
    },
    암릉: {
      headline: '바위 능선이 멋진 산',
      subline: '조금 도전하고 싶을 때 좋아요',
    },
    철쭉: {
      headline: '철쭉이 피어나는 길',
      subline: '봄 산행의 하이라이트를 모아봤어요',
    },
    설경: {
      headline: '눈 덮인 풍경이 기다려요',
      subline: '설경이 아름다운 산을 골랐어요',
    },
  };

  return (
    copyByLabel[keywordLabel] ?? {
      headline: '오늘 떠나기 좋은 산',
      subline: '지금 걷기 좋은 곳을 골라봤어요',
    }
  );
}

/** 같은 날에는 같은 순서가 나오도록 섞기 */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let state = seed >>> 0;

  for (let i = arr.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const current = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = current;
  }

  return arr;
}
