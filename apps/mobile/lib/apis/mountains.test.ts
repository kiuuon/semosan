import getInstance from './instance';
import { searchMountains } from './mountains';

jest.mock('./instance');

const mockGet = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getInstance as jest.Mock).mockResolvedValue({ get: mockGet });
});

describe('mountains', () => {
  describe('searchMountains', () => {
    it('산 이름 검색 API를 호출하고 결과를 반환한다', async () => {
      const result = {
        items: [
          {
            id: '1',
            name: '북한산',
            region: '서울특별시',
            height: 836,
            imageUrl: 'https://example.com/bukhansan.jpg',
          },
        ],
        page: 1,
        pageSize: 20,
        totalCount: 1,
        hasNext: false,
      };
      mockGet.mockResolvedValue({ data: result });

      await expect(
        searchMountains({
          keyword: '  북한산  ',
          type: 'name',
        }),
      ).resolves.toEqual(result);

      expect(getInstance).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalledWith('/mountains', {
        params: {
          keyword: '북한산',
          type: 'name',
          page: 1,
        },
      });
    });

    it('지역 검색 API를 호출한다', async () => {
      mockGet.mockResolvedValue({
        data: {
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          hasNext: false,
        },
      });

      await searchMountains({
        keyword: '서울',
        type: 'region',
      });

      expect(mockGet).toHaveBeenCalledWith('/mountains', {
        params: {
          keyword: '서울',
          type: 'region',
          page: 1,
        },
      });
    });

    it('page를 지정하면 해당 페이지로 요청한다', async () => {
      mockGet.mockResolvedValue({
        data: {
          items: [],
          page: 2,
          pageSize: 20,
          totalCount: 40,
          hasNext: true,
        },
      });

      await searchMountains({
        keyword: '북한산',
        type: 'name',
        page: 2,
      });

      expect(mockGet).toHaveBeenCalledWith('/mountains', {
        params: {
          keyword: '북한산',
          type: 'name',
          page: 2,
        },
      });
    });
  });
});
