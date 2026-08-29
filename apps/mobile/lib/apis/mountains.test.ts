import getInstance from './instance';
import { getMountainCoordinates, getMountainDetail, getMountainWeather, searchMountains } from './mountains';

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

  describe('getMountainDetail', () => {
    it('산 상세 API를 호출하고 결과를 반환한다', async () => {
      const result = {
        id: '20000059',
        name: '관악산',
        region: '서울특별시 관악구',
        height: 632,
        imageUrl: 'https://example.com/gwanak.jpg',
        subtitle: '불의 산',
        description: '상세 설명',
        transportInfo: '지하철 이용',
      };
      mockGet.mockResolvedValue({ data: result });

      await expect(
        getMountainDetail({
          id: '20000059',
          name: '  관악산  ',
          region: '  서울특별시 관악구  ',
        }),
      ).resolves.toEqual(result);

      expect(mockGet).toHaveBeenCalledWith('/mountains/20000059', {
        params: {
          name: '관악산',
          region: '서울특별시 관악구',
        },
      });
    });
  });

  describe('getMountainCoordinates', () => {
    it('산 좌표 API를 호출하고 결과를 반환한다', async () => {
      const result = {
        id: '20000059',
        name: '관악산',
        region: '서울특별시 관악구',
        lat: 37.4419,
        lng: 126.9638,
        placeName: '관악산',
      };
      mockGet.mockResolvedValue({ data: result });

      await expect(
        getMountainCoordinates({
          id: '20000059',
          name: '  관악산  ',
          region: '  서울특별시 관악구  ',
        }),
      ).resolves.toEqual(result);

      expect(mockGet).toHaveBeenCalledWith('/mountains/20000059/coordinates', {
        params: {
          name: '관악산',
          region: '서울특별시 관악구',
        },
      });
    });
  });

  describe('getMountainWeather', () => {
    it('산 날씨 API를 호출하고 결과를 반환한다', async () => {
      const result = {
        attribution: 'Weather data by Open-Meteo.com',
        forecastUntil: '2026-09-13',
        truncated: true,
        tooOld: false,
        current: {
          temperature: 24,
          weatherCode: 2,
          weatherLabel: '구름 조금',
          precipitation: 0,
          windSpeed: 3,
        },
        days: [],
      };
      mockGet.mockResolvedValue({ data: result });

      await expect(
        getMountainWeather({
          id: '20000059',
          name: '  관악산  ',
          region: '  서울특별시 관악구  ',
          startDate: '2026-08-29',
          endDate: '2026-09-20',
        }),
      ).resolves.toEqual(result);

      expect(mockGet).toHaveBeenCalledWith('/mountains/20000059/weather', {
        params: {
          name: '관악산',
          region: '서울특별시 관악구',
          startDate: '2026-08-29',
          endDate: '2026-09-20',
        },
      });
    });
  });
});
