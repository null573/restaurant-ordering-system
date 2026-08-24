import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.restaurant.ordering',
  appName: '餐厅点餐',
  webDir: '../web/dist',
  bundledWebRuntime: false,
  backgroundColor: '#ff6b35',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#ff6b35',
      sound: 'bell.wav',
    },
  },
  server: {
    // 发布时改为线上地址
    // url: 'https://order.yourdomain.com',
    // cleartext: true
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#ff6b35',
  },
  android: {
    backgroundColor: '#ff6b35',
    allowMixedContent: false,
  },
};

export default config;
