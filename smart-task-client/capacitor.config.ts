import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agnesrahal.taski',
  appName: 'Taski',
  webDir: 'build',
  server: {
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;