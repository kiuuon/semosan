import { useEffect, useState } from 'react';
import { getAccessToken } from '../utils/auth-storage';

const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccessToken = async () => {
      const accessToken = await getAccessToken();
      setAccessToken(accessToken);
    };
    fetchAccessToken();
  }, []);

  return { accessToken, setAccessToken };
};

export default useAuth;
