/**
 * Streak calculation utilities for workout/activity date arrays.
 */

/**
 * Format a Date object as a YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date as a YYYY-MM-DD string.
 */
export function getTodayStr(): string {
  return formatDate(new Date());
}

/**
 * Returns true if the given YYYY-MM-DD string is today.
 */
export function isToday(date: string): boolean {
  return date === getTodayStr();
}

/**
 * Normalise an array of YYYY-MM-DD date strings to a deduplicated, ascending Set.
 */
function toAscendingSet(dates: string[]): string[] {
  return Array.from(new Set(dates)).sort();
}

/**
 * Calculate the current streak — the number of consecutive days ending on today or yesterday.
 * The input array may be in any order and may contain duplicates.
 */
export function calcCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = toAscendingSet(dates);
  const today = getTodayStr();

  // If neither today nor yesterday is in the set, streak is 0.
  const yesterday = formatDate(new Date(Date.now() - 86_400_000));
  if (!sorted.includes(today) && !sorted.includes(yesterday)) return 0;

  // Walk backwards from the most recent date.
  let streak = 0;
  let cursor = sorted.includes(today) ? today : yesterday;

  while (sorted.includes(cursor)) {
    streak++;
    // Move cursor one day back.
    const [y, m, d] = cursor.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    cursor = formatDate(prev);
  }

  return streak;
}

/**
 * Calculate the longest streak of consecutive days in the provided array.
 * The input array may be in any order and may contain duplicates.
 */
export function calcLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = toAscendingSet(dates);
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const [py, pm, pd] = sorted[i - 1].split('-').map(Number);
    const prev = new Date(py, pm - 1, pd);
    const expectedNext = formatDate(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));

    if (sorted[i] === expectedNext) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}
