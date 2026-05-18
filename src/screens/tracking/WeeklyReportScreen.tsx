import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Surface, useTheme, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { NutritionStackParamList } from '@/navigation/types';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { calcCurrentStreak } from '@/utils/streakCalc';
import { getMealEntriesForDate } from '@/db/trackingDao';
import { getDatabase } from '@/db/database';
import { addDays, formatDateDisplay } from '@/utils/dateUtils';

type Props = NativeStackScreenProps<NutritionStackParamList, 'WeeklyReport'>;

// Returns the Monday of the week containing the given date string
function getMondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface DayNutrition {
  date: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  hasEntries: boolean;
}

interface WeekWorkoutData {
  sessions: number;
  totalSets: number;
  muscleGroups: string[];
}

const BAR_W = 32;
const BAR_H = 80;
const BAR_GAP = 6;
const CHART_W = 7 * (BAR_W + BAR_GAP) - BAR_GAP;
const CHART_H = BAR_H + 28;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyReportScreen({ navigation }: Props) {
  const theme = useTheme();

  const [weekStart, setWeekStart] = useState(() => getMondayOf(todayStr()));
  const [nutritionData, setNutritionData] = useState<DayNutrition[]>([]);
  const [workoutData, setWorkoutData] = useState<WeekWorkoutData>({ sessions: 0, totalSets: 0, muscleGroups: [] });
  const [loading, setLoading] = useState(false);

  const { goal, load: loadGoal } = useGoals();
  const { sessions, activeDates, load: loadSessions } = useWorkoutSession();

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekEnd = weekDates[6];

  // Load goal for mid-week
  useEffect(() => {
    loadGoal(weekDates[3]);
  }, [weekDates, loadGoal]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadNutrition = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDatabase();
      // Get kcal for each day by pulling entry counts and macros
      const results: DayNutrition[] = [];
      for (const date of weekDates) {
        const rows = await db.getAllAsync<{
          food_type: string;
          food_id: number;
          grams: number;
        }>('SELECT food_type, food_id, grams FROM meal_entries WHERE date = ?', [date]);

        if (rows.length === 0) {
          results.push({ date, kcal: 0, protein: 0, carbs: 0, fat: 0, hasEntries: false });
          continue;
        }

        // Simple kcal estimate: fetch ingredients/recipes and calculate
        let totalKcal = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        for (const row of rows) {
          if (row.food_type === 'ingredient' && row.food_id > 0) {
            const ing = await db.getFirstAsync<{
              protein: number; carbs_total: number; fat_total: number;
            }>('SELECT protein, carbs_total, fat_total FROM ingredients WHERE id = ?', [row.food_id]);
            if (ing) {
              const scale = row.grams / 100;
              totalProtein += ing.protein * scale;
              totalCarbs += ing.carbs_total * scale;
              totalFat += ing.fat_total * scale;
              totalKcal += (ing.protein * 4 + ing.carbs_total * 4 + ing.fat_total * 9) * scale;
            }
          }
        }

        results.push({
          date,
          kcal: Math.round(totalKcal),
          protein: Math.round(totalProtein),
          carbs: Math.round(totalCarbs),
          fat: Math.round(totalFat),
          hasEntries: rows.length > 0,
        });
      }
      setNutritionData(results);
    } finally {
      setLoading(false);
    }
  }, [weekDates]);

  const loadWorkoutData = useCallback(async () => {
    try {
      const db = getDatabase();
      // Sessions in this week
      const sessionRows = await db.getAllAsync<{ id: number; total_sets: number }>(
        `SELECT id, total_sets FROM workout_sessions
         WHERE substr(started_at,1,10) >= ? AND substr(started_at,1,10) <= ? AND ended_at IS NOT NULL`,
        [weekStart, weekEnd]
      );
      const sessionIds = sessionRows.map((s) => s.id);
      const totalSets = sessionRows.reduce((acc, s) => acc + (s.total_sets || 0), 0);

      let muscleGroups: string[] = [];
      if (sessionIds.length > 0) {
        const placeholders = sessionIds.map(() => '?').join(',');
        const muscleRows = await db.getAllAsync<{ exercise_name: string }>(
          `SELECT DISTINCT exercise_name FROM workout_session_sets WHERE session_id IN (${placeholders})`,
          sessionIds
        );
        muscleGroups = muscleRows.map((r) => r.exercise_name).slice(0, 10);
      }

      setWorkoutData({ sessions: sessionRows.length, totalSets, muscleGroups });
    } catch (_) {
      // ignore
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    loadNutrition();
    loadWorkoutData();
  }, [loadNutrition, loadWorkoutData]);

  const streak = useMemo(() => calcCurrentStreak(activeDates), [activeDates]);

  const kcalGoal = goal?.kcal_goal ?? null;

  const avgKcal = nutritionData.length > 0
    ? Math.round(nutritionData.filter((d) => d.hasEntries).reduce((s, d) => s + d.kcal, 0) /
      Math.max(1, nutritionData.filter((d) => d.hasEntries).length))
    : 0;

  const avgProtein = nutritionData.length > 0
    ? Math.round(nutritionData.filter((d) => d.hasEntries).reduce((s, d) => s + d.protein, 0) /
      Math.max(1, nutritionData.filter((d) => d.hasEntries).length))
    : 0;
  const avgCarbs = nutritionData.length > 0
    ? Math.round(nutritionData.filter((d) => d.hasEntries).reduce((s, d) => s + d.carbs, 0) /
      Math.max(1, nutritionData.filter((d) => d.hasEntries).length))
    : 0;
  const avgFat = nutritionData.length > 0
    ? Math.round(nutritionData.filter((d) => d.hasEntries).reduce((s, d) => s + d.fat, 0) /
      Math.max(1, nutritionData.filter((d) => d.hasEntries).length))
    : 0;

  const daysLogged = nutritionData.filter((d) => d.hasEntries).length;
  const daysHitGoal = kcalGoal
    ? nutritionData.filter((d) => d.hasEntries && d.kcal >= kcalGoal * 0.9 && d.kcal <= kcalGoal * 1.1).length
    : 0;
  const adherencePct = Math.round((daysLogged / 7) * 100);

  const maxKcal = Math.max(...nutritionData.map((d) => d.kcal), kcalGoal ?? 1, 1);

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => {
    const next = addDays(weekStart, 7);
    if (next <= todayStr()) setWeekStart(next);
  };

  const isCurrentWeek = weekStart === getMondayOf(todayStr());

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.appBar}>
          <IconButton
            icon="arrow-left"
            iconColor="#fff"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          />
          <Text variant="titleLarge" style={styles.appBarTitle}>Weekly Report</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Week selector */}
        <Surface style={styles.weekSelector} elevation={1}>
          <IconButton icon="chevron-left" size={22} onPress={prevWeek} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="titleSmall" style={styles.weekLabel}>
              {formatDateDisplay(weekStart)} – {formatDateDisplay(weekEnd)}
            </Text>
            {isCurrentWeek && <Text style={styles.currentWeekBadge}>This week</Text>}
          </View>
          <IconButton icon="chevron-right" size={22} onPress={nextWeek} disabled={isCurrentWeek} />
        </Surface>

        {loading && <ActivityIndicator style={{ marginVertical: 16 }} />}

        {/* Nutrition Section */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Nutrition</Text>
          <Divider style={styles.divider} />

          {/* 7 Bar Chart */}
          <View style={styles.chartContainer}>
            <Svg width={CHART_W} height={CHART_H}>
              {nutritionData.map((day, i) => {
                const barH = day.kcal > 0 ? Math.max(4, (day.kcal / maxKcal) * BAR_H) : 0;
                const goalH = kcalGoal ? Math.max(2, (kcalGoal / maxKcal) * BAR_H) : null;
                const goalHit = kcalGoal
                  ? day.kcal >= kcalGoal * 0.9 && day.kcal <= kcalGoal * 1.1
                  : null;
                const x = i * (BAR_W + BAR_GAP);
                const barColor = !day.hasEntries
                  ? 'rgba(128,128,128,0.2)'
                  : goalHit === true
                  ? '#4CAF50'
                  : goalHit === false
                  ? '#FF6B6B'
                  : '#4ECDC4';

                return (
                  <React.Fragment key={day.date}>
                    {/* Background track */}
                    <Rect x={x} y={0} width={BAR_W} height={BAR_H} rx={4} fill="rgba(128,128,128,0.1)" />
                    {/* Actual bar */}
                    {barH > 0 && (
                      <Rect
                        x={x}
                        y={BAR_H - barH}
                        width={BAR_W}
                        height={barH}
                        rx={4}
                        fill={barColor}
                        opacity={0.85}
                      />
                    )}
                    {/* Goal line */}
                    {goalH && (
                      <Rect
                        x={x}
                        y={BAR_H - goalH}
                        width={BAR_W}
                        height={1.5}
                        fill="#FF9800"
                        opacity={0.9}
                      />
                    )}
                    {/* Day label */}
                    <SvgText
                      x={x + BAR_W / 2}
                      y={BAR_H + 14}
                      textAnchor="middle"
                      fontSize={10}
                      fill={theme.dark ? '#aaa' : '#555'}
                    >
                      {DAY_LABELS[i]}
                    </SvgText>
                    {/* Kcal label */}
                    {day.kcal > 0 && (
                      <SvgText
                        x={x + BAR_W / 2}
                        y={BAR_H - barH - 3}
                        textAnchor="middle"
                        fontSize={8}
                        fill={theme.dark ? '#ccc' : '#333'}
                      >
                        {day.kcal}
                      </SvgText>
                    )}
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>

          {kcalGoal && (
            <Text variant="labelSmall" style={styles.legendText}>
              Orange line = {kcalGoal} kcal goal · Green = hit · Red = missed
            </Text>
          )}

          <View style={styles.statRow}>
            <StatItem label="Avg Calories" value={`${avgKcal} kcal`} />
            <StatItem label="Days Logged" value={`${daysLogged} / 7`} />
            <StatItem label="Adherence" value={`${adherencePct}%`} />
          </View>
          {kcalGoal ? (
            <View style={styles.statRow}>
              <StatItem label="Days Hit Goal" value={`${daysHitGoal} / ${daysLogged}`} />
              <StatItem label="Goal" value={`${kcalGoal} kcal`} />
            </View>
          ) : null}

          <Divider style={styles.divider} />
          <Text variant="labelSmall" style={styles.macroHeader}>Avg Daily Macros</Text>
          <View style={styles.statRow}>
            <StatItem label="Protein" value={`${avgProtein}g`} color="#4ECDC4" />
            <StatItem label="Carbs" value={`${avgCarbs}g`} color="#45B7D1" />
            <StatItem label="Fat" value={`${avgFat}g`} color="#FFA07A" />
          </View>
        </Surface>

        {/* Workout Section */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Workouts</Text>
          <Divider style={styles.divider} />

          <View style={styles.statRow}>
            <StatItem label="Sessions" value={String(workoutData.sessions)} />
            <StatItem label="Total Sets" value={String(workoutData.totalSets)} />
            <StatItem label="Current Streak" value={`${streak} day${streak !== 1 ? 's' : ''}`} />
          </View>

          {workoutData.muscleGroups.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text variant="labelSmall" style={styles.macroHeader}>Exercises this week</Text>
              <View style={styles.muscleRow}>
                {workoutData.muscleGroups.map((name) => (
                  <View key={name} style={styles.muscleChip}>
                    <Text style={styles.muscleChipText}>{name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {workoutData.sessions === 0 && (
            <Text style={styles.noWorkouts}>No workouts logged this week.</Text>
          )}
        </Surface>
      </ScrollView>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={statStyles.item}>
      <Text variant="titleMedium" style={[statStyles.value, color ? { color } : undefined]}>
        {value}
      </Text>
      <Text variant="labelSmall" style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { alignItems: 'center', flex: 1 },
  value: { fontWeight: '700' },
  label: { opacity: 0.5, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, paddingVertical: 4 },
  backBtn: { margin: 0 },
  appBarTitle: { color: '#fff', fontWeight: '700', flex: 1 },

  content: { padding: 12, gap: 12, paddingBottom: 32 },

  weekSelector: { borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  weekLabel: { fontWeight: '600' },
  currentWeekBadge: { fontSize: 11, opacity: 0.5, marginTop: 2 },

  card: { borderRadius: 12, padding: 16 },
  cardTitle: { fontWeight: '700', marginBottom: 4 },
  divider: { marginVertical: 10 },

  chartContainer: { alignItems: 'center', marginVertical: 8 },
  legendText: { textAlign: 'center', opacity: 0.5, marginBottom: 8 },

  statRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  macroHeader: { opacity: 0.6, fontWeight: '600', marginBottom: 8 },

  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleChip: {
    backgroundColor: 'rgba(128,128,128,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  muscleChipText: { fontSize: 12 },

  noWorkouts: { opacity: 0.4, fontStyle: 'italic', textAlign: 'center', marginVertical: 8 },
});
