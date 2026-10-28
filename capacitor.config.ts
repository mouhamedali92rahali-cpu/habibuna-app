import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tn.habibuna.app',
  appName: 'حبيبنا',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_habibuna',
      iconColor: '#0F5C4D',
    },
  },
};

export default config;
