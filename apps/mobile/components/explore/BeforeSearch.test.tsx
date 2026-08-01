import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createTestQueryClient } from '../../test-utils/render';
import BeforeSearch, { RECENT_SEARCHES_KEY } from './BeforeSearch';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('BeforeSearch', () => {
  let queryClient: QueryClient;

  async function renderBeforeSearch(onSearch = jest.fn(), onRegionPress = jest.fn()) {
    queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <BeforeSearch onSearch={onSearch} onRegionPress={onRegionPress} />
      </QueryClientProvider>,
    );
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('최근 검색어와 지역별 섹션을 표시한다', async () => {
    await renderBeforeSearch();

    await waitFor(() => {
      expect(screen.getByText('최근 검색어가 없습니다.')).toBeOnTheScreen();
    });
    expect(screen.getByText('최근 검색어')).toBeOnTheScreen();
    expect(screen.getByText('지역별')).toBeOnTheScreen();
    expect(screen.getByText('서울')).toBeOnTheScreen();
    expect(screen.getByText('제주도')).toBeOnTheScreen();
  });

  it('최근 검색어가 없으면 안내 문구를 표시한다', async () => {
    await renderBeforeSearch();

    await waitFor(() => {
      expect(screen.getByText('최근 검색어가 없습니다.')).toBeOnTheScreen();
    });
  });

  it('저장된 최근 검색어를 표시한다', async () => {
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['북한산', '관악산']));

    await renderBeforeSearch();

    await waitFor(() => {
      expect(screen.getByText('북한산')).toBeOnTheScreen();
      expect(screen.getByText('관악산')).toBeOnTheScreen();
    });
    expect(screen.queryByText('최근 검색어가 없습니다.')).not.toBeOnTheScreen();
  });

  it('최근 검색어를 누르면 onSearch를 호출한다', async () => {
    const onSearch = jest.fn();
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['북한산']));

    await renderBeforeSearch(onSearch);

    await waitFor(() => {
      expect(screen.getByText('북한산')).toBeOnTheScreen();
    });
    await fireEvent.press(screen.getByText('북한산'));

    expect(onSearch).toHaveBeenCalledWith('북한산');
  });

  it('지역을 누르면 onRegionPress를 호출한다', async () => {
    const onRegionPress = jest.fn();

    await renderBeforeSearch(jest.fn(), onRegionPress);

    await waitFor(() => {
      expect(screen.getByText('최근 검색어가 없습니다.')).toBeOnTheScreen();
    });
    await fireEvent.press(screen.getByText('강원도'));

    expect(onRegionPress).toHaveBeenCalledWith('강원도');
  });

  it('최근 검색어를 삭제하면 목록과 저장소에서 제거한다', async () => {
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['북한산', '관악산']));

    await renderBeforeSearch();

    await waitFor(() => {
      expect(screen.getByLabelText('북한산 삭제')).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByLabelText('북한산 삭제'));

    await waitFor(() => {
      expect(screen.queryByText('북한산')).not.toBeOnTheScreen();
      expect(screen.getByText('관악산')).toBeOnTheScreen();
    });

    await waitFor(async () => {
      expect(await AsyncStorage.getItem(RECENT_SEARCHES_KEY)).toBe(JSON.stringify(['관악산']));
    });
  });

  it('전체 삭제를 누르면 최근 검색어를 모두 지운다', async () => {
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['북한산', '관악산']));

    await renderBeforeSearch();

    await waitFor(() => {
      expect(screen.getByText('북한산')).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByText('전체 삭제'));

    await waitFor(() => {
      expect(screen.getByText('최근 검색어가 없습니다.')).toBeOnTheScreen();
      expect(screen.queryByText('북한산')).not.toBeOnTheScreen();
      expect(screen.queryByText('관악산')).not.toBeOnTheScreen();
    });

    await waitFor(async () => {
      expect(await AsyncStorage.getItem(RECENT_SEARCHES_KEY)).toBeNull();
    });
  });

  it('잘못된 저장 데이터면 빈 목록으로 처리한다', async () => {
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, 'not-json');

    await renderBeforeSearch();

    await waitFor(() => {
      expect(screen.getByText('최근 검색어가 없습니다.')).toBeOnTheScreen();
    });
  });
});
