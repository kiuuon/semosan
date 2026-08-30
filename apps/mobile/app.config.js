module.exports = {
  expo: {
    scheme: 'semoasn',
    name: 'semosan',
    slug: 'semosan',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1B4332',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.semosan.mobile',
    },
    android: {
      package: 'com.semosan.mobile',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1B4332',
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: 'pan',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#1B4332',
          image: './assets/splash-icon.png',
          resizeMode: 'contain',
          imageWidth: 200,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: '지도에 내 위치를 표시하기 위해 위치 권한이 필요합니다.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '1629d30d-5b6d-4349-b06d-e61dfcabf99e',
      },
    },
  },
};
