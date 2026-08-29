import { buildKakaoMountainQuery, pickKakaoMountainDocument, toLatLng } from './kakao-local.util';

describe('kakao-local.util', () => {
  describe('buildKakaoMountainQuery', () => {
    it('산 이름과 소재지의 첫 구간을 공백으로 이어 붙인다', () => {
      expect(buildKakaoMountainQuery('관악산', '서울특별시 관악구ㆍ금천구, 경기도 안양시')).toBe(
        '관악산 서울특별시 관악구',
      );
    });

    it('슬래시로 나뉜 소재지도 첫 구간만 사용한다', () => {
      expect(buildKakaoMountainQuery('북한산', '서울/경기')).toBe('북한산 서울');
    });

    it('빈 소재지면 산 이름만 반환한다', () => {
      expect(buildKakaoMountainQuery(' 설악산 ', '  ')).toBe('설악산');
    });
  });

  describe('pickKakaoMountainDocument', () => {
    it('장소명에 산 이름이 들어간 문서를 고른다', () => {
      const picked = pickKakaoMountainDocument('관악산', [
        { place_name: '사당역', x: '1', y: '2' },
        { place_name: '관악산 연주대', x: '126.96', y: '37.44' },
      ]);

      expect(picked?.place_name).toBe('관악산 연주대');
    });

    it('이름 일치가 없으면 산·등산 카테고리를 고른다', () => {
      const picked = pickKakaoMountainDocument('관악산', [
        { place_name: '카페', category_name: '음식점', x: '1', y: '2' },
        { place_name: '연주대', category_name: '여행 > 관광,명소 > 산', x: '126.96', y: '37.44' },
      ]);

      expect(picked?.place_name).toBe('연주대');
    });

    it('후보가 없으면 첫 문서를 반환한다', () => {
      const picked = pickKakaoMountainDocument('관악산', [{ place_name: '사당역', x: '1', y: '2' }]);

      expect(picked?.place_name).toBe('사당역');
    });

    it('문서가 없으면 null을 반환한다', () => {
      expect(pickKakaoMountainDocument('관악산', [])).toBeNull();
    });
  });

  describe('toLatLng', () => {
    it('카카오 x는 경도, y는 위도로 변환한다', () => {
      expect(toLatLng({ x: '126.9638', y: '37.4419', place_name: '관악산' })).toEqual({
        lat: 37.4419,
        lng: 126.9638,
        placeName: '관악산',
      });
    });

    it('좌표가 없으면 null을 반환한다', () => {
      expect(toLatLng(null)).toBeNull();
      expect(toLatLng({ x: 'abc', y: '37' })).toBeNull();
    });
  });
});
