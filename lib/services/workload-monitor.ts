import { WorkloadMetrics, BurnoutScore, BreakReminder } from '../types-addons';

/**
 * WORKLOAD MONITOR SERVICE
 * Tracks veterinarian workload and burnout risk
 * Provides wellness recommendations and break reminders
 */

/**
 * Calculate workload metrics for a user on a specific date
 */
export function calculateWorkloadMetrics(
    userId: string,
    date: string,
    consultations: any[],
    workHours: { start: string; end: string }
): WorkloadMetrics {
    const dayConsultations = consultations.filter(c =>
        c.date.startsWith(date)
    );

    // Calculate hours worked
    const start = new Date(`${date}T${workHours.start}`);
    const end = new Date(`${date}T${workHours.end}`);
    const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Count emergency cases (based on keywords in assessment)
    const emergencyCases = dayConsultations.filter(c =>
        c.soap?.assessment?.toLowerCase().includes('emergency') ||
        c.soap?.assessment?.toLowerCase().includes('urgent') ||
        c.soap?.assessment?.toLowerCase().includes('critical')
    ).length;

    // Calculate complexity score (0-100)
    const complexityScore = calculateComplexityScore(dayConsultations);

    // Detect stress indicators
    const stressIndicators = detectStressIndicators(dayConsultations, workHours);

    return {
        userId,
        date,
        consultationsCount: dayConsultations.length,
        hoursWorked,
        emergencyCases,
        complexityScore,
        breaksTaken: 0, // Would need to track this separately
        stressIndicators,
    };
}

/**
 * Calculate case complexity score
 */
function calculateComplexityScore(consultations: any[]): number {
    if (consultations.length === 0) return 0;

    let totalComplexity = 0;

    consultations.forEach(c => {
        let complexity = 30; // Base complexity

        // Longer SOAP notes = more complex
        const soapLength = (c.soap?.subjective?.length || 0) +
            (c.soap?.objective?.length || 0) +
            (c.soap?.assessment?.length || 0) +
            (c.soap?.plan?.length || 0);

        if (soapLength > 1000) complexity += 20;
        else if (soapLength > 500) complexity += 10;

        // Multiple medications = more complex
        const medCount = c.soap?.plan?.split(',').length || 0;
        complexity += Math.min(medCount * 5, 20);

        // Keywords indicating complexity
        const complexKeywords = ['surgery', 'emergency', 'critical', 'intensive', 'complicated'];
        const text = JSON.stringify(c.soap).toLowerCase();
        complexKeywords.forEach(keyword => {
            if (text.includes(keyword)) complexity += 10;
        });

        totalComplexity += Math.min(complexity, 100);
    });

    return Math.round(totalComplexity / consultations.length);
}

/**
 * Detect stress indicators
 */
function detectStressIndicators(
    consultations: any[],
    workHours: { start: string; end: string }
): WorkloadMetrics['stressIndicators'] {
    // Check for late night work (after 8 PM)
    const lateNightWork = parseInt(workHours.end.split(':')[0]) >= 20;

    // Check for weekend work
    const date = consultations[0]?.date ? new Date(consultations[0].date) : new Date();
    const weekendWork = date.getDay() === 0 || date.getDay() === 6;

    // Count rapid note edits (would need edit history)
    const rapidNoteEdits = 0;

    // Calculate consecutive days (would need historical data)
    const consecutiveDays = 1;

    return {
        rapidNoteEdits,
        lateNightWork,
        weekendWork,
        consecutiveDays,
    };
}

/**
 * Calculate burnout score based on recent workload metrics
 */
export function calculateBurnoutScore(
    userId: string,
    recentMetrics: WorkloadMetrics[]
): BurnoutScore {
    if (recentMetrics.length === 0) {
        return {
            userId,
            overall: 0,
            calculatedAt: new Date().toISOString(),
            factors: {
                workload: 0,
                caseComplexity: 0,
                workLifeBalance: 0,
                teamSupport: 50,
            },
            recommendations: ['Insufficient data to calculate burnout risk'],
            trend: 'stable',
        };
    }

    // Calculate factor scores (0-100, higher = more burnout risk)
    const workloadScore = calculateWorkloadScore(recentMetrics);
    const complexityScore = calculateAverageComplexity(recentMetrics);
    const workLifeBalanceScore = calculateWorkLifeBalanceScore(recentMetrics);
    const teamSupportScore = 50; // Would need team interaction data

    // Overall burnout score (weighted average)
    const overall = Math.round(
        workloadScore * 0.35 +
        complexityScore * 0.25 +
        workLifeBalanceScore * 0.30 +
        teamSupportScore * 0.10
    );

    // Generate recommendations
    const recommendations = generateBurnoutRecommendations({
        workload: workloadScore,
        caseComplexity: complexityScore,
        workLifeBalance: workLifeBalanceScore,
        teamSupport: teamSupportScore,
    });

    // Determine trend
    const trend = determineBurnoutTrend(recentMetrics);

    return {
        userId,
        overall,
        calculatedAt: new Date().toISOString(),
        factors: {
            workload: workloadScore,
            caseComplexity: complexityScore,
            workLifeBalance: workLifeBalanceScore,
            teamSupport: teamSupportScore,
        },
        recommendations,
        trend,
    };
}

/**
 * Calculate workload score
 */
function calculateWorkloadScore(metrics: WorkloadMetrics[]): number {
    const avgConsultations = metrics.reduce((sum, m) => sum + m.consultationsCount, 0) / metrics.length;
    const avgHours = metrics.reduce((sum, m) => sum + m.hoursWorked, 0) / metrics.length;

    // Score based on consultations per day and hours worked
    let score = 0;

    if (avgConsultations > 15) score += 40;
    else if (avgConsultations > 10) score += 25;
    else if (avgConsultations > 7) score += 15;

    if (avgHours > 10) score += 40;
    else if (avgHours > 8) score += 20;
    else if (avgHours > 6) score += 10;

    return Math.min(score, 100);
}

/**
 * Calculate average complexity
 */
function calculateAverageComplexity(metrics: WorkloadMetrics[]): number {
    return Math.round(
        metrics.reduce((sum, m) => sum + m.complexityScore, 0) / metrics.length
    );
}

/**
 * Calculate work-life balance score
 */
function calculateWorkLifeBalanceScore(metrics: WorkloadMetrics[]): number {
    let score = 0;

    const lateNightCount = metrics.filter(m => m.stressIndicators.lateNightWork).length;
    const weekendCount = metrics.filter(m => m.stressIndicators.weekendWork).length;

    score += (lateNightCount / metrics.length) * 40;
    score += (weekendCount / metrics.length) * 40;

    // Check for consecutive days
    const maxConsecutive = Math.max(...metrics.map(m => m.stressIndicators.consecutiveDays));
    if (maxConsecutive > 10) score += 20;
    else if (maxConsecutive > 7) score += 10;

    return Math.min(score, 100);
}

/**
 * Generate burnout recommendations
 */
function generateBurnoutRecommendations(factors: BurnoutScore['factors']): string[] {
    const recommendations: string[] = [];

    if (factors.workload > 70) {
        recommendations.push('Consider redistributing caseload among team members');
        recommendations.push('Schedule lighter days to recover from heavy workload');
    }

    if (factors.caseComplexity > 70) {
        recommendations.push('Seek peer consultation for complex cases');
        recommendations.push('Consider referring highly complex cases when appropriate');
    }

    if (factors.workLifeBalance > 70) {
        recommendations.push('Prioritize regular breaks during the workday');
        recommendations.push('Limit after-hours and weekend work');
        recommendations.push('Schedule time off to recharge');
    }

    if (factors.teamSupport < 40) {
        recommendations.push('Increase team communication and collaboration');
        recommendations.push('Consider team-building activities');
    }

    if (recommendations.length === 0) {
        recommendations.push('Maintain current healthy work patterns');
        recommendations.push('Continue monitoring wellbeing metrics');
    }

    return recommendations;
}

/**
 * Determine burnout trend
 */
function determineBurnoutTrend(metrics: WorkloadMetrics[]): BurnoutScore['trend'] {
    if (metrics.length < 3) return 'stable';

    const recent = metrics.slice(-3);
    const older = metrics.slice(0, -3);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, m) => sum + m.complexityScore + m.hoursWorked, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.complexityScore + m.hoursWorked, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 15) return 'worsening';
    if (change < -15) return 'improving';
    return 'stable';
}

/**
 * Generate break reminder
 */
export function generateBreakReminder(userId: string, hoursWorked: number): BreakReminder | null {
    // Suggest breaks every 2-3 hours
    if (hoursWorked % 2.5 < 0.5) {
        const types: BreakReminder['type'][] = ['hydration', 'stretch', 'mental-break'];
        const type = types[Math.floor(Math.random() * types.length)];

        const messages = {
            hydration: '💧 Time for a water break! Stay hydrated.',
            stretch: '🧘 Take a moment to stretch and move around.',
            'mental-break': '🧠 Step away for a mental reset. You\'ve earned it!',
            meal: '🍽️ Don\'t forget to eat! Your body needs fuel.',
        };

        return {
            id: `break_${Date.now()}`,
            userId,
            scheduledFor: new Date().toISOString(),
            type,
            message: messages[type],
            acknowledged: false,
        };
    }

    return null;
}

/**
 * Get burnout risk level
 */
export function getBurnoutRiskLevel(score: number): {
    level: 'low' | 'moderate' | 'high' | 'critical';
    color: string;
    message: string;
} {
    if (score >= 80) {
        return {
            level: 'critical',
            color: 'text-red-600 dark:text-red-400',
            message: 'Critical burnout risk - immediate action needed',
        };
    } else if (score >= 60) {
        return {
            level: 'high',
            color: 'text-orange-600 dark:text-orange-400',
            message: 'High burnout risk - take preventive measures',
        };
    } else if (score >= 40) {
        return {
            level: 'moderate',
            color: 'text-yellow-600 dark:text-yellow-400',
            message: 'Moderate risk - monitor and adjust workload',
        };
    } else {
        return {
            level: 'low',
            color: 'text-green-600 dark:text-green-400',
            message: 'Low burnout risk - maintain healthy patterns',
        };
    }
}
