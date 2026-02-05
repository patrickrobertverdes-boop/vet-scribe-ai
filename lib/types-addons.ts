import { Species } from './types';

// ============================================================================
// 1. CLINICAL INTELLIGENCE LAYER
// ============================================================================

export type AlertType = 'drug-interaction' | 'critical-value' | 'pattern-detected' | 'follow-up-needed';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ClinicalAlert {
    id: string;
    patientId: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    recommendation: string;
    aiConfidence: number; // 0-100
    createdAt: string;
    dismissed: boolean;
    dismissedBy?: string;
    dismissedAt?: string;
}

export interface DifferentialDiagnosis {
    condition: string;
    probability: number; // 0-100
    supportingEvidence: string[];
    recommendedTests: string[];
    urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
}

export interface DrugInteraction {
    drug1: string;
    drug2: string;
    severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
    description: string;
    recommendation: string;
}

// ============================================================================
// 2. BURNOUT & WORKLOAD AWARENESS
// ============================================================================

export interface WorkloadMetrics {
    userId: string;
    date: string; // ISO date
    consultationsCount: number;
    hoursWorked: number;
    emergencyCases: number;
    complexityScore: number; // 0-100
    breaksTaken: number;
    stressIndicators: {
        rapidNoteEdits: number;
        lateNightWork: boolean;
        weekendWork: boolean;
        consecutiveDays: number;
    };
}

export interface BurnoutScore {
    userId: string;
    overall: number; // 0-100, higher = more burnout risk
    calculatedAt: string;
    factors: {
        workload: number;
        caseComplexity: number;
        workLifeBalance: number;
        teamSupport: number;
    };
    recommendations: string[];
    trend: 'improving' | 'stable' | 'worsening';
}

export interface BreakReminder {
    id: string;
    userId: string;
    scheduledFor: string;
    type: 'hydration' | 'stretch' | 'meal' | 'mental-break';
    message: string;
    acknowledged: boolean;
}

// ============================================================================
// 3. CLIENT COMMUNICATION ENHANCEMENTS
// ============================================================================

export type CommunicationType = 'appointment-reminder' | 'test-results' | 'medication-reminder' | 'educational' | 'follow-up' | 'wellness-check';
export type CommunicationChannel = 'email' | 'sms' | 'portal' | 'phone';
export type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ClientCommunication {
    id: string;
    patientId: string;
    ownerName: string;
    ownerContact: string;
    type: CommunicationType;
    channel: CommunicationChannel;
    status: CommunicationStatus;
    scheduledFor: string;
    sentAt?: string;
    readAt?: string;
    subject: string;
    content: string;
    aiGenerated: boolean;
    templateUsed?: string;
}

export interface EducationalResource {
    id: string;
    title: string;
    category: string;
    species: Species[];
    content: string;
    summary: string;
    readingTime: number; // minutes
    tags: string[];
    aiPersonalized: boolean;
    sourceUrl?: string;
}

export interface ClientPortalAccess {
    ownerId: string;
    ownerName: string;
    email: string;
    patients: string[]; // patient IDs
    lastLogin?: string;
    accessLevel: 'view-only' | 'full';
}

// ============================================================================
// 4. PREVENTIVE CARE INTELLIGENCE
// ============================================================================

export type PreventiveCareTaskType = 'vaccination' | 'dental' | 'parasite-prevention' | 'wellness-exam' | 'bloodwork' | 'senior-screening';
export type TaskPriority = 'routine' | 'due-soon' | 'overdue' | 'critical';

export interface VaccinationRecord {
    id: string;
    patientId: string;
    vaccine: string;
    dateAdministered: string;
    nextDueDate: string;
    batchNumber: string;
    administeredBy: string;
    reactions?: string;
    manufacturer?: string;
    site?: string;
}

export interface PreventiveCareTask {
    id: string;
    patientId: string;
    taskType: PreventiveCareTaskType;
    description: string;
    dueDate: string;
    priority: TaskPriority;
    aiRecommended: boolean;
    reasoning: string;
    completed: boolean;
    completedDate?: string;
    completedBy?: string;
}

export interface HealthRiskProfile {
    patientId: string;
    lastUpdated: string;
    overallRiskScore: number; // 0-100
    risks: {
        condition: string;
        probability: number; // 0-100
        riskFactors: string[];
        preventiveMeasures: string[];
        monitoringRecommendations: string[];
    }[];
    lifestageConsiderations: string[];
}

// ============================================================================
// 5. MEDICAL-LEGAL PROTECTION LAYER
// ============================================================================

export type ConsentType = 'treatment' | 'surgery' | 'anesthesia' | 'euthanasia' | 'research' | 'photography';
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'share';
export type ResourceType = 'patient' | 'consultation' | 'medication' | 'document' | 'appointment' | 'lab-result';

export interface ConsentRecord {
    id: string;
    patientId: string;
    consentType: ConsentType;
    procedureDescription: string;
    consentGivenBy: string;
    relationship: string; // e.g., "owner", "authorized agent"
    consentDate: string;
    digitalSignature?: string;
    witnessedBy?: string;
    witnessSignature?: string;
    documentUrl?: string;
    expiresAt?: string;
    revoked: boolean;
    revokedAt?: string;
}

export interface AuditLogEntry {
    id: string;
    userId: string;
    userName: string;
    action: AuditAction;
    resourceType: ResourceType;
    resourceId: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
    changes?: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    reason?: string;
}

export interface ComplianceCheck {
    recordId: string;
    recordType: ResourceType;
    requiredFields: string[];
    missingFields: string[];
    complianceScore: number; // 0-100
    recommendations: string[];
    criticalIssues: string[];
    lastChecked: string;
}

// ============================================================================
// 6. TRAINING & KNOWLEDGE CAPTURE
// ============================================================================

export type CaseOutcome = 'resolved' | 'improved' | 'stable' | 'declined' | 'euthanized' | 'referred';
export type ProcedureCategory = 'diagnostic' | 'surgical' | 'medical' | 'dental' | 'emergency' | 'preventive';

export interface CaseStudy {
    id: string;
    title: string;
    species: Species;
    breed?: string;
    age?: number;
    condition: string;
    chiefComplaint: string;
    presentation: string;
    diagnosticFindings: string;
    diagnosis: string;
    treatment: string;
    outcome: CaseOutcome;
    outcomeDetails: string;
    learningPoints: string[];
    complications?: string[];
    anonymized: boolean;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    createdBy: string;
    createdAt: string;
    viewCount: number;
}

export interface ProcedureGuide {
    id: string;
    procedureName: string;
    category: ProcedureCategory;
    description: string;
    indications: string[];
    contraindications: string[];
    steps: {
        order: number;
        title: string;
        description: string;
        safetyNotes?: string;
        imageUrl?: string;
        videoUrl?: string;
        estimatedDuration?: string;
    }[];
    estimatedDuration: string;
    requiredEquipment: string[];
    requiredSkills: string[];
    complications: string[];
    postProcedureCare: string[];
    references?: string[];
}

export interface TrainingProgress {
    userId: string;
    userName: string;
    completedCases: string[];
    proceduresPracticed: string[];
    quizScores: Record<string, number>;
    certifications: {
        name: string;
        issuedDate: string;
        expiryDate?: string;
    }[];
    skillLevels: Record<string, 'novice' | 'competent' | 'proficient' | 'expert'>;
    lastUpdated: string;
}

// ============================================================================
// 7. PRACTICE ANALYTICS EXTENSIONS
// ============================================================================

export type ForecastPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface RevenueForecast {
    period: ForecastPeriod;
    startDate: string;
    endDate: string;
    predictedRevenue: number;
    confidence: number; // 0-100
    factors: {
        seasonality: number;
        trends: number;
        externalFactors: number;
        historicalAccuracy: number;
    };
    breakdown: {
        consultations: number;
        procedures: number;
        medications: number;
        other: number;
    };
    recommendations: string[];
    generatedAt: string;
}

export interface ClientRetentionMetrics {
    clientId: string;
    clientName: string;
    firstVisit: string;
    lastVisit: string;
    visitFrequency: number; // visits per year
    averageVisitValue: number;
    totalVisits: number;
    churnRisk: number; // 0-100, higher = more likely to churn
    lifetimeValue: number;
    engagementScore: number; // 0-100
    retentionActions: string[];
    predictedNextVisit?: string;
}

export interface CapacityAnalysis {
    analysisDate: string;
    currentUtilization: number; // 0-100
    peakHours: {
        dayOfWeek: string;
        hour: number;
        utilizationPercent: number;
    }[];
    bottlenecks: {
        resource: string;
        severity: 'minor' | 'moderate' | 'major';
        description: string;
    }[];
    optimizationSuggestions: string[];
    staffingRecommendations: {
        role: string;
        currentHours: number;
        recommendedHours: number;
        reasoning: string;
    }[];
    equipmentUtilization: Record<string, number>;
}

// ============================================================================
// 8. EXPLAINABLE / OPTIONAL AI CONTROLS
// ============================================================================

export type ExplainabilityLevel = 'minimal' | 'standard' | 'detailed';

export interface AIExplanation {
    feature: string;
    decision: string;
    confidence: number; // 0-100
    timestamp: string;
    reasoning: {
        factors: {
            name: string;
            weight: number; // 0-1
            value: string;
            contribution: number; // -100 to 100
        }[];
        dataPoints: string[];
        similarCases?: {
            caseId: string;
            similarity: number;
            outcome: string;
        }[];
    };
    alternatives: {
        option: string;
        probability: number;
        reasoning: string;
    }[];
    modelVersion: string;
    dataQuality: number; // 0-100
}

export interface AISettings {
    userId: string;
    features: {
        clinicalAlerts: boolean;
        differentialDiagnosis: boolean;
        drugInteractionChecks: boolean;
        autoSoapGeneration: boolean;
        preventiveCareReminders: boolean;
        clientCommunicationDrafts: boolean;
        burnoutMonitoring: boolean;
        revenueForecasting: boolean;
        knowledgeRecommendations: boolean;
    };
    confidenceThreshold: number; // 0-100, minimum confidence to show suggestions
    explainabilityLevel: ExplainabilityLevel;
    autoApprove: {
        lowRiskSuggestions: boolean;
        communicationDrafts: boolean;
        scheduleOptimizations: boolean;
    };
    notifications: {
        criticalAlerts: boolean;
        dailyDigest: boolean;
        weeklyReport: boolean;
    };
    lastUpdated: string;
}

export interface AIAuditLog {
    id: string;
    userId: string;
    feature: string;
    action: 'suggestion-shown' | 'suggestion-accepted' | 'suggestion-rejected' | 'manual-override';
    suggestionDetails: string;
    userDecision?: string;
    timestamp: string;
    confidence: number;
    outcome?: 'successful' | 'unsuccessful' | 'unknown';
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlags {
    userId: string;
    clinicalIntelligence: boolean;
    burnoutMonitoring: boolean;
    clientCommunication: boolean;
    preventiveCare: boolean;
    medicalLegal: boolean;
    trainingKnowledge: boolean;
    advancedAnalytics: boolean;
    aiExplainability: boolean;
    lastUpdated: string;
}
