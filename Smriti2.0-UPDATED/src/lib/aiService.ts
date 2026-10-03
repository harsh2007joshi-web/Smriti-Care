// AI Recommendation & Caregiver Explanation Service
// Uses Supabase Edge Function with Google Gemini API when configured,
// with robust local rule-based fallback so the app is always fully functional.

export interface CaregiverAiSummary {
  source: 'gemini-ai' | 'rule-based-engine';
  summary: string;
  recommendation: string;
  disclaimer: string;
}

export async function fetchCaregiverInsights(
  patientName: string,
  activitiesCount: number,
  avgAccuracy: number,
  supabaseUrl?: string,
  supabaseAnonKey?: string
): Promise<CaregiverAiSummary> {
  // If Supabase edge function URL is available, invoke it
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/gemini-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          patientName,
          completedActivities: activitiesCount,
          accuracyAvg: avgAccuracy,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          source: data.source || 'gemini-ai',
          summary: data.summary,
          recommendation: data.recommendation,
          disclaimer: data.disclaimer || 'This observation supports wellness tracking and is not a medical diagnosis.',
        };
      }
    } catch {
      // Fall through to rule-based fallback
    }
  }

  // Robust, empathetic rule-based engine
  let summary = `${patientName} completed ${activitiesCount} gentle cognitive exercises this week with a steady accuracy of ${avgAccuracy}%. Daily routine and memory connections were completed with high comfort.`;
  let recommendation = 'Recommended next activity: Daily Routine Builder or a peaceful walk in the Memory Garden.';

  if (avgAccuracy >= 90) {
    summary = `${patientName} showed excellent comfort and joyful recall across recent sessions (${activitiesCount} completed). Visual and audio recognition have been consistently strong.`;
    recommendation = 'Suggested activity: Living Market Mission or Sensory Soundscape.';
  } else if (activitiesCount <= 1) {
    summary = `${patientName} started their first activity of the week. Gentle encouragement and short 3-minute sessions are ideal.`;
    recommendation = 'Suggested activity: Memory Weave or watering the Memory Garden.';
  }

  return {
    source: 'rule-based-engine',
    summary,
    recommendation,
    disclaimer: 'This observation supports cognitive wellness tracking and is not a medical diagnosis.',
  };
}
