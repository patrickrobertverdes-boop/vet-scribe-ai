import { AIExplanation, AIAuditLog } from '../types-addons';

/**
 * AI EXPLAINABILITY SERVICE
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

export async function explainAIDecision(
    feature: string,
    decision: string,
    context: Record<string, any>
): Promise<AIExplanation | null> {
    const prompt = `Explain this AI decision:
Feature: ${feature}
Decision: ${decision}
Context: ${JSON.stringify(context)}
Provide reasoning factors, data points, similar cases, alternatives, confidence, dataQuality.
Return ONLY JSON: {factors:[], dataPoints:[], similarCases:[], alternatives:[], confidence:number, dataQuality:number}`;

    const text = await callGeneralAI(prompt);
    if (!text) return null;

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const data = JSON.parse(jsonMatch[0]);

        return {
            feature,
            decision,
            confidence: data.confidence || 75,
            timestamp: new Date().toISOString(),
            reasoning: {
                factors: data.factors || [],
                dataPoints: data.dataPoints || [],
                similarCases: data.similarCases || [],
            },
            alternatives: data.alternatives || [],
            modelVersion: 'gemini-1.5-flash',
            dataQuality: data.dataQuality || 80,
        };
    } catch (e) {
        return null;
    }
}

// ... (rest of helper functions remain unchanged)
export function createSimpleExplanation(feature: string, decision: string, keyFactors: string[]): AIExplanation {
    return { feature, decision, confidence: 80, timestamp: new Date().toISOString(), reasoning: { factors: keyFactors.map(f => ({ name: f, weight: 0.5, value: 'Considered', contribution: 50 })), dataPoints: keyFactors, similarCases: [] }, alternatives: [], modelVersion: 'rule-based', dataQuality: 90 };
}

export function logAIDecision(userId: string, feature: string, action: AIAuditLog['action'], suggestionDetails: string, confidence: number, userDecision?: string): AIAuditLog {
    return { id: `ai_audit_${Date.now()}`, userId, feature, action, suggestionDetails, userDecision, timestamp: new Date().toISOString(), confidence };
}

export function getConfidenceLevel(confidence: number) {
    if (confidence >= 90) return { level: 'Very High', color: 'text-green-600', description: 'AI is very confident' };
    if (confidence >= 75) return { level: 'High', color: 'text-blue-600', description: 'AI is confident' };
    if (confidence >= 60) return { level: 'Moderate', color: 'text-yellow-600', description: 'AI is moderate' };
    return { level: 'Low', color: 'text-orange-600', description: 'AI has low confidence' };
}

export function formatExplanationText(explanation: AIExplanation): string {
    return `Based on analysis, the AI determined: "${explanation.decision}"`;
}

export function shouldShowExplanation(level: string, confidence: number) { return true; }

export function getDataQualityIndicator(quality: number) {
    if (quality >= 90) return { level: 'Excellent', color: 'text-green-600', icon: '✓' };
    return { level: 'Good', color: 'text-blue-600', icon: '○' };
}
