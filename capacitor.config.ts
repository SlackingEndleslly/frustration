
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9e0e622ab6364d5d9c824ae1c78dfc9e',
  appName: 'frustration',
  webDir: 'dist',
  server: {
    url: 'https://9e0e622a-b636-4d5d-9c82-4ae1c78dfc9e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
