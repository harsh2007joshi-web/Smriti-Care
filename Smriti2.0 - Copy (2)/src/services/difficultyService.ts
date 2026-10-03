import { DifficultyProfile } from '../types/database.types';

export interface GameDifficultyConfig {
  memoryWeave: {
    pairsCount: number;
    hintsAllowed: number;
    timePerSetSeconds: number;
    supportiveDescriptions: boolean;
  };
  dailyRoutine: {
    stepsCount: number;
    hintAvailable: boolean;
    stepPromptAssistance: boolean;
  };
  sensorySoundscape: {
    optionsCount: number;
    soundDurationSeconds: number;
    allowUnlimitedReplay: boolean;
    hintAssistance: boolean;
  };
  rhythmWeaver: {
    patternLength: number;
    beatDurationMs: number;
    toleranceMs: number;
  };
  dualTask: {
    totalSteps: number;
    intervalMs: number;
    promptWindowMs: number;
    chimeCount: number;
  };
  livingMarket: {
    shoppingItemsCount: number;
    distractorsCount: number;
    allowSubstitutions: boolean;
  };
  landmarkPathfinder: {
    landmarksCount: number;
    directPathHint: boolean;
    gridSize: number;
  };
  cognitiveMiniTest: {
    questionCount: number;
    optionsPerQuestion: number;
  };
}

export const DIFFICULTY_CONFIG: Record<DifficultyProfile, GameDifficultyConfig> = {
  GENTLE: {
    memoryWeave: {
      pairsCount: 2, // 2 pairs (4 cards)
      hintsAllowed: 3,
      timePerSetSeconds: 45,
      supportiveDescriptions: true,
    },
    dailyRoutine: {
      stepsCount: 3,
      hintAvailable: true,
      stepPromptAssistance: true,
    },
    sensorySoundscape: {
      optionsCount: 2, // 1 correct + 1 distractor
      soundDurationSeconds: 4.0,
      allowUnlimitedReplay: true,
      hintAssistance: true,
    },
    rhythmWeaver: {
      patternLength: 3,
      beatDurationMs: 800,
      toleranceMs: 600,
    },
    dualTask: {
      totalSteps: 6,
      intervalMs: 3000,
      promptWindowMs: 3200,
      chimeCount: 2,
    },
    livingMarket: {
      shoppingItemsCount: 2,
      distractorsCount: 2,
      allowSubstitutions: true,
    },
    landmarkPathfinder: {
      landmarksCount: 2,
      directPathHint: true,
      gridSize: 3,
    },
    cognitiveMiniTest: {
      questionCount: 3,
      optionsPerQuestion: 2,
    },
  },

  STANDARD: {
    memoryWeave: {
      pairsCount: 3, // 3 pairs (6 cards)
      hintsAllowed: 2,
      timePerSetSeconds: 35,
      supportiveDescriptions: true,
    },
    dailyRoutine: {
      stepsCount: 4,
      hintAvailable: true,
      stepPromptAssistance: false,
    },
    sensorySoundscape: {
      optionsCount: 3, // 1 correct + 2 distractors
      soundDurationSeconds: 3.5,
      allowUnlimitedReplay: true,
      hintAssistance: true,
    },
    rhythmWeaver: {
      patternLength: 4,
      beatDurationMs: 650,
      toleranceMs: 450,
    },
    dualTask: {
      totalSteps: 8,
      intervalMs: 2200,
      promptWindowMs: 2000,
      chimeCount: 3,
    },
    livingMarket: {
      shoppingItemsCount: 3,
      distractorsCount: 3,
      allowSubstitutions: true,
    },
    landmarkPathfinder: {
      landmarksCount: 3,
      directPathHint: false,
      gridSize: 4,
    },
    cognitiveMiniTest: {
      questionCount: 4,
      optionsPerQuestion: 3,
    },
  },

  ACTIVE: {
    memoryWeave: {
      pairsCount: 4, // 4 pairs (8 cards)
      hintsAllowed: 1,
      timePerSetSeconds: 25,
      supportiveDescriptions: false,
    },
    dailyRoutine: {
      stepsCount: 5,
      hintAvailable: true,
      stepPromptAssistance: false,
    },
    sensorySoundscape: {
      optionsCount: 4, // 1 correct + 3 distractors
      soundDurationSeconds: 2.8,
      allowUnlimitedReplay: true,
      hintAssistance: false,
    },
    rhythmWeaver: {
      patternLength: 5,
      beatDurationMs: 500,
      toleranceMs: 350,
    },
    dualTask: {
      totalSteps: 10,
      intervalMs: 1800,
      promptWindowMs: 1400,
      chimeCount: 4,
    },
    livingMarket: {
      shoppingItemsCount: 4,
      distractorsCount: 4,
      allowSubstitutions: true,
    },
    landmarkPathfinder: {
      landmarksCount: 4,
      directPathHint: false,
      gridSize: 4,
    },
    cognitiveMiniTest: {
      questionCount: 5,
      optionsPerQuestion: 3,
    },
  },
};

export function getDifficultyConfig(profile?: DifficultyProfile): GameDifficultyConfig {
  const safeProfile = profile && DIFFICULTY_CONFIG[profile] ? profile : 'STANDARD';
  return DIFFICULTY_CONFIG[safeProfile];
}

/**
 * Adaptive Difficulty Progression Engine
 * Evaluates rolling performance across the last 3-5 completed activities.
 * Never punishes user for single mistakes.
 */
export function evaluateAdaptiveDifficulty(
  currentDifficulty: DifficultyProfile,
  recentAccuracies: number[]
): {
  newDifficulty: DifficultyProfile;
  changed: boolean;
  averageAccuracy: number;
  reason: string;
} {
  const cleanList = (recentAccuracies || []).filter((n) => typeof n === 'number' && !isNaN(n));
  if (cleanList.length < 3) {
    // Need at least 3 completed activities to evaluate a trend
    return {
      newDifficulty: currentDifficulty,
      changed: false,
      averageAccuracy: cleanList.length > 0 ? Math.round(cleanList.reduce((a, b) => a + b, 0) / cleanList.length) : 80,
      reason: 'Collecting session history for personalized comfort.',
    };
  }

  const sample = cleanList.slice(0, 5);
  const avg = Math.round(sample.reduce((a, b) => a + b, 0) / sample.length);

  // Progressive gentle transitions
  if (avg < 45) {
    if (currentDifficulty === 'ACTIVE') {
      return {
        newDifficulty: 'STANDARD',
        changed: true,
        averageAccuracy: avg,
        reason: 'Adjusted to Standard rhythm to provide more comfortable pacing.',
      };
    } else if (currentDifficulty === 'STANDARD') {
      return {
        newDifficulty: 'GENTLE',
        changed: true,
        averageAccuracy: avg,
        reason: 'Adjusted to Gentle mode with extra hints and soothing pacing.',
      };
    }
  } else if (avg > 85) {
    if (currentDifficulty === 'GENTLE') {
      return {
        newDifficulty: 'STANDARD',
        changed: true,
        averageAccuracy: avg,
        reason: 'Upgraded to Standard level following great consistency.',
      };
    } else if (currentDifficulty === 'STANDARD' && sample.length >= 4) {
      return {
        newDifficulty: 'ACTIVE',
        changed: true,
        averageAccuracy: avg,
        reason: 'Upgraded to Active level following outstanding performance.',
      };
    }
  }

  return {
    newDifficulty: currentDifficulty,
    changed: false,
    averageAccuracy: avg,
    reason: 'Activity level is steady and well-balanced.',
  };
}

export function getDifficultyMeta(profile?: DifficultyProfile) {
  const p = profile || 'STANDARD';
  switch (p) {
    case 'GENTLE':
      return {
        profile: 'GENTLE' as DifficultyProfile,
        label: 'Gentle Support',
        shortLabel: 'Gentle',
        icon: '🌱',
        badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-400',
        cardBg: 'bg-emerald-50/80 border-emerald-400',
        headline: '🌱 Comfortable Pace',
        description: 'Activities personalized with extra visual cues, gentle time limits, and reassuring hints.',
      };
    case 'ACTIVE':
      return {
        profile: 'ACTIVE' as DifficultyProfile,
        label: 'Active Challenge',
        shortLabel: 'Active',
        icon: '⚡',
        badgeColor: 'bg-indigo-100 text-indigo-950 border-indigo-400',
        cardBg: 'bg-indigo-50/80 border-indigo-400',
        headline: '⚡ Active Engagement',
        description: 'Activities feature enriching memory connections and independent cognitive tasks.',
      };
    case 'STANDARD':
    default:
      return {
        profile: 'STANDARD' as DifficultyProfile,
        label: 'Standard Rhythm',
        shortLabel: 'Standard',
        icon: '🌿',
        badgeColor: 'bg-amber-100 text-amber-950 border-amber-400',
        cardBg: 'bg-amber-50/80 border-amber-400',
        headline: '🌿 Balanced Comfort',
        description: 'Activities offer a balanced combination of comforting structure and engaging tasks.',
      };
  }
}
