import {
    ClinicalAlert,
    DifferentialDiagnosis,
    DrugInteraction,
    AlertSeverity,
} from '../types-addons';
import { SoapNote, Patient } from '../types';

/**
 * CLINICAL INTELLIGENCE SERVICE
 * Uses secure server-side API for clinical decision support
 */

async function callGeneralAI(prompt: string): Promise<string | null> {
    try {
        const response = await fetch('/api/ai/general', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.text;
    } catch (e) {
        console.error('Error calling General AI:', e);
        return null;
    }
}

export async function generateClinicalAlerts(
    patient: Patient,
    soap: SoapNote,
    medications: string[]
): Promise<ClinicalAlert[]> {
    const prompt = `You are a veterinary clinical decision support system. Analyze the following data:
Patient: ${patient.name} (${patient.species}, ${patient.breed}, ${patient.age} years)
Allergies: ${patient.allergies?.join(', ') || 'None'}
Medications: ${medications.join(', ') || 'None'}
SOAP: ${JSON.stringify(soap)}
Identify any drug interactions, critical values, or serious patterns.
Return a JSON array of alerts with: type, severity, message, recommendation, confidence (0-100).
Return ONLY valid JSON array.`;

    const text = await callGeneralAI(prompt);
    if (!text) return [];

    try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];
        const alerts = JSON.parse(jsonMatch[0]);
        return alerts.map((alert: any, index: number) => ({
            id: `alert_${Date.now()}_${index}`,
            patientId: patient.id,
            type: alert.type || 'pattern-detected',
            severity: alert.severity || 'medium',
            message: alert.message || '',
            recommendation: alert.recommendation || '',
            aiConfidence: alert.confidence || 75,
            createdAt: new Date().toISOString(),
            dismissed: false,
        }));
    } catch (e) {
        return [];
    }
}

export async function generateDifferentialDiagnosis(
    species: string,
    symptoms: string,
    findings: string
): Promise<DifferentialDiagnosis[]> {
    const prompt = `Generate top 5 likely conditions for:
Species: ${species}
Symptoms: ${symptoms}
Findings: ${findings}
Include: condition, probability (0-100), evidence, recommended tests, urgency.
Return ONLY valid JSON array.`;

    const text = await callGeneralAI(prompt);
    if (!text) return [];

    try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
        return [];
    }
}

export async function checkDrugInteractions(
    medications: string[]
): Promise<DrugInteraction[]> {
    if (medications.length < 2) return [];
    const prompt = `Check for drug interactions between: ${medications.join(', ')}.
Return items with: drug1, drug2, severity, description, recommendation.
Return ONLY valid JSON array. If none, return empty array [].`;

    const text = await callGeneralAI(prompt);
    if (!text) return [];

    try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
        return [];
    }
}

export async function analyzePatternHistory(
    patient: Patient,
    consultations: any[]
): Promise<string[]> {
    if (consultations.length === 0) return [];
    const prompt = `Analyze history patterns for ${patient.name} (${patient.species}):
${consultations.slice(-5).map(c => `${c.date}: ${c.soap?.assessment}`).join('\n')}
Return array of concise pattern observations. Return ONLY JSON array of strings.`;

    const text = await callGeneralAI(prompt);
    if (!text) return [];

    try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
        return [];
    }
}

export function getAlertSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
        case 'critical': return 'text-red-600 bg-red-50';
        case 'high': return 'text-orange-600 bg-orange-50';
        case 'medium': return 'text-yellow-600 bg-yellow-50';
        case 'low': return 'text-blue-600 bg-blue-50';
        default: return 'text-gray-600 bg-gray-50';
    }
}

export function getAlertSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
        case 'critical': return '🚨';
        case 'high': return '⚠️';
        case 'medium': return '⚡';
        case 'low': return 'ℹ️';
        default: return '📋';
    }
}
