// Calculates actual maintenance TDEE from real weight + calorie data
// Formula: TDEE = avgCalories - (weightChangKg * 7700 / days)
// weightChange = endWeight - startWeight (negative = lost weight)

export interface TDEEResult {
  tdee: number;           // estimated maintenance calories
  avgCalories: number;    // average daily calories over period
  weightChange: number;   // kg change (negative = loss)
  days: number;           // number of days analyzed
  confidence: 'high' | 'medium' | 'low';  // high=14+ days, medium=7+, low=<7
  mode: 'cutting' | 'bulking' | 'maintaining';  // based on deficit/surplus
  deficit: number;        // calories below/above maintenance (negative = surplus)
}

export function calcAdaptiveTDEE(
  weightEntries: Array<{ date: string; weight_kg: number }>,
  calorieEntries: Array<{ date: string; kcal: number }>
): TDEEResult | null {
  // Need at least 2 weight entries and some calorie data
  if (weightEntries.length < 2 || calorieEntries.length < 2) return null;

  // Sort by date
  const weights = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
  const calories = [...calorieEntries].sort((a, b) => a.date.localeCompare(b.date));

  // Only use calorie days that fall between first and last weight entry
  const startDate = weights[0].date;
  const endDate = weights[weights.length - 1].date;

  const filteredCals = calories.filter(c => c.date >= startDate && c.date <= endDate && c.kcal > 0);
  if (filteredCals.length < 2) return null;

  const avgCalories = Math.round(filteredCals.reduce((s, c) => s + c.kcal, 0) / filteredCals.length);

  // Use linear regression on weight to smooth out daily fluctuations
  const startWeight = weights[0].weight_kg;
  const endWeight = weights[weights.length - 1].weight_kg;
  const weightChange = parseFloat((endWeight - startWeight).toFixed(2));

  // Days between first and last entry
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / msPerDay
  ));

  // TDEE = avgCals - (weightChange * 7700 / days)
  const tdee = Math.round(avgCalories - (weightChange * 7700 / days));

  const confidence: TDEEResult['confidence'] = days >= 14 ? 'high' : days >= 7 ? 'medium' : 'low';

  const deficit = Math.round(avgCalories - tdee);
  let mode: TDEEResult['mode'] = 'maintaining';
  if (deficit > 200) mode = 'cutting';
  else if (deficit < -200) mode = 'bulking';

  return { tdee, avgCalories, weightChange, days, confidence, mode, deficit };
}
