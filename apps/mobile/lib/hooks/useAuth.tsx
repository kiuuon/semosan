import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getAccessToken } from '../utils/auth-storage';

const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getAccessToken().then(setAccessToken);
    }, []),
  );

  return { accessToken };
};

export default useAuth;
