import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { getDatabase } from '@/db/database';
import { getWeightHistoryForRange } from '@/db/weightDao';
import { getWaterHistoryForRange } from '@/db/waterDao';
import { useDatabase } from '@/context/DatabaseContext';
import { WeightEntry } from '@/db/schema';
import { addDays, todayString } from '@/utils/dateUtils';
import { MACRO_COLORS } from '@/constants/macros';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 32;

interface DayKcal { date: string; kcal: number }
interface DayMacros { date: string; protein: number; carbs: number; fat: number }

function shortDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(todayString(), -i));
  return days;
}

const CHART_CFG = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
  labelColor: () => '#888',
  propsForBackgroundLines: { stroke: '#eee' },
};

const CHART_CFG_DARK = {
  backgroundGradientFrom: '#1e1e1e',
  backgroundGradientTo: '#1e1e1e',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
  labelColor: () => '#aaa',
  propsForBackgroundLines: { stroke: '#333' },
};

export default function HistoryScreen() {
  const { isReady } = useDatabase();
  const [kcalData, setKcalData] = useState<DayKcal[]>([]);
  const [macroData, setMacroData] = useState<DayMacros[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [waterHistory, setWaterHistory] = useState<Array<{ date: string; total_ml: number }>>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const db = getDatabase();
      const days = last7Days();
      const start = days[0];
      const end = days[days.length - 1];

      const [kcalRows, macroRows, weight, water] = await Promise.all([
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
          [start, end]
        ),
        db.getAllAsync<DayMacros>(
          `SELECT me.date,
            ROUND(SUM(CASE me.food_type WHEN 'ingredient' THEN i.protein * me.grams ELSE 0 END), 1) as protein,
            ROUND(SUM(CASE me.food_type WHEN 'ingredient' THEN i.carbs_total * me.grams ELSE 0 END), 1) as carbs,
            ROUND(SUM(CASE me.food_type WHEN 'ingredient' THEN i.fat_total * me.grams ELSE 0 END), 1) as fat
           FROM meal_entries me
           LEFT JOIN ingredients i ON me.food_type = 'ingredient' AND me.food_id = i.id
           WHERE me.date >= ? AND me.date <= ?
           GROUP BY me.date`,
          [start, end]
        ),
        getWeightHistoryForRange(addDays(todayString(), -29), todayString()),
        getWaterHistoryForRange(start, end),
      ]);

      const kcalMap = new Map(kcalRows.map((r) => [r.date, r.kcal]));
      const macroMap = new Map(macroRows.map((r) => [r.date, r]));
      const waterMap = new Map(water.map((r) => [r.date, r.total_ml]));

      setKcalData(days.map((d) => ({ date: d, kcal: kcalMap.get(d) ?? 0 })));
      setMacroData(days.map((d) => {
        const m = macroMap.get(d);
        return { date: d, protein: m?.protein ?? 0, carbs: m?.carbs ?? 0, fat: m?.fat ?? 0 };
      }));
      setWeightHistory(weight.slice().reverse().slice(0, 30).reverse());
      setWaterHistory(days.map((d) => ({ date: d, total_ml: (waterMap.get(d) ?? 0) / 1000 })));
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  useEffect(() => { load(); }, [load]);

  const labels7 = kcalData.map((d) => shortDate(d.date));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text variant="headlineSmall" style={styles.title}>History</Text>

        {/* Kcal chart */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.cardTitle}>Calories — Last 7 Days</Text>
          <BarChart
            data={{ labels: labels7, datasets: [{ data: kcalData.map((d) => d.kcal) }] }}
            width={CHART_W - 32}
            height={180}
            chartConfig={{ ...CHART_CFG, color: (o = 1) => `rgba(255, 107, 107, ${o})` }}
            yAxisLabel=""
            yAxisSuffix=" kcal"
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </Surface>

        {/* Macro line chart */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.cardTitle}>Macros — Last 7 Days (g)</Text>
          <LineChart
            data={{
              labels: labels7,
              datasets: [
                { data: macroData.map((d) => d.protein), color: () => MACRO_COLORS.protein, strokeWidth: 2 },
                { data: macroData.map((d) => d.carbs), color: () => MACRO_COLORS.carbs, strokeWidth: 2 },
                { data: macroData.map((d) => d.fat), color: () => MACRO_COLORS.fat, strokeWidth: 2 },
              ],
              legend: ['Protein', 'Carbs', 'Fat'],
            }}
            width={CHART_W - 32}
            height={180}
            chartConfig={CHART_CFG}
            style={styles.chart}
            bezier
          />
        </Surface>

        {/* Water chart */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.cardTitle}>Water — Last 7 Days (L)</Text>
          <BarChart
            data={{ labels: labels7, datasets: [{ data: waterHistory.map((d) => parseFloat(d.total_ml.toFixed(1))) }] }}
            width={CHART_W - 32}
            height={160}
            chartConfig={{ ...CHART_CFG, color: (o = 1) => `rgba(100, 181, 246, ${o})` }}
            yAxisLabel=""
            yAxisSuffix="L"
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </Surface>

        {/* Weight chart */}
        {weightHistory.length >= 2 && (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleSmall" style={styles.cardTitle}>Body Weight — Last 30 Days (kg)</Text>
            <LineChart
              data={{
                labels: weightHistory.map((w) => shortDate(w.date)),
                datasets: [{ data: weightHistory.map((w) => w.weight_kg) }],
              }}
              width={CHART_W - 32}
              height={180}
              chartConfig={{ ...CHART_CFG, color: (o = 1) => `rgba(129, 199, 132, ${o})` }}
              style={styles.chart}
              bezier
            />
          </Surface>
        )}

        {/* Summary stats */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.cardTitle}>7-Day Summary</Text>
          <View style={styles.statRow}>
            <StatBox label="Avg Kcal" value={Math.round(kcalData.reduce((s, d) => s + d.kcal, 0) / 7)} unit="kcal" />
            <StatBox label="Avg Protein" value={Math.round(macroData.reduce((s, d) => s + d.protein, 0) / 7)} unit="g" />
            <StatBox label="Avg Carbs" value={Math.round(macroData.reduce((s, d) => s + d.carbs, 0) / 7)} unit="g" />
            <StatBox label="Avg Fat" value={Math.round(macroData.reduce((s, d) => s + d.fat, 0) / 7)} unit="g" />
          </View>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.statBox}>
      <Text variant="titleMedium" style={styles.statValue}>{value}</Text>
      <Text variant="labelSmall" style={styles.statUnit}>{unit}</Text>
      <Text variant="labelSmall" style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontWeight: 'bold', marginBottom: 4 },
  card: { borderRadius: 12, padding: 16 },
  cardTitle: { fontWeight: '700', marginBottom: 8, opacity: 0.8 },
  chart: { borderRadius: 8, marginLeft: -8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', gap: 2 },
  statValue: { fontWeight: 'bold' },
  statUnit: { opacity: 0.6 },
  statLabel: { opacity: 0.5, marginTop: 2 },
});
