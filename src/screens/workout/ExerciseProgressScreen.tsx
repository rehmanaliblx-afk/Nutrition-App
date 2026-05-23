import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Surface, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { WorkoutStackParamList } from '@/navigation/types';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { PersonalRecord, SessionSet } from '@/db/workoutSessionDao';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExerciseProgress'>;

interface HistoryEntry {
  date: string;
  sets: SessionSet[];
}

interface ChartPoint {
  x: number;
  y: number;
  date: string;
  weight: number;
}

const CHART_W = 300;
const CHART_H = 150;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function bestSet(sets: SessionSet[]): SessionSet | null {
  const completed = sets.filter((s) => s.completed && s.weightKg != null);
  if (!completed.length) return null;
  return completed.reduce((best, s) => ((s.weightKg ?? 0) > (best.weightKg ?? 0) ? s : best));
}

export default function ExerciseProgressScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { exerciseId, exerciseName } = route.params;
  const { getHistory, getPR } = useWorkoutSession();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pr, setPr] = useState<PersonalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [hist, record] = await Promise.all([getHistory(exerciseId, 20), getPR(exerciseId)]);
      if (!mounted) return;
      setHistory(hist);
      setPr(record);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [exerciseId, getHistory, getPR]);

  // Build chart data: max weight per session
  const chartData: ChartPoint[] = history
    .map((entry) => {
      const best = bestSet(entry.sets);
      return best && best.weightKg != null
        ? { date: entry.date, weight: best.weightKg }
        : null;
    })
    .filter((p): p is { date: string; weight: number } => p !== null)
    .slice()
    .reverse() // chronological
    .map((p, i, arr) => {
      // Will compute coords after we know min/max
      return { ...p, x: 0, y: 0, index: i, total: arr.length };
    });

  // Compute axes
  let chartPoints: ChartPoint[] = [];
  if (chartData.length >= 2) {
    const weights = chartData.map((p) => p.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const rangeW = maxW - minW || 1;
    const plotW = CHART_W - PAD_L - PAD_R;
    const plotH = CHART_H - PAD_T - PAD_B;

    chartPoints = chartData.map((p, i) => ({
      ...p,
      x: PAD_L + (i / (chartData.length - 1)) * plotW,
      y: PAD_T + plotH - ((p.weight - minW) / rangeW) * plotH,
    }));
  }

  const polylinePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const renderChart = useCallback(() => {
    if (chartPoints.length < 2) return null;
    const weights = chartPoints.map((p) => p.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const midW = Math.round((minW + maxW) / 2);
    const plotH = CHART_H - PAD_T - PAD_B;

    // Y-axis label positions
    const yTop = PAD_T;
    const yMid = PAD_T + plotH / 2;
    const yBot = PAD_T + plotH;

    return (
      <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {/* Axes */}
        <Line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={CHART_H - PAD_B} stroke={theme.colors.outlineVariant} strokeWidth={1} />
        <Line x1={PAD_L} y1={CHART_H - PAD_B} x2={CHART_W - PAD_R} y2={CHART_H - PAD_B} stroke={theme.colors.outlineVariant} strokeWidth={1} />

        {/* Y axis labels */}
        <SvgText x={PAD_L - 4} y={yTop + 4} textAnchor="end" fontSize={9} fill={theme.colors.onSurfaceVariant}>{maxW}</SvgText>
        <SvgText x={PAD_L - 4} y={yMid + 4} textAnchor="end" fontSize={9} fill={theme.colors.onSurfaceVariant}>{midW}</SvgText>
        <SvgText x={PAD_L - 4} y={yBot + 4} textAnchor="end" fontSize={9} fill={theme.colors.onSurfaceVariant}>{minW}</SvgText>

        {/* X axis labels: every 3rd */}
        {chartPoints
          .filter((_, i) => i % 3 === 0)
          .map((p) => (
            <SvgText key={p.date} x={p.x} y={CHART_H - 4} textAnchor="middle" fontSize={8} fill={theme.colors.onSurfaceVariant}>
              {formatDate(p.date)}
            </SvgText>
          ))}

        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {chartPoints.map((p) => (
          <Circle key={p.date} cx={p.x} cy={p.y} r={3.5} fill={theme.colors.primary} />
        ))}
      </Svg>
    );
  }, [chartPoints, polylinePoints, theme]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1}>
            {exerciseName}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* PR Card */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy-outline" size={18} color={theme.colors.primary} />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
              Personal Record
            </Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          {pr ? (
            <View style={styles.prContent}>
              <View style={styles.prMain}>
                <Text variant="headlineMedium" style={[styles.prWeight, { color: theme.colors.onSurface }]}>
                  {pr.weightKg} kg
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  × {pr.reps} reps
                </Text>
              </View>
              <View style={[styles.ormBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                  EST. 1RM
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: '800' }}>
                  {Math.round(pr.estimatedOneRM)} kg
                </Text>
              </View>
            </View>
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No data yet. Complete sets to track your PR.
            </Text>
          )}
        </Surface>

        {/* Chart Card */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up-outline" size={18} color={theme.colors.primary} />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
              Weight Progression
            </Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          {chartPoints.length >= 2 ? (
            renderChart()
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {loading ? 'Loading…' : 'Need at least 2 sessions to show a chart.'}
            </Text>
          )}
        </Surface>

        {/* Progressive Overload Card */}
        {history.length >= 2 && (() => {
          const latest = history[0];
          const prev = history[1];
          const latestBest = bestSet(latest.sets);
          const prevBest = bestSet(prev.sets);
          if (!latestBest || !prevBest) return null;

          const sameWeight = latestBest.weightKg === prevBest.weightKg;
          const moreReps = (latestBest.reps ?? 0) > (prevBest.reps ?? 0);
          const moreWeight = (latestBest.weightKg ?? 0) > (prevBest.weightKg ?? 0);

          let suggestion = '';
          let suggestColor = '#4ECDC4';
          let icon: React.ComponentProps<typeof Ionicons>['name'] = 'arrow-up-circle-outline';

          if (moreWeight) {
            suggestion = `New PR! Try ${((latestBest.weightKg ?? 0) + 2.5).toFixed(1)} kg next session`;
            suggestColor = '#4CAF50';
            icon = 'trophy-outline';
          } else if (sameWeight && moreReps) {
            suggestion = `Great reps! Try ${(latestBest.weightKg ?? 0) + 2.5} kg × ${latestBest.reps} next session`;
            suggestColor = '#4ECDC4';
          } else if (sameWeight && (latestBest.reps ?? 0) >= (prevBest.reps ?? 0)) {
            suggestion = `Same weight. Try +1 rep or +2.5 kg next session`;
            suggestColor = '#FF9800';
            icon = 'fitness-outline';
          } else {
            suggestion = `Prev: ${prevBest.weightKg} kg × ${prevBest.reps}. Keep pushing!`;
            suggestColor = '#888';
          }

          return (
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={styles.cardHeader}>
                <Ionicons name={icon} size={18} color={suggestColor} />
                <Text variant="titleSmall" style={[styles.cardTitle, { color: suggestColor }]}>
                  Progressive Overload
                </Text>
              </View>
              <Divider style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>LAST SESSION</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                    {latestBest.weightKg} kg × {latestBest.reps}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>PREV SESSION</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurfaceVariant }}>
                    {prevBest.weightKg} kg × {prevBest.reps}
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: suggestColor + '18', borderRadius: 10, padding: 12 }}>
                <Text style={{ color: suggestColor, fontWeight: '700', fontSize: 14 }}>
                  💡 {suggestion}
                </Text>
              </View>
            </Surface>
          );
        })()}

        {/* History Table */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={18} color={theme.colors.primary} />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
              Session History
            </Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={40} color={theme.colors.outlineVariant} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 10, textAlign: 'center' }}>
                No history for this exercise yet
              </Text>
            </View>
          ) : (
            <>
              {/* Table header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text variant="labelSmall" style={[styles.tableCell, styles.tableCellDate, { color: theme.colors.onSurfaceVariant }]}>DATE</Text>
                <Text variant="labelSmall" style={[styles.tableCell, { color: theme.colors.onSurfaceVariant }]}>SETS</Text>
                <Text variant="labelSmall" style={[styles.tableCell, { color: theme.colors.onSurfaceVariant }]}>BEST SET</Text>
              </View>
              {history.map((entry, i) => {
                const best = bestSet(entry.sets);
                const completedSets = entry.sets.filter((s) => s.completed).length;
                return (
                  <React.Fragment key={entry.date + i}>
                    {i > 0 && <Divider />}
                    <View style={styles.tableRow}>
                      <Text variant="bodySmall" style={[styles.tableCell, styles.tableCellDate, { color: theme.colors.onSurface }]}>
                        {formatDateFull(entry.date)}
                      </Text>
                      <Text variant="bodySmall" style={[styles.tableCell, { color: theme.colors.onSurface }]}>
                        {completedSets}
                      </Text>
                      <Text variant="bodySmall" style={[styles.tableCell, { color: theme.colors.onSurface }]}>
                        {best ? `${best.weightKg} kg × ${best.reps}` : '—'}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </Surface>
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
  headerTitle: { color: '#fff', fontWeight: '700', flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  card: { borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontWeight: '700' },
  prContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prMain: { gap: 2 },
  prWeight: { fontWeight: '800' },
  ormBadge: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  tableHeader: { paddingBottom: 6 },
  tableCell: { flex: 1 },
  tableCellDate: { flex: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
});
