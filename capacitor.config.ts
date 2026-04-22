import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suraksha.safety',
  appName: 'Suraksha',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;
