import { TOUR_CONTENT_TYPE, type TourContentTypeId } from '../common/constants/place';

export type PlaceInfoItem = {
  label: string;
  value: string;
};

const INTRO_FIELD_LABELS: Record<string, string> = {
  // 12 관광지
  infocenter: '문의',
  opendate: '개방일',
  restdate: '휴무일',
  expguide: '체험안내',
  expagerange: '체험가능연령',
  accomcount: '수용인원',
  useseason: '이용시기',
  usetime: '이용시간',
  parking: '주차',
  chkbabycarriage: '유모차',
  chkpet: '반려동물',
  chkcreditcard: '신용카드',
  // 14 문화시설
  scale: '규모',
  usefee: '이용요금',
  discountinfo: '할인정보',
  spendtime: '관람소요시간',
  parkingfee: '주차요금',
  infocenterculture: '문의',
  accomcountculture: '수용인원',
  usetimeculture: '이용시간',
  restdateculture: '휴무일',
  parkingculture: '주차',
  chkbabycarriageculture: '유모차',
  chkpetculture: '반려동물',
  chkcreditcardculture: '신용카드',
  // 15 축제/공연
  sponsor1: '주최',
  sponsor1tel: '주최 문의',
  sponsor2: '주관',
  sponsor2tel: '주관 문의',
  eventstartdate: '시작일',
  eventenddate: '종료일',
  playtime: '공연시간',
  eventplace: '행사장소',
  usetimefestival: '이용요금',
  agelimit: '관람가능연령',
  spendtimefestival: '관람소요시간',
  bookingplace: '예매처',
  placeinfo: '행사장 위치안내',
  // 25 여행코스
  distance: '코스 총거리',
  taketime: '소요시간',
  theme: '테마',
  schedule: '일정',
  infocentertourcourse: '문의',
  // 28 레포츠
  openperiod: '개장기간',
  reservation: '예약안내',
  infocenterleports: '문의',
  scaleleports: '규모',
  accomcountleports: '수용인원',
  restdateleports: '휴무일',
  usetimeleports: '이용시간',
  usefeeleports: '이용요금',
  parkingleports: '주차',
  chkbabycarriageleports: '유모차',
  chkpetleports: '반려동물',
  chkcreditcardleports: '신용카드',
  // 32 숙박
  roomcount: '객실수',
  roomtype: '객실유형',
  refundregulation: '환불규정',
  checkintime: '체크인',
  checkouttime: '체크아웃',
  chkcooking: '취사',
  subfacility: '부대시설',
  reservationurl: '예약 URL',
  pickup: '픽업',
  infocenterlodging: '문의',
  parkinglodging: '주차',
  reservationlodging: '예약안내',
  foodplace: '식음료장',
  // 38 쇼핑
  saleitem: '판매품목',
  saleitemcost: '판매가격',
  fairday: '장서는 날',
  shopguide: '매장안내',
  culturecenter: '문화센터',
  restroom: '화장실',
  infocentershopping: '문의',
  scaleshopping: '규모',
  restdateshopping: '휴무일',
  parkingshopping: '주차',
  chkbabycarriageshopping: '유모차',
  chkpetshopping: '반려동물',
  chkcreditcardshopping: '신용카드',
  opentime: '영업시간',
  // 39 음식점
  seat: '좌석수',
  kidsfacility: '어린이놀이방',
  firstmenu: '대표메뉴',
  treatmenu: '취급메뉴',
  smoking: '금연/흡연',
  packing: '포장',
  infocenterfood: '문의',
  scalefood: '규모',
  parkingfood: '주차',
  opentimefood: '영업시간',
  restdatefood: '휴무일',
  discountinfofood: '할인정보',
  chkcreditcardfood: '신용카드',
  reservationfood: '예약안내',
  lcnsno: '인허가번호',
};

const INTRO_FIELDS_BY_TYPE: Record<TourContentTypeId, string[]> = {
  [TOUR_CONTENT_TYPE.ATTRACTION]: [
    'usetime',
    'restdate',
    'infocenter',
    'parking',
    'useseason',
    'opendate',
    'expguide',
    'expagerange',
    'accomcount',
    'chkbabycarriage',
    'chkpet',
    'chkcreditcard',
  ],
  [TOUR_CONTENT_TYPE.CULTURE]: [
    'usetimeculture',
    'restdateculture',
    'usefee',
    'parkingfee',
    'infocenterculture',
    'parkingculture',
    'discountinfo',
    'spendtime',
    'scale',
    'accomcountculture',
    'chkbabycarriageculture',
    'chkpetculture',
    'chkcreditcardculture',
  ],
  [TOUR_CONTENT_TYPE.FESTIVAL]: [
    'eventstartdate',
    'eventenddate',
    'eventplace',
    'playtime',
    'usetimefestival',
    'agelimit',
    'spendtimefestival',
    'bookingplace',
    'sponsor1',
    'sponsor1tel',
    'sponsor2',
    'sponsor2tel',
    'placeinfo',
  ],
  [TOUR_CONTENT_TYPE.COURSE]: ['distance', 'taketime', 'theme', 'schedule', 'infocentertourcourse'],
  [TOUR_CONTENT_TYPE.LEISURE]: [
    'usetimeleports',
    'restdateleports',
    'usefeeleports',
    'openperiod',
    'reservation',
    'infocenterleports',
    'parkingleports',
    'scaleleports',
    'accomcountleports',
    'chkbabycarriageleports',
    'chkpetleports',
    'chkcreditcardleports',
  ],
  [TOUR_CONTENT_TYPE.LODGING]: [
    'checkintime',
    'checkouttime',
    'infocenterlodging',
    'reservationlodging',
    'reservationurl',
    'parkinglodging',
    'chkcooking',
    'roomcount',
    'roomtype',
    'subfacility',
    'pickup',
    'foodplace',
    'refundregulation',
  ],
  [TOUR_CONTENT_TYPE.SHOPPING]: [
    'opentime',
    'restdateshopping',
    'saleitem',
    'saleitemcost',
    'fairday',
    'infocentershopping',
    'parkingshopping',
    'chkcreditcardshopping',
    'restroom',
    'shopguide',
    'culturecenter',
    'scaleshopping',
    'chkbabycarriageshopping',
    'chkpetshopping',
  ],
  [TOUR_CONTENT_TYPE.RESTAURANT]: [
    'opentimefood',
    'restdatefood',
    'firstmenu',
    'treatmenu',
    'infocenterfood',
    'parkingfood',
    'smoking',
    'packing',
    'reservationfood',
    'discountinfofood',
    'chkcreditcardfood',
    'seat',
    'kidsfacility',
    'scalefood',
  ],
};

const CONTENT_TYPE_LABELS: Record<TourContentTypeId, string> = {
  [TOUR_CONTENT_TYPE.ATTRACTION]: '관광지',
  [TOUR_CONTENT_TYPE.CULTURE]: '문화시설',
  [TOUR_CONTENT_TYPE.FESTIVAL]: '축제공연행사',
  [TOUR_CONTENT_TYPE.COURSE]: '여행코스',
  [TOUR_CONTENT_TYPE.LEISURE]: '레포츠',
  [TOUR_CONTENT_TYPE.LODGING]: '숙박',
  [TOUR_CONTENT_TYPE.SHOPPING]: '쇼핑',
  [TOUR_CONTENT_TYPE.RESTAURANT]: '음식점',
};

const DATE_FIELDS = new Set(['eventstartdate', 'eventenddate']);

function formatIntroValue(field: string, value: string): string {
  if (!DATE_FIELDS.has(field)) {
    return value;
  }

  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
  }

  return value;
}

export function getContentTypeLabel(contentTypeId: string): string {
  return CONTENT_TYPE_LABELS[contentTypeId as TourContentTypeId] ?? '기타';
}

export function mapIntroToInfos(contentTypeId: string, intro: Record<string, unknown> | null): PlaceInfoItem[] {
  const fields = INTRO_FIELDS_BY_TYPE[contentTypeId as TourContentTypeId] ?? [];
  const infos: PlaceInfoItem[] = [];

  for (const field of fields) {
    const raw = intro?.[field];
    if (raw === undefined || raw === null) {
      continue;
    }

    const value = String(raw).trim();
    if (!value || value === '0' || value === '선택안함') {
      continue;
    }

    const label = INTRO_FIELD_LABELS[field];
    if (!label) {
      continue;
    }

    infos.push({
      label,
      value: formatIntroValue(field, value),
    });
  }

  return infos;
}
