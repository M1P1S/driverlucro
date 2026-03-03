import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.driverlucro.app',
  appName: 'DriverLucro',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,
    },
  },
  plugins: {
    // Configurações de plugins nativos
  },
};

export default config;
