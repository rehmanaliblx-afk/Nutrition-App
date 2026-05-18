/**
 * 1-Rep Max calculation utilities.
 * Uses average of Epley and Brzycki formulas for reps > 1.
 */

/**
 * Epley formula: weight * (1 + reps/30)
 */
function epley(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

/**
 * Brzycki formula: weight * 36 / (37 - reps)
 * Valid for reps < 37 (practically < 15).
 */
function brzycki(weightKg: number, reps: number): number {
  if (reps >= 37) return epley(weightKg, reps);
  return weightKg * (36 / (37 - reps));
}

/**
 * Calculate estimated 1-Rep Max.
 * For reps === 1, returns the weight directly.
 * For reps > 1, averages Epley and Brzycki formulas.
 */
export function calcOneRM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return (epley(weightKg, reps) + brzycki(weightKg, reps)) / 2;
}

/**
 * Calculate the weight to use for a given target rep count based on a known 1RM.
 * Uses the inverse Epley formula: w = oneRM / (1 + targetReps/30)
 */
export function weightForReps(oneRM: number, targetReps: number): number {
  if (targetReps <= 1) return oneRM;
  return oneRM / (1 + targetReps / 30);
}

/**
 * Standard 1RM percentage table for reps 1–12.
 * Values represent the percentage of 1RM typically achievable for that rep count.
 */
export const ONE_RM_PERCENTAGES: Record<number, number> = {
  1: 1.0,
  2: 0.97,
  3: 0.94,
  4: 0.91,
  5: 0.87,
  6: 0.85,
  7: 0.83,
  8: 0.80,
  9: 0.77,
  10: 0.75,
  11: 0.73,
  12: 0.70,
};
