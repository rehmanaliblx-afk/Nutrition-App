import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { getDatabase } from '@/db/database';
import { getWeightHistoryForRange } from '@/db/weightDao';
import { getWaterHistoryForRange } from '@/db/waterDao';
import { useDatabase } from '@/context/DatabaseContext';
import { WeightEntry } from '@/db/schema';
import { addDays, todayString } from '@/utils/dateUtils';
import { MACRO_COLORS } from '@/constants/macros';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 64;

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

// ─── Custom SVG Bar Chart ────────────────────────────────────────────────────
interface SvgBarChartProps {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
  yUnit?: string;
}

function SvgBarChart({ data, labels, color, height = 180, yUnit = '' }: SvgBarChartProps) {
  const PAD_L = 40;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 28;
  const chartH = height - PAD_T - PAD_B;
  const chartW = CHART_W - PAD_L - PAD_R;

  const safeData = data.map((v) => (isNaN(v) || !isFinite(v) ? 0 : Math.max(0, v)));
  const maxVal = Math.max(...safeData, 1);
  const n = safeData.length;
  const barWidth = Math.max(4, (chartW / n) * 0.6);
  const gap = chartW / n;

  const toY = (v: number) => PAD_T + chartH - (v / maxVal) * chartH;
  const toX = (i: number) => PAD_L + gap * i + gap / 2;

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));

  return (
    <Svg width={CHART_W} height={height}>
      {/* Y-axis ticks and grid lines */}
      {ticks.map((t, i) => {
        const y = toY(t);
        return (
          <React.Fragment key={i}>
            <Line
              x1={PAD_L}
              y1={y}
              x2={PAD_L + chartW}
              y2={y}
              stroke="#eee"
              strokeWidth={1}
            />
            <SvgText x={PAD_L - 4} y={y + 4} fontSize={9} fill="#999" textAnchor="end">
              {t > 999 ? `${Math.round(t / 100) / 10}k` : String(t)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Bars */}
      {safeData.map((v, i) => {
        const barH = Math.max(0, (v / maxVal) * chartH);
        const x = toX(i) - barWidth / 2;
        const y = PAD_T + chartH - barH;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={color}
              rx={3}
            />
            {v > 0 && (
              <SvgText
                x={toX(i)}
                y={y - 3}
                fontSize={8}
                fill="#666"
                textAnchor="middle"
              >
                {v > 999 ? `${(v / 1000).toFixed(1)}k` : v % 1 !== 0 ? v.toFixed(1) : String(Math.round(v))}
                {yUnit}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}

      {/* X-axis labels */}
      {labels.map((label, i) => (
        <SvgText
          key={i}
          x={toX(i)}
          y={height - 6}
          fontSize={9}
          fill="#888"
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}

      {/* Y-axis line */}
      <Line
        x1={PAD_L}
        y1={PAD_T}
        x2={PAD_L}
        y2={PAD_T + chartH}
        stroke="#ccc"
        strokeWidth={1}
      />
    </Svg>
  );
}

// ─── Custom SVG Line Chart ────────────────────────────────────────────────────
interface SvgLineChartProps {
  datasets: Array<{ data: number[]; color: string; label: string }>;
  labels: string[];
  height?: number;
}

function SvgLineChart({ datasets, labels, height = 180 }: SvgLineChartProps) {
  const PAD_L = 40;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 28;
  const chartH = height - PAD_T - PAD_B;
  const chartW = CHART_W - PAD_L - PAD_R;

  const allValues = datasets.flatMap((ds) =>
    ds.data.map((v) => (isNaN(v) || !isFinite(v) ? 0 : v))
  );
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues.filter((v) => v > 0), 0);
  const range = Math.max(maxVal - minVal, 1);

  const n = labels.length;
  const toY = (v: number) => PAD_T + chartH - ((v - minVal) / range) * chartH;
  const toX = (i: number) => PAD_L + (i / Math.max(n - 1, 1)) * chartW;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => minVal + f * range);

  return (
    <Svg width={CHART_W} height={height}>
      {/* Grid lines */}
      {ticks.map((t, i) => {
        const y = toY(t);
        return (
          <React.Fragment key={i}>
            <Line
              x1={PAD_L}
              y1={y}
              x2={PAD_L + chartW}
              y2={y}
              stroke="#eee"
              strokeWidth={1}
            />
            <SvgText x={PAD_L - 4} y={y + 4} fontSize={9} fill="#999" textAnchor="end">
              {Math.round(t)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Dataset lines */}
      {datasets.map((ds, di) => {
        const safeData = ds.data.map((v) => (isNaN(v) || !isFinite(v) ? 0 : v));
        const points = safeData
          .map((v, i) => `${toX(i)},${toY(v)}`)
          .join(' ');
        return (
          <React.Fragment key={di}>
            <Polyline
              points={points}
              fill="none"
              stroke={ds.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {safeData.map((v, i) => (
              <Circle
                key={i}
                cx={toX(i)}
                cy={toY(v)}
                r={3}
                fill={ds.color}
              />
            ))}
          </React.Fragment>
        );
      })}

      {/* X-axis labels */}
      {labels.map((label, i) => (
        <SvgText
          key={i}
          x={toX(i)}
          y={height - 6}
          fontSize={9}
          fill="#888"
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}

      {/* Y-axis line */}
      <Line
        x1={PAD_L}
        y1={PAD_T}
        x2={PAD_L}
        y2={PAD_T + chartH}
        stroke="#ccc"
        strokeWidth={1}
      />

      {/* Legend */}
      {datasets.length > 1 &&
        datasets.map((ds, di) => (
          <React.Fragment key={`legend-${di}`}>
            <Line
              x1={PAD_L + di * 60}
              y1={PAD_T - 4}
              x2={PAD_L + di * 60 + 12}
              y2={PAD_T - 4}
              stroke={ds.color}
              strokeWidth={2}
            />
            <SvgText
              x={PAD_L + di * 60 + 14}
              y={PAD_T - 1}
              fontSize={9}
              fill="#666"
            >
              {ds.label}
            </SvgText>
          </React.Fragment>
        ))}
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
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
      // Convert ml to L with safety guard against NaN
      setWaterHistory(days.map((d) => ({
        date: d,
        total_ml: Math.max(0, (waterMap.get(d) ?? 0) / 1000),
      })));
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
          <SvgBarChart
            data={kcalData.map((d) => d.kcal)}
            labels={labels7}
            color="rgba(255, 107, 107, 0.85)"
            height={180}
            yUnit=" kcal"
          />
        </Surface>

        {/* Macro line chart */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.cardTitle}>Macros — Last 7 Days (g)</Text>
          <SvgLineChart
            datasets={[
              { data: macroData.map((d) => d.protein), color: MACRO_COLORS.protein, label: 'Protein' },
              { data: macroData.map((d) => d.carbs), color: MACRO_COLORS.carbs, label: 'Carbs' },
              { data: macroData.map((d) => d.fat), color: MACRO_COLORS.fat, label: 'Fat' },
            ]}
            labels={labels7}
            height={200}
          />
        </Surface>

        {/* Water chart */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.cardTitle}>Water — Last 7 Days (L)</Text>
          <SvgBarChart
            data={waterHistory.map((d) => parseFloat(d.total_ml.toFixed(2)))}
            labels={labels7}
            color="rgba(100, 181, 246, 0.85)"
            height={160}
            yUnit="L"
          />
        </Surface>

        {/* Weight chart */}
        {weightHistory.length >= 2 && (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleSmall" style={styles.cardTitle}>Body Weight — Last 30 Days (kg)</Text>
            <SvgLineChart
              datasets={[
                { data: weightHistory.map((w) => w.weight_kg), color: 'rgba(129, 199, 132, 1)', label: 'Weight' },
              ]}
              labels={weightHistory.map((w) => shortDate(w.date))}
              height={180}
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
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', gap: 2 },
  statValue: { fontWeight: 'bold' },
  statUnit: { opacity: 0.6 },
  statLabel: { opacity: 0.5, marginTop: 2 },
});
