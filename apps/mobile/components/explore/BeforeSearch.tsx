import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Typography from '../common/typography/Typography';
import colors from '../../lib/constants/colors';

export const RECENT_SEARCHES_KEY = 'recent_searches';
export const RECENT_SEARCHES_QUERY_KEY = ['recentSearches'] as const;

const REGIONS = [
  '서울',
  '인천',
  '대전',
  '대구',
  '부산',
  '광주',
  '울산',
  '경기도',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주도',
];

async function fetchRecentSearches(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

interface BeforeSearchProps {
  onSearch: (search: string) => void;
  onRegionPress?: (region: string) => void;
}

function BeforeSearch({ onSearch, onRegionPress }: BeforeSearchProps) {
  const queryClient = useQueryClient();
  const { data: recentSearches = [], isPending } = useQuery({
    queryKey: RECENT_SEARCHES_QUERY_KEY,
    queryFn: fetchRecentSearches,
    staleTime: Infinity,
  });

  const handleDelete = async (search: string) => {
    const next = recentSearches.filter((item) => item !== search);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    queryClient.setQueryData(RECENT_SEARCHES_QUERY_KEY, next);
  };

  const handleDeleteAll = async () => {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    queryClient.setQueryData(RECENT_SEARCHES_QUERY_KEY, []);
  };

  return (
    <View style={styles.container}>
      <View style={styles.recentSearchesContainer}>
        <View style={styles.recentSearchesHeader}>
          <Typography.HeadingLg>최근 검색어</Typography.HeadingLg>
          <TouchableOpacity onPress={() => handleDeleteAll()}>
            <Typography.Caption color={colors.stone500}>전체 삭제</Typography.Caption>
          </TouchableOpacity>
        </View>
        {isPending ? null : recentSearches.length > 0 ? (
          <View style={styles.recentSearchesList}>
            {recentSearches.map((search) => (
              <TouchableOpacity key={search} style={styles.recentSearchesItem} onPress={() => onSearch(search)}>
                <Typography.BodyBase>{search}</Typography.BodyBase>
                <TouchableOpacity
                  hitSlop={10}
                  onPress={() => handleDelete(search)}
                  accessibilityRole="button"
                  accessibilityLabel={`${search} 삭제`}
                >
                  <Ionicons name="close" size={16} color={colors.stone300} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Typography.BodyBase>최근 검색어가 없습니다.</Typography.BodyBase>
        )}
      </View>
      <View style={styles.regionContainer}>
        <Typography.HeadingLg>지역별</Typography.HeadingLg>
        <View style={styles.regionList}>
          {REGIONS.map((region) => (
            <TouchableOpacity key={region} style={styles.regionItem} onPress={() => onRegionPress?.(region)}>
              <Typography.BodyBase>{region}</Typography.BodyBase>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentSearchesContainer: {
    gap: 16,
  },
  recentSearchesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentSearchesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.stone300,
    backgroundColor: colors.stone50,
  },
  regionContainer: {
    gap: 16,
  },
  regionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionItem: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.stone300,
  },
});

export default BeforeSearch;
