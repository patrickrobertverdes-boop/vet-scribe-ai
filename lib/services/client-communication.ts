import {
    ClientCommunication,
    EducationalResource,
    CommunicationType,
} from '../types-addons';
import { Patient, SoapNote } from '../types';

/**
 * CLIENT COMMUNICATION SERVICE
 * Uses secure server-side API
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
        return null;
    }
}

export async function generateClientSummary(
    patient: Patient,
    soap: SoapNote
): Promise<string> {
    const prompt = `Create a clear, compassionate summary for a pet owner:
Patient: ${patient.name}
Assessment: ${soap.assessment}
Plan: ${soap.plan}
Write in simple, non-technical language. Under 200 words.`;

    const text = await callGeneralAI(prompt);
    return text || '';
}

export async function generateEducationalContent(
    condition: string,
    species: string
): Promise<EducationalResource | null> {
    const prompt = `Create educational content for owners about ${condition} in ${species}.
Include: explanation, symptoms, treatment, home care, when to seek help. 300 words.`;

    const text = await callGeneralAI(prompt);
    if (!text) return null;

    return {
        id: `edu_${Date.now()}`,
        title: `Understanding ${condition} in ${species}s`,
        category: 'condition-guide',
        species: [species as any],
        content: text,
        summary: text.substring(0, 150) + '...',
        readingTime: 3,
        tags: [condition.toLowerCase()],
        aiPersonalized: true,
    };
}

export function scheduleClientCommunication(
    patientId: string,
    ownerName: string,
    ownerContact: string,
    type: CommunicationType,
    scheduledFor: Date,
    content: string
): ClientCommunication {
    return {
        id: `comm_${Date.now()}`,
        patientId, ownerName, ownerContact, type,
        channel: ownerContact.includes('@') ? 'email' : 'sms',
        status: 'pending',
        scheduledFor: scheduledFor.toISOString(),
        subject: 'Message from Your Veterinarian',
        content,
        aiGenerated: true,
    };
}

export function generateAppointmentReminder(patientName: string, date: string, time: string): string {
    return `Reminder: ${patientName} has an appointment on ${date} at ${time}.`;
}

export function generateMedicationReminder(patientName: string, medication: string, days: number): string {
    return `${patientName}'s ${medication} will run out in ${days} days.`;
}
