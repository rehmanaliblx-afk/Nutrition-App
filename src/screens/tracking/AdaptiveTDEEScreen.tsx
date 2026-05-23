import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { useDatabase } from '@/context/DatabaseContext';
import { getDatabase } from '@/db/database';
import { getWeightHistoryForRange } from '@/db/weightDao';
import { addDays, todayString } from '@/utils/dateUtils';
import { calcAdaptiveTDEE, TDEEResult } from '@/utils/adaptiveTDEE';

type Props = NativeStackScreenProps<NutritionStackParamList, 'AdaptiveTDEE'>;

const PERIODS = [
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
  { label: '60 Days', days: 60 },
];

const MODE_CONFIG = {
  cutting:     { label: 'Cutting',    color: '#2E7D32', bg: '#E8F5E9' },
  bulking:     { label: 'Bulking',    color: '#E65100', bg: '#FFF3E0' },
  maintaining: { label: 'Maintaining', color: '#00695C', bg: '#E0F2F1' },
};

const CONFIDENCE_CONFIG = {
  high:   { label: 'High',   color: '#2E7D32' },
  medium: { label: 'Medium', color: '#F57F17' },
  low:    { label: 'Low',    color: '#B71C1C' },
};

export default function AdaptiveTDEEScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isReady } = useDatabase();
  const [periodDays, setPeriodDays] = useState(30);
  const [result, setResult] = useState<TDEEResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(true);

  const load = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const today = todayString();
      const startDate = addDays(today, -periodDays);

      const db = getDatabase();

      const [weights, calorieRows] = await Promise.all([
        getWeightHistoryForRange(startDate, today),
        db.getAllAsync<{ date: string; kcal: number }>(
          `SELECT me.date,
            ROUND(SUM(
              CASE me.food_type WHEN 'ingredient' THEN
                (i.carbs_total * 4 + i.protein * 4 + i.fat_total * 9) * me.grams
              ELSE 0 END
            ), 1) as kcal
           FROM meal_entries me
           LEFT JOIN ingredients i ON me.food_type = 'ingredient' AND me.food_id = i.id
           WHERE me.date >= ? AND me.date <= ?
           GROUP BY me.date`,
          [startDate, today]
        ),
      ]);

      if (weights.length < 2 || calorieRows.length < 2) {
        setHasData(false);
        setResult(null);
        return;
      }

      setHasData(true);
      const tdeeResult = calcAdaptiveTDEE(weights, calorieRows);
      setResult(tdeeResult);
    } finally {
      setLoading(false);
    }
  }, [isReady, periodDays]);

  useEffect(() => { load(); }, [load]);

  const modeConfig = result ? MODE_CONFIG[result.mode] : null;
  const confConfig = result ? CONFIDENCE_CONFIG[result.confidence] : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* App Bar */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>{'← Back'}</Text>
          </TouchableOpacity>
          <Text variant="titleMedium" style={styles.appBarTitle}>Smart TDEE Calculator</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Period Selector */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="labelMedium" style={styles.sectionLabel}>Analysis Period</Text>
          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.days}
                style={[
                  styles.periodBtn,
                  periodDays === p.days && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setPeriodDays(p.days)}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    periodDays === p.days && { color: '#fff' },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Surface>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text variant="bodySmall" style={styles.loadingText}>Analyzing data…</Text>
          </View>
        )}

        {!loading && !hasData && (
          <Surface style={styles.warningCard} elevation={1}>
            <Text variant="titleSmall" style={styles.warningTitle}>Not Enough Data</Text>
            <Text variant="bodySmall" style={styles.warningText}>
              You need at least 2 weight entries and 2 days of calorie logs within the selected period.
              Keep logging your food and weight — check back soon!
            </Text>
          </Surface>
        )}

        {!loading && result && (
          <>
            {/* Low confidence warning */}
            {result.confidence === 'low' && (
              <Surface style={styles.warningCard} elevation={1}>
                <Text variant="titleSmall" style={styles.warningTitle}>Low Confidence</Text>
                <Text variant="bodySmall" style={styles.warningText}>
                  Only {result.days} days of data. For accurate results, log at least 7 days
                  of both weight and calories. Results may be unreliable.
                </Text>
              </Surface>
            )}

            {/* Mode Badge */}
            {modeConfig && (
              <View style={[styles.modeBadge, { backgroundColor: modeConfig.bg }]}>
                <Text style={[styles.modeLabel, { color: modeConfig.color }]}>
                  {modeConfig.label}
                </Text>
                <Text style={[styles.modeSubLabel, { color: modeConfig.color }]}>
                  {result.mode === 'cutting'
                    ? `Eating ${Math.abs(result.deficit)} kcal below maintenance`
                    : result.mode === 'bulking'
                    ? `Eating ${Math.abs(result.deficit)} kcal above maintenance`
                    : 'Eating near maintenance calories'}
                </Text>
              </View>
            )}

            {/* Main TDEE Result */}
            <Surface style={styles.mainCard} elevation={2}>
              <Text variant="labelMedium" style={styles.sectionLabel}>Estimated Maintenance TDEE</Text>
              <Text style={styles.tdeeValue}>{result.tdee.toLocaleString()}</Text>
              <Text variant="bodySmall" style={styles.tdeeUnit}>kcal / day</Text>
              {confConfig && (
                <View style={[styles.confidenceBadge, { borderColor: confConfig.color }]}>
                  <Text style={[styles.confidenceText, { color: confConfig.color }]}>
                    {confConfig.label} confidence — {result.days} days analyzed
                  </Text>
                </View>
              )}
            </Surface>

            {/* Stats Grid */}
            <Surface style={styles.card} elevation={1}>
              <Text variant="labelMedium" style={styles.sectionLabel}>Breakdown</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  label="Avg Daily Calories"
                  value={result.avgCalories.toLocaleString()}
                  unit="kcal"
                  color={theme.colors.primary}
                />
                <StatCard
                  label="Weight Change"
                  value={(result.weightChange >= 0 ? '+' : '') + result.weightChange.toFixed(2)}
                  unit="kg"
                  color={result.weightChange < 0 ? '#2E7D32' : result.weightChange > 0 ? '#E65100' : '#455A64'}
                />
                <StatCard
                  label="Calorie Deficit"
                  value={(result.deficit >= 0 ? '+' : '') + result.deficit.toLocaleString()}
                  unit="kcal/day"
                  color={result.deficit > 0 ? '#2E7D32' : result.deficit < 0 ? '#E65100' : '#455A64'}
                />
                <StatCard
                  label="Days Analyzed"
                  value={String(result.days)}
                  unit="days"
                  color="#455A64"
                />
              </View>
            </Surface>

            {/* How it works */}
            <Surface style={styles.card} elevation={1}>
              <Text variant="labelMedium" style={styles.sectionLabel}>How It Works</Text>
              <Text variant="bodySmall" style={styles.explainText}>
                This calculator estimates your true maintenance calories based on your
                actual weight changes and food intake — no guessing required.
              </Text>
              <Text variant="bodySmall" style={styles.explainText}>
                <Text style={{ fontWeight: '700' }}>Formula: </Text>
                TDEE = Avg Daily Calories − (Weight Change × 7700 kcal/kg ÷ Days)
              </Text>
              <Text variant="bodySmall" style={styles.explainText}>
                If you lost 1 kg over 30 days while eating 2000 kcal/day, your true
                maintenance is 2000 + (1 × 7700 ÷ 30) ≈ 2257 kcal/day.
              </Text>
              <Text variant="bodySmall" style={[styles.explainText, { marginBottom: 0 }]}>
                <Text style={{ fontWeight: '700' }}>Tip: </Text>
                More data = higher accuracy. Aim for at least 14 days of consistent logging.
              </Text>
            </Surface>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backBtn: { paddingHorizontal: 4 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  appBarTitle: { color: '#fff', fontWeight: '700', flex: 1, textAlign: 'center' },

  content: { padding: 16, gap: 12, paddingBottom: 32 },

  card: { borderRadius: 12, padding: 16 },
  mainCard: { borderRadius: 12, padding: 16, alignItems: 'center' },
  sectionLabel: { fontWeight: '600', opacity: 0.7, marginBottom: 10 },

  center: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  loadingText: { opacity: 0.5 },

  warningCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFF8E1',
  },
  warningTitle: { fontWeight: '700', color: '#F57F17', marginBottom: 6 },
  warningText: { color: '#795548', lineHeight: 18 },

  modeBadge: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modeLabel: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  modeSubLabel: { fontSize: 13, fontWeight: '500', opacity: 0.85 },

  tdeeValue: { fontSize: 52, fontWeight: '900', marginTop: 4, letterSpacing: -1 },
  tdeeUnit: { opacity: 0.5, marginTop: 2, marginBottom: 12 },
  confidenceBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  confidenceText: { fontSize: 12, fontWeight: '600' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(128,128,128,0.06)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statUnit: { fontSize: 11, opacity: 0.5, fontWeight: '500' },
  statLabel: { fontSize: 11, opacity: 0.6, textAlign: 'center', marginTop: 2 },

  periodRow: { flexDirection: 'row', gap: 8 },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  periodBtnText: { fontSize: 13, fontWeight: '600' },

  explainText: { opacity: 0.7, lineHeight: 18, marginBottom: 8 },
});
