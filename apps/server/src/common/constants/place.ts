export const PLACE_COMMENT_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted',
} as const;

export type PlaceCommentStatus = (typeof PLACE_COMMENT_STATUS)[keyof typeof PLACE_COMMENT_STATUS];

/** 한국관광공사 KorService2 contentTypeId */
export const TOUR_CONTENT_TYPE = {
  ATTRACTION: '12',
  CULTURE: '14',
  FESTIVAL: '15',
  COURSE: '25',
  LEISURE: '28',
  LODGING: '32',
  SHOPPING: '38',
  RESTAURANT: '39',
} as const;

export type TourContentTypeId = (typeof TOUR_CONTENT_TYPE)[keyof typeof TOUR_CONTENT_TYPE];

export const TOUR_CONTENT_TYPE_IDS = Object.values(TOUR_CONTENT_TYPE);