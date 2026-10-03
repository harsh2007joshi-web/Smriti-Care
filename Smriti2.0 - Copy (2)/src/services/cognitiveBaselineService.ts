import { DifficultyProfile, UserBaselineRecord, BaselineTaskScores } from '../types/database.types';
import { dbService } from './databaseService';

export interface BaselineEvaluationInput {
  userId: string;
  taskScores: BaselineTaskScores;
}

class CognitiveBaselineService {
  private readonly VERSION = '1.0';

  /**
   * Calculates overall normalized score (0-100) and maps to DifficultyProfile.
   * 0 - 59: GENTLE
   * 60 - 89: STANDARD
   * 90 - 100: ACTIVE
   */
  calculateProfile(taskScores: BaselineTaskScores): {
    totalScore: number;
    profile: DifficultyProfile;
  } {
    const rawTotal =
      (taskScores.objectMemory || 0) +
      (taskScores.sequenceMemory || 0) +
      (taskScores.matching || 0) +
      (taskScores.shortRecall || 0) +
      (taskScores.pattern || 0);

    const totalScore = Math.max(0, Math.min(100, Math.round(rawTotal)));

    let profile: DifficultyProfile = 'STANDARD';
    if (totalScore >= 90) {
      profile = 'ACTIVE';
    } else if (totalScore <= 59) {
      profile = 'GENTLE';
    } else {
      profile = 'STANDARD';
    }

    return { totalScore, profile };
  }

  /**
   * Saves or updates a user baseline assessment record.
   * NOTE: This does NOT increment the user daily activity streak.
   */
  async completeBaseline(input: BaselineEvaluationInput): Promise<UserBaselineRecord> {
    const { totalScore, profile } = this.calculateProfile(input.taskScores);

    // Check if user already has an existing baseline record
    const existing = await dbService.getUserBaseline(input.userId);

    const baselineRecord: UserBaselineRecord = {
      id: existing?.id || crypto.randomUUID(),
      user_id: input.userId,
      baseline_score: totalScore,
      baseline_profile: profile,
      baseline_completed_at: new Date().toISOString(),
      current_difficulty: profile,
      best_difficulty: profile,
      recent_performance: existing?.recent_performance || [totalScore],
      baseline_version: this.VERSION,
      task_scores: input.taskScores,
    };

    const saved = await dbService.saveUserBaseline(baselineRecord);
    return saved;
  }

  /**
   * Retrieves baseline for a given user.
   */
  async getUserBaseline(userId: string): Promise<UserBaselineRecord | null> {
    if (!userId) return null;
    return await dbService.getUserBaseline(userId);
  }

  /**
   * Checks if user has already completed a baseline.
   */
  async hasBaseline(userId: string): Promise<boolean> {
    if (!userId) return false;
    const record = await this.getUserBaseline(userId);
    return Boolean(record && record.baseline_completed_at);
  }
}

export const cognitiveBaselineService = new CognitiveBaselineService();
