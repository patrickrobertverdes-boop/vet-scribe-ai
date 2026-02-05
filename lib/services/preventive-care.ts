import {
    VaccinationRecord,
    PreventiveCareTask,
    HealthRiskProfile,
    TaskPriority,
} from '../types-addons';
import { Patient } from '../types';

/**
 * PREVENTIVE CARE SERVICE
 * Uses secure server-side AI
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

export async function generatePreventiveCareRecommendations(
    patient: Patient,
    vaccinations: VaccinationRecord[]
): Promise<PreventiveCareTask[]> {
    const tasks: PreventiveCareTask[] = [];
    tasks.push(...checkVaccinationStatus(patient, vaccinations));
    tasks.push(...getAgeBasedRecommendations(patient));
    tasks.push(...getSpeciesRecommendations(patient));
    return tasks;
}

function checkVaccinationStatus(patient: Patient, vaccinations: VaccinationRecord[]): PreventiveCareTask[] {
    const tasks: PreventiveCareTask[] = [];
    const today = new Date();
    vaccinations.forEach(vac => {
        const dueDate = new Date(vac.nextDueDate);
        const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let priority: TaskPriority = 'routine';
        if (daysUntilDue < 0) priority = 'overdue';
        else if (daysUntilDue < 14) priority = 'due-soon';
        if (priority !== 'routine') {
            tasks.push({
                id: `vac_${vac.id}`, patientId: patient.id, taskType: 'vaccination',
                description: `${vac.vaccine} vaccination ${priority}`,
                dueDate: vac.nextDueDate, priority, aiRecommended: false, reasoning: 'Schedule', completed: false
            });
        }
    });
    return tasks;
}

function getAgeBasedRecommendations(patient: Patient): PreventiveCareTask[] {
    const tasks: PreventiveCareTask[] = [];
    if (patient.age >= 7) {
        tasks.push({ id: `senior_${patient.id}`, patientId: patient.id, taskType: 'senior-screening', description: 'Senior wellness exam', dueDate: new Date().toISOString(), priority: 'routine', aiRecommended: true, reasoning: 'Age based', completed: false });
    }
    return tasks;
}

function getSpeciesRecommendations(patient: Patient): PreventiveCareTask[] {
    return [{ id: `parasite_${patient.id}`, patientId: patient.id, taskType: 'parasite-prevention', description: 'Monthly prevention', dueDate: new Date().toISOString(), priority: 'routine', aiRecommended: true, reasoning: 'Standard care', completed: false }];
}

export async function generateHealthRiskProfile(
    patient: Patient,
    consultationHistory: any[]
): Promise<HealthRiskProfile | null> {
    const prompt = `Analyze health risks for:
${patient.name} (${patient.species}, ${patient.age}y)
History: ${consultationHistory.slice(-5).map(c => c.soap?.assessment).join('\n')}
Return JSON with risks array (condition, probability, factors, measures, recommendations) and lifestageConsiderations.
Return ONLY JSON.`;

    const text = await callGeneralAI(prompt);
    if (!text) return null;

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const data = JSON.parse(jsonMatch[0]);

        return {
            patientId: patient.id,
            lastUpdated: new Date().toISOString(),
            overallRiskScore: 70,
            risks: data.risks || [],
            lifestageConsiderations: data.lifestageConsiderations || [],
        };
    } catch (e) {
        return null;
    }
}

export function getPriorityColor(priority: TaskPriority) {
    if (priority === 'overdue' || priority === 'critical') return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
}
