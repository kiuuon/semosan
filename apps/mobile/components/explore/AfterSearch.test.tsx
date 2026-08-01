import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { searchMountains } from '../../lib/apis/mountains';
import { createTestQueryClient } from '../../test-utils/render';
import AfterSearch from './AfterSearch';

jest.mock('../../lib/apis/mountains', () => ({
  searchMountains: jest.fn(),
}));

const mockedSearchMountains = searchMountains as jest.Mock;

describe('AfterSearch', () => {
  let queryClient: QueryClient;

  function renderAfterSearch(keyword = '북한산', type: 'name' | 'region' = 'name') {
    queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <AfterSearch keyword={keyword} type={type} />
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('검색 API를 name 타입으로 호출한다', async () => {
    mockedSearchMountains.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasNext: false,
    });

    renderAfterSearch('북한산', 'name');

    await waitFor(() => {
      expect(mockedSearchMountains).toHaveBeenCalledWith({
        keyword: '북한산',
        type: 'name',
        page: 1,
      });
      expect(screen.getByText('검색 결과가 없습니다.')).toBeOnTheScreen();
    });
  });

  it('검색 API를 region 타입으로 호출한다', async () => {
    mockedSearchMountains.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasNext: false,
    });

    renderAfterSearch('서울', 'region');

    await waitFor(() => {
      expect(mockedSearchMountains).toHaveBeenCalledWith({
        keyword: '서울',
        type: 'region',
        page: 1,
      });
      expect(screen.getByText('검색 결과가 없습니다.')).toBeOnTheScreen();
    });
  });

  it('검색 결과를 표시한다', async () => {
    mockedSearchMountains.mockResolvedValue({
      items: [
        {
          id: '1',
          name: '북한산',
          region: '서울특별시',
          height: 836,
          imageUrl: 'https://example.com/bukhansan.jpg',
        },
        {
          id: '2',
          name: '관악산',
          region: '서울특별시 관악구',
          height: 632,
          imageUrl: '',
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 2,
      hasNext: false,
    });

    renderAfterSearch('산');

    await waitFor(() => {
      expect(screen.getByText('북한산')).toBeOnTheScreen();
      expect(screen.getByText('관악산')).toBeOnTheScreen();
    });
    expect(screen.getByText('836m · 서울특별시')).toBeOnTheScreen();
    expect(screen.getByText('632m · 서울특별시 관악구')).toBeOnTheScreen();
  });

  it('높이와 지역이 없으면 대체 문구를 표시한다', async () => {
    mockedSearchMountains.mockResolvedValue({
      items: [
        {
          id: '1',
          name: '테스트산',
          region: '',
          height: null,
          imageUrl: '',
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      hasNext: false,
    });

    renderAfterSearch('테스트');

    await waitFor(() => {
      expect(screen.getByText('테스트산')).toBeOnTheScreen();
      expect(screen.getByText('- · 지역 정보 없음')).toBeOnTheScreen();
    });
  });

  it('검색 결과가 없으면 안내 문구를 표시한다', async () => {
    mockedSearchMountains.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasNext: false,
    });

    renderAfterSearch('없는산');

    await waitFor(() => {
      expect(screen.getByText('검색 결과가 없습니다.')).toBeOnTheScreen();
    });
  });

  it('검색 실패 시 에러 문구를 표시한다', async () => {
    mockedSearchMountains.mockRejectedValue(new Error('network error'));

    renderAfterSearch('북한산');

    await waitFor(() => {
      expect(screen.getByText('산 정보를 불러오지 못했습니다.')).toBeOnTheScreen();
    });
  });

  it('리스트 끝에 도달하면 다음 페이지를 요청한다', async () => {
    mockedSearchMountains
      .mockResolvedValueOnce({
        items: [
          {
            id: '1',
            name: '북한산',
            region: '서울특별시',
            height: 836,
            imageUrl: '',
          },
        ],
        page: 1,
        pageSize: 20,
        totalCount: 40,
        hasNext: true,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: '2',
            name: '관악산',
            region: '서울특별시 관악구',
            height: 632,
            imageUrl: '',
          },
        ],
        page: 2,
        pageSize: 20,
        totalCount: 40,
        hasNext: false,
      });

    renderAfterSearch('산');

    await waitFor(() => {
      expect(screen.getByText('북한산')).toBeOnTheScreen();
    });

    fireEvent(screen.getByTestId('mountain-search-list'), 'onEndReached');

    await waitFor(() => {
      expect(mockedSearchMountains).toHaveBeenCalledWith({
        keyword: '산',
        type: 'name',
        page: 2,
      });
      expect(screen.getByText('관악산')).toBeOnTheScreen();
    });
  });
});
