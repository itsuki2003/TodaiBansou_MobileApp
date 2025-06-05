import { ExpoConfig, ConfigContext } from 'expo/config';

// デフォルトの設定を定義
const defaultConfig: ExpoConfig = {
  name: 'TodaiBansou_MobileApp',
  slug: 'todaibansou-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
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
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#ffffff'
    }
  },
  web: {
    favicon: './assets/images/favicon.png'
  }
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...defaultConfig,
  ...config,
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
}); 