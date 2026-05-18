export type Goal = 'cut' | 'maintain' | 'bulk' | 'recomp';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Sex = 'male' | 'female';

export interface MacroRecommendation {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  notes: string;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little or no exercise)',
  light: 'Lightly Active (1-3 days/week)',
  moderate: 'Moderately Active (3-5 days/week)',
  active: 'Very Active (6-7 days/week)',
  very_active: 'Extra Active (physical job or 2x/day)',
};

export const GOAL_LABELS: Record<Goal, string> = {
  cut: 'Cut (lose fat)',
  maintain: 'Maintain weight',
  bulk: 'Bulk (build muscle)',
  recomp: 'Recomposition (lose fat, gain muscle)',
};

/**
 * Mifflin-St Jeor BMR formula.
 * Male:   10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 * Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 */
export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Total Daily Energy Expenditure via Harris-Benedict activity multipliers.
 */
export function calcTDEE(bmr: number, level: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[level];
}

/**
 * Build a full macro recommendation based on personal stats, activity level, and goal.
 *
 * Calorie adjustments:
 *   cut:      -400 kcal deficit
 *   bulk:     +250 kcal surplus
 *   maintain: no adjustment
 *   recomp:   -200 kcal slight deficit
 *
 * Protein targets (g/kg bodyweight):
 *   cut:      2.2 g/kg (high to preserve muscle)
 *   bulk:     1.8 g/kg
 *   maintain: 1.6 g/kg
 *   recomp:   2.0 g/kg
 *
 * Fat: 30% of target kcal
 * Carbs: remainder after protein + fat
 */
export function getRecommendation(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  level: ActivityLevel,
  goal: Goal
): MacroRecommendation {
  const bmr = calcBMR(weightKg, heightCm, age, sex);
  const tdee = calcTDEE(bmr, level);

  const KCAL_ADJUSTMENTS: Record<Goal, number> = {
    cut: -400,
    bulk: 250,
    maintain: 0,
    recomp: -200,
  };

  const PROTEIN_PER_KG: Record<Goal, number> = {
    cut: 2.2,
    bulk: 1.8,
    maintain: 1.6,
    recomp: 2.0,
  };

  const GOAL_NOTES: Record<Goal, string> = {
    cut: 'In a 400 kcal deficit. High protein to preserve lean mass. Keep fat ≥ 0.5 g/kg for hormonal health.',
    bulk: 'In a 250 kcal surplus. Prioritise progressive overload. Track strength gains weekly.',
    maintain: 'Calories matched to TDEE. Adjust ±100 kcal based on weekly weight trend.',
    recomp: 'Slight 200 kcal deficit. Requires consistent training stimulus. Progress is slower but sustainable.',
  };

  const targetKcal = Math.round(tdee + KCAL_ADJUSTMENTS[goal]);
  const proteinG = Math.round(PROTEIN_PER_KG[goal] * weightKg);
  const fatG = Math.round((targetKcal * 0.3) / 9);
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const carbsKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
  const carbsG = Math.round(carbsKcal / 4);

  const totalKcal = proteinKcal + fatKcal + carbsG * 4;
  const proteinPct = Math.round((proteinKcal / totalKcal) * 100);
  const fatPct = Math.round((fatKcal / totalKcal) * 100);
  const carbsPct = 100 - proteinPct - fatPct;

  return {
    kcal: targetKcal,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
    proteinPct,
    carbsPct,
    fatPct,
    notes: GOAL_NOTES[goal],
  };
}
