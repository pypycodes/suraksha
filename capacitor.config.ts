<<<<<<< HEAD
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.suraksha',
  appName: 'Suraksha',
  webDir: 'dist'
=======
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suraksha.safety',
  appName: 'Suraksha',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
>>>>>>> ea8b4d18412d85e5722905d943e25102879b4e72
};

export default config;
