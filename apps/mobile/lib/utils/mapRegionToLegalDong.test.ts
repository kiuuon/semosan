import { mapRegionToLegalDong } from './mapRegionToLegalDong';

describe('mapRegionToLegalDong', () => {
  it('maps sido and sigungu', () => {
    expect(mapRegionToLegalDong('서울특별시 종로구')).toEqual([
      {
        lDongRegnCd: '11',
        lDongRegnNm: '서울특별시',
        lDongSignguCd: '110',
        lDongSignguNm: '종로구',
      },
    ]);
  });

  it('maps multiple sigungu separated by ㆍ', () => {
    expect(mapRegionToLegalDong('서울특별시 관악구ㆍ금천구')).toEqual([
      {
        lDongRegnCd: '11',
        lDongRegnNm: '서울특별시',
        lDongSignguCd: '620',
        lDongSignguNm: '관악구',
      },
      {
        lDongRegnCd: '11',
        lDongRegnNm: '서울특별시',
        lDongSignguCd: '545',
        lDongSignguNm: '금천구',
      },
    ]);
  });

  it('maps multiple regions separated by comma', () => {
    expect(mapRegionToLegalDong('서울특별시 관악구, 경기도 안양시')).toEqual([
      {
        lDongRegnCd: '11',
        lDongRegnNm: '서울특별시',
        lDongSignguCd: '620',
        lDongSignguNm: '관악구',
      },
      {
        lDongRegnCd: '41',
        lDongRegnNm: '경기도',
        lDongSignguCd: '170',
        lDongSignguNm: '안양시',
      },
    ]);
  });

  it('maps legacy sido aliases', () => {
    expect(mapRegionToLegalDong('강원도 춘천시')).toEqual([
      {
        lDongRegnCd: '51',
        lDongRegnNm: '강원특별자치도',
        lDongSignguCd: '110',
        lDongSignguNm: '춘천시',
      },
    ]);

    expect(mapRegionToLegalDong('전라북도 전주시')).toEqual([
      {
        lDongRegnCd: '52',
        lDongRegnNm: '전북특별자치도',
        lDongSignguCd: '110',
        lDongSignguNm: '전주시',
      },
    ]);

    expect(mapRegionToLegalDong('광주광역시 북구')).toEqual([
      {
        lDongRegnCd: '12',
        lDongRegnNm: '전남광주통합특별시',
        lDongSignguCd: '300',
        lDongSignguNm: '북구',
      },
    ]);
  });

  it('returns sido only when sigungu is missing', () => {
    expect(mapRegionToLegalDong('서울특별시')).toEqual([
      {
        lDongRegnCd: '11',
        lDongRegnNm: '서울특별시',
      },
    ]);
  });

  it('returns empty array for unknown region', () => {
    expect(mapRegionToLegalDong('')).toEqual([]);
    expect(mapRegionToLegalDong('알 수 없음')).toEqual([]);
  });
});
