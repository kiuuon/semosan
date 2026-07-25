import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Typography from '../../../components/common/typography/Typography';
import colors from '../../../lib/constants/colors';
import Explore from '../../../components/explore/Explore';

function Home() {
  const [isExplore, setIsExplore] = useState(false);

  if (isExplore) {
    return <Explore onBack={() => setIsExplore(false)} />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setIsExplore(true)}>
        <Ionicons name="search" size={20} color={colors.stone300} />
        <Typography.BodyBase color={colors.stone300}>산 탐색하기</Typography.BodyBase>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.white,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.stone100,
    padding: 20,
    borderRadius: 16,
  },
});

export default Home;
