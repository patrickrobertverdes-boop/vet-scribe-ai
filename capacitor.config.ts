// Note: We use a local interface instead of @capacitor/cli to avoid build failures 
// in environments (like Firebase App Hosting) where the CLI might not be present.
interface LocalCapacitorConfig {
    appId: string;
    appName: string;
    server?: {
        url?: string;
        cleartext?: boolean;
        allowNavigation?: string[];
    };
    webDir?: string;
    plugins?: {
        FirebaseAuthentication?: {
            skipNativeAuth?: boolean;
            providers?: string[];
            googleClientId?: string;
        };
    };
}

const config: LocalCapacitorConfig = {
    appId: 'com.vetscribe.app',
    appName: 'VetScribe Pro',
    server: {
        url: 'https://vet-scribe-a2i--verdes-8568d.us-east4.hosted.app',
        cleartext: false,
        allowNavigation: [
            '*.firebaseauth.com',
            '*.googleapis.com',
            '*.firebaseapp.com',
            'vet-scribe-a2i--verdes-8568d.us-east4.hosted.app',
            'api.deepgram.com'
        ]
    },
    plugins: {
        FirebaseAuthentication: {
            skipNativeAuth: false,
            providers: ['google.com'],
            googleClientId: '998512816404-id0k006rkg711e3nv4gr78t4uj4vqgt9.apps.googleusercontent.com',
        },
    },
};

export default config;
