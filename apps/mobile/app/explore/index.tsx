import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';

import type { MountainSearchType } from '../../lib/apis/mountains';
import colors from '../../lib/constants/colors';
import DismissKeyboard from '../../components/common/dismiss-keyboard/DismissKeyboard';
import Input from '../../components/common/input/Input';
import BeforeSearch, { RECENT_SEARCHES_KEY, RECENT_SEARCHES_QUERY_KEY } from '../../components/explore/BeforeSearch';
import AfterSearch from '../../components/explore/AfterSearch';
import Typography from '../../components/common/typography/Typography';

const MAX_RECENT_SEARCHES = 10;

interface SubmittedSearch {
  keyword: string;
  type: MountainSearchType;
}

function Explore() {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [submitted, setSubmitted] = useState<SubmittedSearch | null>(null);

  const saveRecentSearch = async (keyword: string) => {
    const cached = queryClient.getQueryData<string[]>(RECENT_SEARCHES_QUERY_KEY);
    const previous =
      cached ??
      (await AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((raw) => (raw ? (JSON.parse(raw) as string[]) : []))) ??
      [];
    const next = [keyword, ...previous.filter((item) => item !== keyword)].slice(0, MAX_RECENT_SEARCHES);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    queryClient.setQueryData(RECENT_SEARCHES_QUERY_KEY, next);
  };

  const handleNameSearch = async (value: string) => {
    const keyword = value.trim();
    if (!keyword) {
      return;
    }

    await saveRecentSearch(keyword);
    setInputValue(keyword);
    setSubmitted({ keyword, type: 'name' });
  };

  const handleRegionSearch = (region: string) => {
    setInputValue(region);
    setSubmitted({ keyword: region, type: 'region' });
  };

  const handleClear = () => {
    setInputValue('');
    setSubmitted(null);
  };

  const handleChangeText = (text: string) => {
    setInputValue(text);
    if (text.trim() === '') {
      setSubmitted(null);
    }
  };

  return (
    <DismissKeyboard>
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.stone300} />
          </TouchableOpacity>
          {submitted && submitted.type === 'region' ? (
            <View style={styles.regionContainer}>
              <Typography.HeadingMd>{`${submitted?.keyword} 지역으로 검색`}</Typography.HeadingMd>
              <TouchableOpacity onPress={handleClear}>
                <Ionicons name="close" size={20} color={colors.stone300} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputWrapper}>
              <Input
                placeholder="산 이름으로 검색"
                value={inputValue}
                onChangeText={handleChangeText}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => handleNameSearch(inputValue)}
                accessoryRight={
                  submitted ? (
                    <TouchableOpacity onPress={handleClear}>
                      <Ionicons name="close" size={20} color={colors.stone300} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => handleNameSearch(inputValue)}>
                      <Ionicons name="search" size={20} color={colors.stone300} />
                    </TouchableOpacity>
                  )
                }
              />
            </View>
          )}
        </View>

        {submitted ? (
          <AfterSearch keyword={submitted.keyword} type={submitted.type} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <BeforeSearch onSearch={handleNameSearch} onRegionPress={handleRegionSearch} />
          </ScrollView>
        )}
      </View>
    </DismissKeyboard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.white,
    gap: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  inputWrapper: {
    flex: 1,
  },
  regionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
});

export default Explore;
