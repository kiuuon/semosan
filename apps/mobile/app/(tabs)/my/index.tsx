import { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

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

  const { mutate, isPending } = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      setAccessToken(null);
    },
    onError: () => {
      Alert.alert('로그아웃에 실패했습니다. 다시 시도해 주세요.');
    },
  });

  return (
    <View>
      <Text>My</Text>
      {accessToken ? (
        <Button title="Logout" onPress={() => mutate()} disabled={isPending} />
      ) : (
        <Button title="Login" onPress={() => router.push('/auth')} />
      )}
    </View>
  );
}

export default My;
