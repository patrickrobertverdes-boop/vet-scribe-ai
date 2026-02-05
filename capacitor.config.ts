import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.vetscribe.app',
    appName: 'VetScribe',
    server: {
        url: 'https://vet-scribe-a2i--verdes-8568d.us-east4.hosted.app',
        cleartext: false,
    },
};

export default config;
