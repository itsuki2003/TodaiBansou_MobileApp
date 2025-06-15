import { ExpoConfig, ConfigContext } from 'expo/config';

// デフォルトの設定を定義
const defaultConfig: ExpoConfig = {
  name: '東大伴走',
  slug: 'todaibansou-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/app-icon-square.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    infoPlist: {
      UIViewControllerBasedStatusBarAppearance: true
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/app-icon-square.png',
      backgroundColor: '#2563EB'
    }
  },
  web: {
    favicon: './assets/images/favicon.png'
  },
  experiments: {
    typedRoutes: false,
  },
  plugins: [
    [
      'expo-router',
      {
        origin: false,
      },
    ],
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...defaultConfig,
  ...config,
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
}); 