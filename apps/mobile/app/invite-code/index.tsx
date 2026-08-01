import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Header from '../../components/common/header/Header';
import Input from '../../components/common/input/Input';
import Button from '../../components/common/button/Button';
import Typography from '../../components/common/typography/Typography';
import colors from '../../lib/constants/colors';

const InviteCodeScreen = () => {
  const [inviteCode, setInviteCode] = useState('');

  return (
    <View>
      <Header title="초대코드 입력" />
      <View style={styles.container}>
        <Typography.BodyBase color={colors.stone500}>
          전달받은 초대코드를 입력해주세요. 확인을 누르면 해당 일정에 바로 참여됩니다.
        </Typography.BodyBase>
        <View style={styles.inputContainer}>
          <Input placeholder="초대코드를 입력해주세요." value={inviteCode} onChangeText={setInviteCode} />
        </View>
        <Button size="md" onPress={() => {}}>
          확인
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inputContainer: {
    marginVertical: 16,
  },
});

export default InviteCodeScreen;
