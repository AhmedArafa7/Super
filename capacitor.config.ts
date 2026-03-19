import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexusai.app',
  appName: 'NexusAI',
  webDir: 'public',
  server: {
    url: 'https://super-axd.pages.dev',
    cleartext: true
  }
};

export default config;
