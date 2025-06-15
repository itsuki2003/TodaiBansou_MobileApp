const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo Routerのデバッグ情報を無効化
config.resolver.alias = {
  ...config.resolver.alias,
};

// require.contextを有効化（Expo Router 5.1.0で必要）
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;