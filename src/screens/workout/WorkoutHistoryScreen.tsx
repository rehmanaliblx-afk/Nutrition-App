import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { WorkoutStackParamList } from '@/navigation/types';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { calcCurrentStreak } from '@/utils/streakCalc';
import { WorkoutSession } from '@/db/workoutSessionDao';
import { getDatabase } from '@/db/database';
import { useDatabase } from '@/context/DatabaseContext';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutHistory'>;

function formatSessionDate(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDuration(sec: number | null): string {
  if (sec == null) return '—';
  const min = Math.round(sec / 60);
  return `${min} min`;
}

export default function WorkoutHistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const drawerNav = useNavigation();
  const { sessions, loading, activeDates, load } = useWorkoutSession();
  const { isReady } = useDatabase();
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [weeklyVolume, setWeeklyVolume] = useState<number>(0);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  useEffect(() => {
    if (!isReady) return;
    const db = getDatabase();
    // Total volume = sum of weight * reps for all completed sets
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(weight_kg * reps), 0) as total
       FROM workout_session_sets WHERE completed = 1 AND weight_kg IS NOT NULL AND reps IS NOT NULL`
    ).then((r) => setTotalVolume(Math.round((r?.total ?? 0) / 1000))); // in tonnes

    // This week's volume
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(wss.weight_kg * wss.reps), 0) as total
       FROM workout_session_sets wss
       JOIN workout_sessions ws ON wss.session_id = ws.id
       WHERE wss.completed = 1 AND wss.weight_kg IS NOT NULL AND wss.reps IS NOT NULL
       AND DATE(ws.started_at) >= ?`,
      [weekAgoStr]
    ).then((r) => setWeeklyVolume(Math.round(r?.total ?? 0)));
  }, [isReady, sessions]);

  const streak = calcCurrentStreak(activeDates);
  const totalSets = sessions.reduce((acc, s) => acc + (s.totalSets ?? 0), 0);

  const weekAgoDate = new Date();
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const weekSessionCount = sessions.filter((s) => new Date(s.startedAt) >= weekAgoDate).length;
  const avgVolumePerSession = weekSessionCount > 0 ? Math.round(weeklyVolume / weekSessionCount) : 0;

  const renderStatBox = (label: string, value: string | number, icon: React.ComponentProps<typeof Ionicons>['name']) => (
    <Surface style={[styles.statBox, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Ionicons name={icon} size={22} color={theme.colors.primary} />
      <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.onSurface }]}>
        {value}
      </Text>
      <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
    </Surface>
  );

  const renderSession = useCallback(
    ({ item }: { item: WorkoutSession }) => (
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="barbell-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
              {item.planName ?? 'Quick Workout'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {formatSessionDate(item.startedAt)}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                {formatDuration(item.durationSec)}
              </Text>
              <Ionicons name="layers-outline" size={13} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 10 }} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                {item.totalSets} sets
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
        </View>
      </TouchableOpacity>
    ),
    [theme]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => drawerNav.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color="#fff" />
          </TouchableOpacity>
          <Text variant="titleLarge" style={{ color: '#fff', fontWeight: '700' }}>
            Workout History
          </Text>
        </View>
      </SafeAreaView>

      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={renderSession}
        refreshing={loading}
        onRefresh={load}
        ListHeaderComponent={
          <>
            <View style={styles.statsRow}>
              {renderStatBox('Sessions', sessions.length, 'calendar-outline')}
              {renderStatBox('Total Sets', totalSets, 'layers-outline')}
              {renderStatBox('Day Streak', streak, 'flame-outline')}
            </View>
            <View style={styles.statsRow}>
              {renderStatBox('This Week', `${weeklyVolume} kg`, 'barbell-outline')}
              {renderStatBox('Total Volume', `${totalVolume} t`, 'stats-chart-outline')}
              {renderStatBox('Avg/Session', avgVolumePerSession > 0 ? `${avgVolumePerSession} kg` : '—', 'trending-up-outline')}
            </View>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={56} color={theme.colors.outlineVariant} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                No workouts yet
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}
              >
                Complete a workout session to see it here
              </Text>
            </View>
          ) : null
        }
      />
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
    gap: 12,
  },
  menuBtn: { padding: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 4,
  },
  statValue: { fontWeight: '800', lineHeight: 28 },
  statLabel: { letterSpacing: 0.3 },
  listContent: { padding: 16, paddingBottom: 40, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
});
