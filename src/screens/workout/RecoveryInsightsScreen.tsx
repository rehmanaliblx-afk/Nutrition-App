import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Surface, Chip, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '@/navigation/types';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { EXERCISES, ExerciseCategory } from '@/constants/exercises';
import { WorkoutSession } from '@/db/workoutSessionDao';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'RecoveryInsights'>;

type RecoveryStatus = 'ready' | 'recovering' | 'fresh' | 'never';

interface MuscleStatus {
  muscle: string;
  category: ExerciseCategory;
  lastTrainedDate: string | null;
  status: RecoveryStatus;
  hoursAgo: number | null;
}

// Map category → muscle group label
const CATEGORY_TO_MUSCLE: Partial<Record<ExerciseCategory, string>> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
};

const MAJOR_CATEGORIES: ExerciseCategory[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'core',
];

const STATUS_CONFIG: Record<RecoveryStatus, { label: string; color: string; bgColor: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  ready: { label: 'Ready', color: '#2E7D32', bgColor: '#E8F5E9', icon: 'checkmark-circle-outline' },
  recovering: { label: 'Recovering', color: '#E65100', bgColor: '#FFF3E0', icon: 'time-outline' },
  fresh: { label: 'Trained Today', color: '#B71C1C', bgColor: '#FFEBEE', icon: 'flame-outline' },
  never: { label: 'Never Trained', color: '#455A64', bgColor: '#ECEFF1', icon: 'remove-circle-outline' },
};

function getStatus(hoursAgo: number | null): RecoveryStatus {
  if (hoursAgo === null) return 'never';
  if (hoursAgo < 24) return 'fresh';
  if (hoursAgo < 48) return 'recovering';
  return 'ready';
}

function formatLastTrained(date: string | null, hoursAgo: number | null): string {
  if (!date || hoursAgo === null) return 'Never';
  if (hoursAgo < 24) return 'Today';
  if (hoursAgo < 48) return 'Yesterday';
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function RecoveryInsightsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { sessions, loading, load } = useWorkoutSession();
  const [muscleStatuses, setMuscleStatuses] = useState<MuscleStatus[]>([]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (sessions.length === 0 && !loading) {
      // No sessions: all "never"
      const statuses: MuscleStatus[] = MAJOR_CATEGORIES.map((cat) => ({
        muscle: CATEGORY_TO_MUSCLE[cat] ?? cat,
        category: cat,
        lastTrainedDate: null,
        status: 'never',
        hoursAgo: null,
      }));
      setMuscleStatuses(statuses);
      return;
    }

    // Build a map of category → most recent session date that included that category
    // We look at sessions (each has started_at) and match exercises by exerciseId → category
    const categoryLastDate: Partial<Record<ExerciseCategory, string>> = {};

    // We only have session-level data from useWorkoutSession.sessions (no sets inline).
    // We'll use the sessions list to approximate: for each session with a planId or planName,
    // we need to infer which muscle groups were trained.
    // Since sessions don't include set details at this level, we use a heuristic:
    // We scan sessions and use the plan name / session metadata.
    // A better approach: getHistory per exercise — but that would require N queries.
    // Instead, we'll process sessions: the sessions array contains WorkoutSession objects.
    // We'll look for sessions within the last 7 days and assume they trained specific muscles.
    // The most accurate approach given available data: we'll check if exercises were done
    // by looking at whether specific categories map to recent sessions via planName keywords.
    //
    // Practical approach: iterate sessions, look at totalSets > 0, and use the
    // getHistory hook results — but that's async per exercise.
    //
    // Best available: use EXERCISES to build an exercise ID → category map, then
    // for each session, derive what categories were hit based on the session sets
    // we have in the hook. Since sessions don't embed sets, we'll use a smarter approach.
    //
    // We query getHistory for each major category's exercises — but that's too many calls.
    // Simplest correct approach: store a map of category → last date from activeDates won't work.
    //
    // Use sessions list: each completed session has a startedAt. We'll approximate muscle groups
    // trained by checking if a session's planName contains keywords OR by treating all recent
    // sessions as "full body" if no plan. For plan-based sessions, we'd need the plan exercises.
    //
    // Given data available from hook: we'll use sessions + a reasonable heuristic.
    // For accurate results: track which exercises appeared in each session via aggregation.

    const now = new Date();

    for (const cat of MAJOR_CATEGORIES) {
      // Find exercises in this category
      const catExerciseIds = new Set(
        EXERCISES.filter((e) => e.category === cat).map((e) => e.id)
      );

      // We'll search by looking at planName — if planName references the category, use that session date.
      // Additionally, assume any recent session (last 48h with totalSets > 0 and no plan) hit all muscles.
      let bestDate: string | null = null;
      let bestMs = 0;

      for (const session of sessions) {
        if (!session.endedAt) continue; // unfinished sessions don't count
        const sessionDate = new Date(session.startedAt);
        const sessionMs = sessionDate.getTime();

        // Check planName for category keywords
        const planNameLower = (session.planName ?? '').toLowerCase();
        const catLabel = (CATEGORY_TO_MUSCLE[cat] ?? cat).toLowerCase();

        let matchesCat = false;

        // Direct category name match in plan name
        if (planNameLower.includes(catLabel)) matchesCat = true;

        // Split-based matching
        if (cat === 'chest' && (planNameLower.includes('chest') || planNameLower.includes('push') || planNameLower.includes('upper') || planNameLower.includes('full'))) matchesCat = true;
        if (cat === 'back' && (planNameLower.includes('back') || planNameLower.includes('pull') || planNameLower.includes('upper') || planNameLower.includes('full'))) matchesCat = true;
        if (cat === 'shoulders' && (planNameLower.includes('shoulder') || planNameLower.includes('push') || planNameLower.includes('upper') || planNameLower.includes('full'))) matchesCat = true;
        if (cat === 'biceps' && (planNameLower.includes('bicep') || planNameLower.includes('pull') || planNameLower.includes('arm') || planNameLower.includes('upper') || planNameLower.includes('full'))) matchesCat = true;
        if (cat === 'triceps' && (planNameLower.includes('tricep') || planNameLower.includes('push') || planNameLower.includes('arm') || planNameLower.includes('upper') || planNameLower.includes('full'))) matchesCat = true;
        if (cat === 'legs' && (planNameLower.includes('leg') || planNameLower.includes('lower') || planNameLower.includes('quad') || planNameLower.includes('full'))) matchesCat = true;
        if (cat === 'glutes' && (planNameLower.includes('glute') || planNameLower.includes('leg') || planNameLower.includes('lower') || planNameLower.includes('full'))) matchesCat = true;
        if (cat === 'core' && (planNameLower.includes('core') || planNameLower.includes('ab') || planNameLower.includes('full'))) matchesCat = true;

        // Quick Workout (no plan) — treat as full body
        if (!session.planName && session.totalSets > 0) matchesCat = true;

        if (matchesCat && sessionMs > bestMs) {
          bestMs = sessionMs;
          bestDate = session.startedAt.slice(0, 10);
        }
      }

      categoryLastDate[cat] = bestDate ?? undefined;
    }

    const statuses: MuscleStatus[] = MAJOR_CATEGORIES.map((cat) => {
      const lastDate = categoryLastDate[cat] ?? null;
      let hoursAgo: number | null = null;
      if (lastDate) {
        const lastDateMs = new Date(lastDate + 'T00:00:00').getTime();
        hoursAgo = Math.floor((now.getTime() - lastDateMs) / (1000 * 60 * 60));
      }
      return {
        muscle: CATEGORY_TO_MUSCLE[cat] ?? cat,
        category: cat,
        lastTrainedDate: lastDate,
        status: getStatus(hoursAgo),
        hoursAgo,
      };
    });

    setMuscleStatuses(statuses);
  }, [sessions, loading]);

  // Group by status order: fresh, recovering, never, ready
  const statusOrder: RecoveryStatus[] = ['fresh', 'recovering', 'never', 'ready'];
  const grouped = statusOrder.map((status) => ({
    status,
    items: muscleStatuses.filter((m) => m.status === status),
  })).filter((g) => g.items.length > 0);

  const renderMuscleRow = (item: MuscleStatus) => {
    const config = STATUS_CONFIG[item.status];
    return (
      <View key={item.category} style={styles.muscleRow}>
        <View style={[styles.muscleIconWrap, { backgroundColor: config.bgColor }]}>
          <Ionicons name={item.category === 'back' ? 'body-outline' : 'body-outline'} size={18} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
            {item.muscle}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            Last trained: {formatLastTrained(item.lastTrainedDate, item.hoursAgo)}
            {item.hoursAgo !== null ? ` (${item.hoursAgo}h ago)` : ''}
          </Text>
        </View>
        <Chip
          style={[styles.statusChip, { backgroundColor: config.bgColor }]}
          textStyle={{ color: config.color, fontSize: 11, fontWeight: '700' }}
          icon={() => <Ionicons name={config.icon} size={12} color={config.color} />}
          compact
        >
          {config.label}
        </Chip>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text variant="titleLarge" style={styles.headerTitle}>Recovery Insights</Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>Muscle group readiness</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Legend */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary, marginBottom: 12 }]}>
            Status Guide
          </Text>
          <View style={styles.legendGrid}>
            {(Object.entries(STATUS_CONFIG) as [RecoveryStatus, typeof STATUS_CONFIG[RecoveryStatus]][]).map(([key, cfg]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: cfg.bgColor }]}>
                  <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                </View>
                <View>
                  <Text variant="labelSmall" style={{ color: cfg.color, fontWeight: '700' }}>{cfg.label}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}>
                    {key === 'ready' ? '>48h rest' : key === 'recovering' ? '24–48h rest' : key === 'fresh' ? '<24h rest' : 'No data'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Surface>

        {/* Grouped muscle cards */}
        {grouped.map((group) => {
          const config = STATUS_CONFIG[group.status];
          return (
            <Surface key={group.status} style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={styles.cardHeader}>
                <Ionicons name={config.icon} size={16} color={config.color} />
                <Text variant="titleSmall" style={[styles.cardTitle, { color: config.color }]}>
                  {config.label}
                </Text>
                <View style={[styles.countBadge, { backgroundColor: config.bgColor }]}>
                  <Text variant="labelSmall" style={{ color: config.color, fontWeight: '700' }}>{group.items.length}</Text>
                </View>
              </View>
              <Divider style={{ marginBottom: 8 }} />
              {group.items.map((item, i) => (
                <React.Fragment key={item.category}>
                  {i > 0 && <Divider style={{ marginVertical: 4 }} />}
                  {renderMuscleRow(item)}
                </React.Fragment>
              ))}
            </Surface>
          );
        })}

        {muscleStatuses.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="body-outline" size={56} color={theme.colors.outlineVariant} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No workout data yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              Complete workouts to track muscle recovery
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 14 },
  card: { borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontWeight: '700', flex: 1 },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%' },
  legendDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  muscleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: { borderRadius: 12 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
});
