import { StyleSheet, View } from 'react-native';
import Header from '../../components/common/header/Header';
import colors from '../../lib/constants/colors';
import Typography from '../../components/common/typography/Typography';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = () => {
  return (
    <>
      <Header title="설정" />
      <View style={styles.container}>
        <View style={styles.listContainer}>
          <View style={styles.listItem}>
            <Typography.BodyBase>개인정보 수정</Typography.BodyBase>
            <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContainer: {},
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone100,
  },
});

export default SettingsScreen;
