import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Button, Surface, ProgressBar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions, CommonActions } from '@react-navigation/native';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { useWater } from '@/hooks/useWater';
import { useWeight } from '@/hooks/useWeight';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { todayString, formatDateDisplay, addDays, isToday } from '@/utils/dateUtils';
import { MACRO_COLORS, MEAL_TYPES, MEAL_LABELS } from '@/constants/macros';
import { roundMacro } from '@/utils/macroCalculations';
import { calcCurrentStreak } from '@/utils/streakCalc';
import { ExerciseCategory } from '@/constants/exercises';
import CalorieRing from '@/components/common/CalorieRing';
import MacroBar from '@/components/common/MacroBar';
import { Ionicons } from '@expo/vector-icons';

// Recovery status helpers (mirrors RecoveryInsightsScreen logic)
type RecoveryStatus = 'ready' | 'recovering' | 'fresh' | 'never';
const RECOVERY_STATUS_CONFIG: Record<RecoveryStatus, { label: string; color: string; bg: string }> = {
  ready:      { label: 'Ready',      color: '#2E7D32', bg: '#E8F5E9' },
  recovering: { label: 'Recovering', color: '#E65100', bg: '#FFF3E0' },
  fresh:      { label: 'Trained',    color: '#B71C1C', bg: '#FFEBEE' },
  never:      { label: 'Untrained',  color: '#455A64', bg: '#ECEFF1' },
};

const MAJOR_CATEGORIES: ExerciseCategory[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core',
];

const CATEGORY_LABELS: Partial<Record<ExerciseCategory, string>> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', legs: 'Legs', glutes: 'Glutes', core: 'Core',
};

function getRecoveryStatus(hoursAgo: number | null): RecoveryStatus {
  if (hoursAgo === null) return 'never';
  if (hoursAgo < 24) return 'fresh';
  if (hoursAgo < 48) return 'recovering';
  return 'ready';
}

export default function DashboardScreen() {
  const theme = useTheme();
  const drawerNav = useNavigation();
  const [date, setDate] = useState(todayString());
  const { data, loading, load } = useDailyLog();
  const { goal, load: loadGoal } = useGoals();
  const { total: waterTotal, load: loadWater } = useWater();
  const { history: weightHistory, loadHistory: loadWeight } = useWeight();
  const { sessions, activeDates, load: loadSessions } = useWorkoutSession();

  const refresh = useCallback(() => {
    load(date);
    loadGoal(date);
    loadWater(date);
    loadWeight(5);
    loadSessions();
  }, [date, load, loadGoal, loadWater, loadWeight, loadSessions]);

  useEffect(() => { refresh(); }, [refresh]);

  const streak = useMemo(() => calcCurrentStreak(activeDates), [activeDates]);

  // Build recovery status for each major muscle group
  const recoveryStatuses = useMemo(() => {
    const now = new Date();
    return MAJOR_CATEGORIES.map((cat) => {
      const catLabel = (CATEGORY_LABELS[cat] ?? cat).toLowerCase();
      let bestMs = 0;
      let bestDate: string | null = null;
      for (const session of sessions) {
        if (!session.endedAt) continue;
        const sessionMs = new Date(session.startedAt).getTime();
        const planNameLower = (session.planName ?? '').toLowerCase();
        let matches = planNameLower.includes(catLabel);
        if (cat === 'chest' && (planNameLower.includes('push') || planNameLower.includes('full'))) matches = true;
        if (cat === 'back' && (planNameLower.includes('pull') || planNameLower.includes('full'))) matches = true;
        if (!session.planName && session.totalSets > 0) matches = true;
        if (matches && sessionMs > bestMs) {
          bestMs = sessionMs;
          bestDate = session.startedAt.slice(0, 10);
        }
      }
      const hoursAgo = bestDate
        ? Math.floor((now.getTime() - new Date(bestDate + 'T00:00:00').getTime()) / 3_600_000)
        : null;
      return { cat, label: CATEGORY_LABELS[cat] ?? cat, status: getRecoveryStatus(hoursAgo) };
    });
  }, [sessions]);

  // Only show recovery row if there are sessions in last 7 days
  const hasRecentSessions = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return sessions.some((s) => s.endedAt && new Date(s.startedAt) >= cutoff);
  }, [sessions]);

  // Cross-stack navigation helper: jump to Workout drawer + navigate to a screen
  const navigateToWorkout = useCallback((screenName: string) => {
    drawerNav.dispatch(
      CommonActions.navigate({
        name: 'Workout',
        params: { screen: screenName },
      })
    );
  }, [drawerNav]);

  // Navigate within NutritionStack (same stack as Dashboard)
  const navigateToNutrition = useCallback((screenName: string) => {
    (drawerNav as any).navigate(screenName);
  }, [drawerNav]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => drawerNav.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color="#fff" />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.appBarTitle}>Dashboard</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Quick Actions Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
          style={{ backgroundColor: theme.colors.primary }}
        >
          {([
            { label: 'Daily Log', icon: 'restaurant-outline', onPress: () => navigateToNutrition('DailyLog') },
            { label: 'Log Workout', icon: 'barbell-outline', onPress: () => navigateToWorkout('WorkoutSession') },
            { label: 'Measurements', icon: 'body-outline', onPress: () => navigateToNutrition('BodyMeasurements') },
            { label: '1RM Calc', icon: 'calculator-outline', onPress: () => navigateToWorkout('OneRMCalculator') },
            { label: 'Generator', icon: 'flash-outline', onPress: () => navigateToWorkout('WorkoutGenerator') },
          ] as const).map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickActionBtn}
              onPress={action.onPress}
            >
              <Ionicons name={action.icon as any} size={18} color="#fff" />
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {/* Date Nav */}
        <View style={styles.header}>
          <Button icon="chevron-left" mode="text" compact onPress={() => setDate(addDays(date, -1))}>
            {''}
          </Button>
          <Text variant="titleMedium" style={styles.dateText}>
            {isToday(date) ? 'Today' : formatDateDisplay(date)}
          </Text>
          <Button icon="chevron-right" mode="text" compact onPress={() => setDate(addDays(date, 1))} disabled={isToday(date)}>
            {''}
          </Button>
        </View>

        {/* Calorie Ring */}
        <View style={styles.ringRow}>
          <CalorieRing current={data.totalKcal} goal={goal?.kcal_goal ?? null} />
        </View>

        {/* Macro Bars — tap to see full detail */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => (drawerNav as any).navigate('MacroDetail', { date })}
        >
          <Surface style={styles.macroCard} elevation={1}>
            <View style={styles.macroCardHeader}>
              <Text variant="labelSmall" style={{ opacity: 0.5 }}>MACROS — tap for full detail</Text>
              <Ionicons name="chevron-forward" size={14} style={{ opacity: 0.4 }} />
            </View>
            <MacroBar label="Protein" current={data.totals.protein} goal={goal?.protein_goal ?? null} color={MACRO_COLORS.protein} />
            <MacroBar label="Carbs" current={data.totals.carbs_total} goal={goal?.carbs_goal ?? null} color={MACRO_COLORS.carbs} />
            <MacroBar label="Fiber" current={data.totals.carbs_fiber} goal={goal?.fiber_goal ?? null} color="#4CAF50" />
            <MacroBar label="Fat" current={data.totals.fat_total} goal={goal?.fat_goal ?? null} color={MACRO_COLORS.fat} />
          </Surface>
        </TouchableOpacity>

        {/* Streak Widget */}
        <Surface style={styles.macroCard} elevation={1}>
          {streak > 0 ? (
            <View style={styles.streakRow}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text variant="titleSmall" style={styles.streakText}>
                {streak} day streak
              </Text>
            </View>
          ) : (
            <View style={styles.streakRow}>
              <Text variant="bodySmall" style={styles.streakEmpty}>
                Log a workout to start your streak
              </Text>
            </View>
          )}
        </Surface>

        {/* Recovery Quick-view (only if recent sessions exist) */}
        {hasRecentSessions && (
          <Surface style={styles.macroCard} elevation={1}>
            <Text variant="labelMedium" style={styles.subTitle}>Recovery Status</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recoveryRow}
            >
              {recoveryStatuses.map(({ cat, label, status }) => {
                const config = RECOVERY_STATUS_CONFIG[status];
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => navigateToWorkout('RecoveryInsights')}
                  >
                    <View style={[styles.recoveryChip, { backgroundColor: config.bg }]}>
                      <Text style={[styles.recoveryChipLabel, { color: config.color }]}>{label}</Text>
                      <Text style={[styles.recoveryChipStatus, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Surface>
        )}

        {/* Smart Insights card */}
        <Surface style={styles.macroCard} elevation={1}>
          <Text variant="labelMedium" style={styles.subTitle}>Smart Insights</Text>
          <Text variant="bodySmall" style={{ opacity: 0.6, marginBottom: 10 }}>
            Discover your true maintenance calories based on actual weight & food data.
          </Text>
          <Button
            mode="contained-tonal"
            icon="chart-line"
            onPress={() => drawerNav.dispatch(CommonActions.navigate({ name: 'AdaptiveTDEE' }))}
          >
            View Smart TDEE
          </Button>
        </Surface>

        {/* Water & Weight row */}
        <View style={styles.quickRow}>
          <Surface style={[styles.quickCard, { flex: 1 }]} elevation={1}>
            <Text variant="labelMedium" style={styles.subTitle}>💧 Water</Text>
            <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
              {Math.round(waterTotal)} <Text variant="labelSmall" style={{ fontWeight: 'normal', opacity: 0.6 }}>/ {goal?.water_goal_ml ?? 2000} ml</Text>
            </Text>
            <ProgressBar
              progress={Math.min(waterTotal / (goal?.water_goal_ml ?? 2000), 1)}
              color="#64B5F6"
              style={{ height: 5, borderRadius: 3, marginTop: 6 }}
            />
          </Surface>
          {weightHistory.length > 0 && (
            <Surface style={[styles.quickCard, { flex: 1 }]} elevation={1}>
              <Text variant="labelMedium" style={styles.subTitle}>⚖️ Weight</Text>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                {weightHistory[0].weight_kg} kg
              </Text>
              {weightHistory.length >= 2 && (
                <Text variant="labelSmall" style={{ opacity: 0.5 }}>
                  {(weightHistory[0].weight_kg - weightHistory[1].weight_kg) >= 0 ? '+' : ''}
                  {(weightHistory[0].weight_kg - weightHistory[1].weight_kg).toFixed(1)} kg
                </Text>
              )}
            </Surface>
          )}
        </View>

        {/* Meal summaries */}
        <Surface style={styles.macroCard} elevation={1}>
          <Text variant="titleSmall" style={styles.mealSummaryTitle}>Meals</Text>
          {MEAL_TYPES.map((meal) => {
            const entries = data.entries[meal] ?? [];
            const mealKcal = Math.round(entries.reduce((s, e) => s + e.kcal, 0));
            return (
              <View key={meal} style={styles.mealRow}>
                <View style={styles.mealIcon}>
                  <Ionicons
                    name={meal === 'breakfast' ? 'sunny-outline' : meal === 'lunch' ? 'partly-sunny-outline' : meal === 'dinner' ? 'moon-outline' : 'cafe-outline'}
                    size={18}
                    color={MACRO_COLORS.kcal}
                  />
                </View>
                <Text variant="bodyMedium" style={styles.mealName}>{MEAL_LABELS[meal]}</Text>
                <Text variant="bodySmall" style={styles.mealKcal}>
                  {entries.length > 0 ? `${mealKcal} kcal (${entries.length} items)` : 'Empty'}
                </Text>
              </View>
            );
          })}
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  menuBtn: { padding: 4, marginRight: 8 },
  appBarTitle: { color: '#fff', fontWeight: '700', flex: 1 },

  // Quick Actions Row
  quickActionsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickActionLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },

  content: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateText: { fontWeight: 'bold', flex: 1, textAlign: 'center' },
  ringRow: { alignItems: 'center', paddingVertical: 8 },
  macroCard: { borderRadius: 12, padding: 16 },
  macroCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  subTitle: { fontWeight: '600', marginBottom: 8, opacity: 0.7 },

  // Streak
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakFire: { fontSize: 22 },
  streakText: { fontWeight: '700' },
  streakEmpty: { opacity: 0.5, fontStyle: 'italic' },

  // Recovery
  recoveryRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  recoveryChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 68,
  },
  recoveryChipLabel: { fontSize: 11, fontWeight: '700' },
  recoveryChipStatus: { fontSize: 10, marginTop: 2 },

  mealSummaryTitle: { fontWeight: '700', marginBottom: 10 },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 10 },
  mealIcon: { width: 24, alignItems: 'center' },
  mealName: { flex: 1 },
  mealKcal: { opacity: 0.6 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: { borderRadius: 12, padding: 12 },
});
