import { FeatureFlags, AISettings } from './types-addons';

/**
 * FEATURE FLAGS SERVICE
 * Centralized management of add-on module feature flags
 * Allows granular control over which features are enabled per user
 */

// Default feature flags for new users
export const DEFAULT_FEATURE_FLAGS: Omit<FeatureFlags, 'userId' | 'lastUpdated'> = {
    clinicalIntelligence: true,
    burnoutMonitoring: true,
    clientCommunication: true,
    preventiveCare: true,
    medicalLegal: true,
    trainingKnowledge: true,
    advancedAnalytics: true,
    aiExplainability: true,
};

// Default AI settings for new users
export const DEFAULT_AI_SETTINGS: Omit<AISettings, 'userId' | 'lastUpdated'> = {
    features: {
        clinicalAlerts: true,
        differentialDiagnosis: true,
        drugInteractionChecks: true,
        autoSoapGeneration: true,
        preventiveCareReminders: true,
        clientCommunicationDrafts: true,
        burnoutMonitoring: true,
        revenueForecasting: true,
        knowledgeRecommendations: true,
    },
    confidenceThreshold: 70, // Only show AI suggestions with 70%+ confidence
    explainabilityLevel: 'standard',
    autoApprove: {
        lowRiskSuggestions: false,
        communicationDrafts: false,
        scheduleOptimizations: false,
    },
    notifications: {
        criticalAlerts: true,
        dailyDigest: true,
        weeklyReport: false,
    },
};

/**
 * Feature flag storage key
 */
const FEATURE_FLAGS_STORAGE_KEY = 'vetscribe_feature_flags';
const AI_SETTINGS_STORAGE_KEY = 'vetscribe_ai_settings';

/**
 * Get feature flags for a user (from localStorage for now, can be moved to Firestore)
 */
export function getFeatureFlags(userId: string): FeatureFlags {
    if (typeof window === 'undefined') {
        return {
            userId,
            ...DEFAULT_FEATURE_FLAGS,
            lastUpdated: new Date().toISOString(),
        };
    }

    try {
        const stored = localStorage.getItem(`${FEATURE_FLAGS_STORAGE_KEY}_${userId}`);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading feature flags:', error);
    }

    // Return defaults if not found
    return {
        userId,
        ...DEFAULT_FEATURE_FLAGS,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Update feature flags for a user
 */
export function updateFeatureFlags(userId: string, flags: Partial<Omit<FeatureFlags, 'userId' | 'lastUpdated'>>): FeatureFlags {
    const current = getFeatureFlags(userId);
    const updated: FeatureFlags = {
        ...current,
        ...flags,
        userId,
        lastUpdated: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(`${FEATURE_FLAGS_STORAGE_KEY}_${userId}`, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving feature flags:', error);
        }
    }

    return updated;
}

/**
 * Get AI settings for a user
 */
export function getAISettings(userId: string): AISettings {
    if (typeof window === 'undefined') {
        return {
            userId,
            ...DEFAULT_AI_SETTINGS,
            lastUpdated: new Date().toISOString(),
        };
    }

    try {
        const stored = localStorage.getItem(`${AI_SETTINGS_STORAGE_KEY}_${userId}`);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading AI settings:', error);
    }

    return {
        userId,
        ...DEFAULT_AI_SETTINGS,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Update AI settings for a user
 */
export function updateAISettings(userId: string, settings: Partial<Omit<AISettings, 'userId' | 'lastUpdated'>>): AISettings {
    const current = getAISettings(userId);
    const updated: AISettings = {
        ...current,
        ...settings,
        userId,
        lastUpdated: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(`${AI_SETTINGS_STORAGE_KEY}_${userId}`, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving AI settings:', error);
        }
    }

    return updated;
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(userId: string, feature: keyof Omit<FeatureFlags, 'userId' | 'lastUpdated'>): boolean {
    const flags = getFeatureFlags(userId);
    return flags[feature] ?? false;
}

/**
 * Check if an AI feature is enabled
 */
export function isAIFeatureEnabled(userId: string, feature: keyof AISettings['features']): boolean {
    const settings = getAISettings(userId);
    return settings.features[feature] ?? false;
}

/**
 * Get confidence threshold for AI suggestions
 */
export function getConfidenceThreshold(userId: string): number {
    const settings = getAISettings(userId);
    return settings.confidenceThreshold;
}

/**
 * Check if AI suggestion should be shown based on confidence
 */
export function shouldShowAISuggestion(userId: string, confidence: number): boolean {
    const threshold = getConfidenceThreshold(userId);
    return confidence >= threshold;
}
