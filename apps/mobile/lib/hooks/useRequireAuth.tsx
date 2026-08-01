import { router, type Href } from 'expo-router';
import { getAccessToken } from '../utils/auth-storage';

const useRequireAuth = () => {
  const navigateWithAuth = async (href?: Href) => {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      router.push('/auth');
      return;
    }

    if (href) {
      router.push(href);
    }
  };

  return { navigateWithAuth };
};

export default useRequireAuth;
