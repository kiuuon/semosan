import { View } from 'react-native';

import Typography from '../../../components/common/Typography';
import Button from '../../../components/common/Button';

function Home() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Typography.DataMono>1,708m</Typography.DataMono>
      <Button variant="primary" size="lg" fullWidth onPress={() => {}}>
        인증 확인
      </Button>
    </View>
  );
}

export default Home;
