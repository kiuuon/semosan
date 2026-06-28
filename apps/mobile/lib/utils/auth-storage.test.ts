import * as SecureStore from 'expo-secure-store';

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth-storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('auth-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('저장된 access token을 반환한다', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('access-token');

      await expect(getAccessToken()).resolves.toBe('access-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('access_token');
    });

    it('저장된 토큰이 없으면 null을 반환한다', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await expect(getAccessToken()).resolves.toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('저장된 refresh token을 반환한다', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('refresh-token');

      await expect(getRefreshToken()).resolves.toBe('refresh-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('setTokens', () => {
    it('access token과 refresh token을 저장한다', async () => {
      await setTokens('access-token', 'refresh-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearTokens', () => {
    it('access token과 refresh token을 삭제한다', async () => {
      await clearTokens();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
    });
  });
});
