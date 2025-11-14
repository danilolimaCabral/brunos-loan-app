import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brunosloan.app',
  appName: "Bruno's Loan",
  webDir: 'client/dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'https://3000-ihq7vdnccc6b4l74a1wfz-d4b82d7b.manusvm.computer',
    allowNavigation: ['https://3000-ihq7vdnccc6b4l74a1wfz-d4b82d7b.manusvm.computer']
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
