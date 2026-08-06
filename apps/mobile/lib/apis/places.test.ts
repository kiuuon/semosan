import getInstance from './instance';
import { searchPlaces, toPlacesRegionsParam } from './places';

jest.mock('./instance');

const mockGet = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getInstance as jest.Mock).mockResolvedValue({ get: mockGet });
});

describe('places', () => {
  describe('toPlacesRegionsParam', () => {
    it('시군구 코드가 있으면 콜론으로 연결한다', () => {
      expect(
        toPlacesRegionsParam([
          { lDongRegnCd: '11', lDongSignguCd: '110' },
          { lDongRegnCd: '41', lDongSignguCd: '170' },
        ]),
      ).toBe('11:110,41:170');
    });

    it('시군구 코드가 없으면 시도 코드만 넣는다', () => {
      expect(toPlacesRegionsParam([{ lDongRegnCd: '11' }])).toBe('11');
    });
  });

  describe('searchPlaces', () => {
    it('지역 기반 검색 API를 호출한다', async () => {
      const result = {
        items: [
          {
            id: '1001',
            contentTypeId: '12',
            name: '경복궁',
            address: '서울특별시 종로구',
            imageUrl: 'https://example.com/g.jpg',
            lat: 37.57,
            lng: 126.97,
            tel: '02-123-4567',
          },
        ],
        page: 1,
        pageSize: 20,
        totalCount: 1,
        hasNext: false,
      };
      mockGet.mockResolvedValue({ data: result });

      await expect(
        searchPlaces({
          regions: [{ lDongRegnCd: '11', lDongSignguCd: '110' }],
          contentTypeId: '12',
        }),
      ).resolves.toEqual(result);

      expect(mockGet).toHaveBeenCalledWith('/places/search', {
        params: {
          regions: '11:110',
          page: 1,
          contentTypeId: '12',
        },
      });
    });

    it('키워드가 있으면 keyword 파라미터를 포함한다', async () => {
      mockGet.mockResolvedValue({
        data: { items: [], page: 1, pageSize: 20, totalCount: 0, hasNext: false },
      });

      await searchPlaces({
        regions: [{ lDongRegnCd: '11', lDongSignguCd: '110' }],
        keyword: '  궁  ',
        contentTypeId: '32',
        page: 2,
      });

      expect(mockGet).toHaveBeenCalledWith('/places/search', {
        params: {
          regions: '11:110',
          page: 2,
          keyword: '궁',
          contentTypeId: '32',
        },
      });
    });
  });
});
