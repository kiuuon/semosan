import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { getAccessToken } from '../../../lib/utils/auth-storage';
import { logout } from '../../../lib/apis/auth';

function My() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  useEffect(() => {
    async function fetchAccessToken() {
      const accessToken = await getAccessToken();
      setAccessToken(accessToken);
    }
    fetchAccessToken();
  }, []);

  return (
    <View>
      <Text>My</Text>
      {accessToken ? (
        <Button title="Logout" onPress={() => logout()} />
      ) : (
        <Button title="Login" onPress={() => router.push('/auth')} />
      )}
    </View>
  );
}

export default My;
