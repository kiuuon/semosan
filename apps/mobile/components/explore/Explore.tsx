import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';

import colors from '../../lib/constants/colors';
import Input from '../common/input/Input';
import BeforeSearch, { RECENT_SEARCHES_KEY, RECENT_SEARCHES_QUERY_KEY } from './BeforeSearch';
import AfterSearch from './AfterSearch';

const MAX_RECENT_SEARCHES = 10;

interface ExploreProps {
  onBack: () => void;
}

function Explore({ onBack }: ExploreProps) {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');

  const [searchType, setSearchType] = useState<'beforeSearch' | 'afterSearch'>('beforeSearch');

  useEffect(() => {
    if (inputValue.trim() === '') {
      setSearchType('beforeSearch');
    }
  }, [inputValue]);

  const handleSearch = async (value: string) => {
    if (!value) return;

    const cached = queryClient.getQueryData<string[]>(RECENT_SEARCHES_QUERY_KEY);
    const previous =
      cached ??
      (await AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((raw) => (raw ? (JSON.parse(raw) as string[]) : [])));
    const next = [value, ...(previous as string[]).filter((item) => item !== value)].slice(0, MAX_RECENT_SEARCHES);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    queryClient.setQueryData(RECENT_SEARCHES_QUERY_KEY, next);
    setSearchType('afterSearch');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={colors.stone300} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <Input
            placeholder="산 이름 또는 지역 검색"
            value={inputValue}
            onChangeText={setInputValue}
            accessoryRight={
              searchType === 'beforeSearch' ? (
                <TouchableOpacity onPress={() => handleSearch(inputValue)}>
                  <Ionicons name="search" size={20} color={colors.stone300} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setInputValue('');
                    setSearchType('beforeSearch');
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.stone300} />
                </TouchableOpacity>
              )
            }
          />
        </View>
      </View>

      {searchType === 'beforeSearch' && (
        <BeforeSearch
          onSearch={(value) => {
            setInputValue(value);
            handleSearch(value);
          }}
        />
      )}
      {searchType === 'afterSearch' && <AfterSearch />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.white,
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  inputWrapper: {
    flex: 1,
  },
});

export default Explore;
