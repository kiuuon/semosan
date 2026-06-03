import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';

function My() {
  return (
    <View>
      <Text>My</Text>
      <Button title="Login" onPress={() => router.push('/auth')} />
    </View>
  );
}

export default My;
