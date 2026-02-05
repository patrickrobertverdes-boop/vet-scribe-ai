import {
    ConsentRecord,
    AuditLogEntry,
    ComplianceCheck,
    ResourceType,
    AuditAction,
} from '../types-addons';

/**
 * COMPLIANCE MONITOR SERVICE
 * Medical-legal protection and audit trail
 */

/**
 * Create audit log entry
 */
export function createAuditLog(
    userId: string,
    userName: string,
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    changes?: any[]
): AuditLogEntry {
    return {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userName,
        action,
        resourceType,
        resourceId,
        timestamp: new Date().toISOString(),
        ipAddress: typeof window !== 'undefined' ? window.location.hostname : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        changes,
    };
}

/**
 * Check SOAP note compliance
 */
export function checkSOAPCompliance(soap: any): ComplianceCheck {
    const requiredFields = ['subjective', 'objective', 'assessment', 'plan'];
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
        if (!soap[field] || soap[field].trim().length === 0) {
            missingFields.push(field);
        }
    });

    const criticalIssues: string[] = [];

    // Check for minimum content length
    if (soap.assessment && soap.assessment.length < 20) {
        criticalIssues.push('Assessment section is too brief');
    }

    if (soap.plan && soap.plan.length < 20) {
        criticalIssues.push('Plan section is too brief');
    }

    const complianceScore = Math.round(
        ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
    );

    const recommendations: string[] = [];
    if (missingFields.length > 0) {
        recommendations.push(`Complete missing sections: ${missingFields.join(', ')}`);
    }
    if (criticalIssues.length > 0) {
        recommendations.push('Provide more detailed clinical documentation');
    }
    if (complianceScore === 100) {
        recommendations.push('Documentation meets compliance standards');
    }

    return {
        recordId: 'soap_note',
        recordType: 'consultation',
        requiredFields,
        missingFields,
        complianceScore,
        recommendations,
        criticalIssues,
        lastChecked: new Date().toISOString(),
    };
}

/**
 * Check patient record compliance
 */
export function checkPatientCompliance(patient: any): ComplianceCheck {
    const requiredFields = ['name', 'species', 'breed', 'age', 'weight', 'owner'];
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
        if (!patient[field] || (typeof patient[field] === 'string' && patient[field].trim().length === 0)) {
            missingFields.push(field);
        }
    });

    const criticalIssues: string[] = [];

    if (!patient.owner || patient.owner.trim().length === 0) {
        criticalIssues.push('Owner information is required for legal compliance');
    }

    const complianceScore = Math.round(
        ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
    );

    const recommendations: string[] = [];
    if (missingFields.length > 0) {
        recommendations.push(`Complete required fields: ${missingFields.join(', ')}`);
    }
    if (complianceScore === 100) {
        recommendations.push('Patient record meets compliance standards');
    }

    return {
        recordId: patient.id || 'unknown',
        recordType: 'patient',
        requiredFields,
        missingFields,
        complianceScore,
        recommendations,
        criticalIssues,
        lastChecked: new Date().toISOString(),
    };
}

/**
 * Create consent record
 */
export function createConsentRecord(
    patientId: string,
    consentType: ConsentRecord['consentType'],
    procedureDescription: string,
    consentGivenBy: string,
    relationship: string
): ConsentRecord {
    return {
        id: `consent_${Date.now()}`,
        patientId,
        consentType,
        procedureDescription,
        consentGivenBy,
        relationship,
        consentDate: new Date().toISOString(),
        revoked: false,
    };
}

/**
 * Get compliance score color
 */
export function getComplianceColor(score: number): string {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
}

/**
 * Get compliance status
 */
export function getComplianceStatus(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Critical';
}
