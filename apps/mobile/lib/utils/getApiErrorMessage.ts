import axios from 'axios';

export const getApiErrorMessage = (error: unknown, fallback = '요청에 실패했습니다.'): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return message.join(', ');
    }
    // response 없음 = 네트워크/타임아웃/CORS 등
    if (!error.response) {
      return '네트워크 연결을 확인해 주세요.';
    }
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return fallback;
};
