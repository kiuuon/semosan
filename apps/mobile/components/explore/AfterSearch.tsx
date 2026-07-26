import { ActivityIndicator, FlatList, Image, StyleSheet, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { searchMountains, type MountainSearchType } from '../../lib/apis/mountains';
import colors from '../../lib/constants/colors';
import Typography from '../common/typography/Typography';

interface AfterSearchProps {
  keyword: string;
  type?: MountainSearchType;
}

function AfterSearch({ keyword, type = 'name' }: AfterSearchProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } = useInfiniteQuery({
    queryKey: ['mountains', 'search', type, keyword],
    queryFn: ({ pageParam }) => searchMountains({ keyword, type, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled: keyword.trim().length > 0,
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest700} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Typography.BodyBase color={colors.stone500}>산 정보를 불러오지 못했습니다.</Typography.BodyBase>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Typography.BodyBase color={colors.stone500}>검색 결과가 없습니다.</Typography.BodyBase>
      </View>
    );
  }

  return (
    <FlatList
      testID="mountain-search-list"
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator color={colors.forest700} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image" size={24} color={colors.stone500} />
            </View>
          )}
          <View style={styles.info}>
            <Typography.HeadingMd ellipsis>{item.name}</Typography.HeadingMd>
            <Typography.Caption color={colors.stone500} ellipsis>
              {item.height != null ? `${item.height}m` : '-'} · {item.region || '지역 정보 없음'}
            </Typography.Caption>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  list: {
    gap: 16,
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.stone100,
  },
  imagePlaceholder: {
    backgroundColor: colors.stone100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  footer: {
    paddingVertical: 16,
  },
});

export default AfterSearch;
