// Note: We use a local interface instead of @capacitor/cli to avoid build failures 
// in environments (like Firebase App Hosting) where the CLI might not be present.
interface LocalCapacitorConfig {
    appId: string;
    appName: string;
    server?: {
        url?: string;
        cleartext?: boolean;
    };
    webDir?: string;
}

const config: LocalCapacitorConfig = {
    appId: 'com.vetscribe.app',
    appName: 'VetScribe',
    server: {
        url: 'https://vet-scribe-a2i--verdes-8568d.us-east4.hosted.app',
        cleartext: false,
    },
};

export default config;
