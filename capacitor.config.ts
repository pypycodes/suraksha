import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suraksha.safety',
  appName: 'Suraksha',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
