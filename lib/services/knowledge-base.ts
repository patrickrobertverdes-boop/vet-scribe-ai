import { CaseStudy, ProcedureGuide, TrainingProgress } from '../types-addons';

/**
 * KNOWLEDGE BASE SERVICE
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

export async function generateCaseStudy(
    consultation: any,
    patient: any
): Promise<CaseStudy | null> {
    const prompt = `Create a case study from:
Species: ${patient.species}
Breed: ${patient.breed}
Age: ${patient.age}
Subjective: ${consultation.soap?.subjective}
Objective: ${consultation.soap?.objective}
Assessment: ${consultation.soap?.assessment}
Plan: ${consultation.soap?.plan}
Provide title, chiefComplaint, presentation, diagnosticFindings, diagnosis, treatment, learningPoints, difficulty.
Return ONLY JSON.`;

    const text = await callGeneralAI(prompt);
    if (!text) return null;

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const data = JSON.parse(jsonMatch[0]);

        return {
            id: `case_${Date.now()}`,
            title: data.title || 'Untitled Case',
            species: patient.species,
            breed: patient.breed,
            age: patient.age,
            condition: data.diagnosis || '',
            chiefComplaint: data.chiefComplaint || '',
            presentation: data.presentation || '',
            diagnosticFindings: data.diagnosticFindings || '',
            diagnosis: data.diagnosis || '',
            treatment: data.treatment || '',
            outcome: 'resolved',
            outcomeDetails: '',
            learningPoints: data.learningPoints || [],
            anonymized: true,
            tags: [patient.species.toLowerCase()],
            difficulty: data.difficulty || 'intermediate',
            createdBy: 'AI',
            createdAt: new Date().toISOString(),
            viewCount: 0,
        };
    } catch (e) {
        return null;
    }
}

// ... logic only helpers remain as they were
export function searchCaseStudies(cases: CaseStudy[], query: string) {
    const q = query.toLowerCase();
    return cases.filter(c => c.title.toLowerCase().includes(q) || c.condition.toLowerCase().includes(q));
}

export function getRecommendedCases(allCases: CaseStudy[], userProgress: TrainingProgress) {
    return allCases.filter(c => !userProgress.completedCases.includes(c.id)).slice(0, 5);
}

export function updateTrainingProgress(progress: TrainingProgress, caseId: string, score?: number) {
    const updated = { ...progress };
    if (!updated.completedCases.includes(caseId)) updated.completedCases.push(caseId);
    if (score !== undefined) updated.quizScores[caseId] = score;
    updated.lastUpdated = new Date().toISOString();
    return updated;
}

export function calculateSkillLevel(completedCases: number, averageQuizScore: number) {
    if (completedCases < 5) return 'novice';
    return 'competent';
}

export function createProcedureGuide(name: string, category: ProcedureGuide['category']): Partial<ProcedureGuide> {
    return { procedureName: name, category, steps: [] };
}
