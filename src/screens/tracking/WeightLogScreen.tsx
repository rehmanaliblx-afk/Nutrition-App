import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions } from 'react-native';
import { Text, TextInput, Button, List, Divider, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Circle, Polyline, Text as SvgText, G } from 'react-native-svg';
import { useWeight } from '@/hooks/useWeight';
import { getAppSetting, setAppSetting } from '@/db/mealSlotsDao';
import { todayString, formatDateDisplay, isToday } from '@/utils/dateUtils';
import { useDatabase } from '@/context/DatabaseContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CHART_W = SCREEN_WIDTH - 64;
const CHART_H = 220;
const PAD = { top: 16, right: 20, bottom: 36, left: 44 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

function dateToNum(d: string): number {
  return new Date(d + 'T00:00:00').getTime() / 86400000;
}
function numToDate(n: number): string {
  return new Date(Math.round(n) * 86400000).toISOString().slice(0, 10);
}
function shortDate(d: string): string {
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

interface Pt { x: number; y: number; }

function linearRegression(pts: Pt[]): { slope: number; intercept: number } | null {
  if (pts.length < 2) return null;
  const n = pts.length;
  const sx = pts.reduce((a, p) => a + p.x, 0);
  const sy = pts.reduce((a, p) => a + p.y, 0);
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0);
  const sx2 = pts.reduce((a, p) => a + p.x * p.x, 0);
  const denom = n * sx2 - sx * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

export default function WeightLogScreen() {
  const { isReady } = useDatabase();
  const { history, todayEntry, loading, loadHistory, loadToday, save, remove } = useWeight();
  const today = todayString();

  const [weightStr, setWeightStr] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [targetKgStr, setTargetKgStr] = useState('');
  const [targetDateStr, setTargetDateStr] = useState('');
  const [editingTarget, setEditingTarget] = useState(false);
  const [startKg, setStartKg] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const [tkg, tdate, skg, sdate] = await Promise.all([
      getAppSetting('weight_target_kg'),
      getAppSetting('weight_target_date'),
      getAppSetting('weight_start_kg'),
      getAppSetting('weight_start_date'),
    ]);
    if (tkg) setTargetKgStr(tkg);
    if (tdate) setTargetDateStr(tdate);
    if (skg) setStartKg(parseFloat(skg));
    if (sdate) setStartDate(sdate);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    loadHistory(90);
    loadToday(today);
    loadSettings();
  }, [isReady, loadHistory, loadToday, today, loadSettings]);

  useEffect(() => {
    if (todayEntry) {
      setWeightStr(String(todayEntry.weight_kg));
      setNote(todayEntry.note ?? '');
    }
  }, [todayEntry]);

  const handleSave = async () => {
    const kg = parseFloat(weightStr);
    if (isNaN(kg) || kg <= 0 || kg > 500) {
      Alert.alert('Invalid', 'Please enter a valid weight in kg.');
      return;
    }
    setSaving(true);
    try {
      await save(today, kg, note.trim() || undefined);
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTarget = async () => {
    const kg = parseFloat(targetKgStr);
    if (isNaN(kg) || kg <= 0 || kg > 500) {
      Alert.alert('Invalid', 'Please enter a valid target weight.');
      return;
    }
    if (!targetDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid', 'Enter target date as YYYY-MM-DD (e.g. 2026-12-31)');
      return;
    }
    const refWeight = history[0]?.weight_kg;
    const refDate = history[0]?.date ?? today;
    const saves: Promise<void>[] = [
      setAppSetting('weight_target_kg', String(kg)),
      setAppSetting('weight_target_date', targetDateStr),
      setAppSetting('weight_start_date', refDate),
    ];
    if (refWeight !== undefined) saves.push(setAppSetting('weight_start_kg', String(refWeight)));
    await Promise.all(saves);
    setStartKg(refWeight ?? null);
    setStartDate(refDate);
    setEditingTarget(false);
  };

  const handleDelete = (date: string) => {
    Alert.alert('Delete Entry', `Remove weight entry for ${formatDateDisplay(date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(date) },
    ]);
  };

  const targetKg = parseFloat(targetKgStr) || null;
  const latestWeight = history[0]?.weight_kg ?? null;
  const prevWeight = history[1]?.weight_kg ?? null;
  const diff = latestWeight !== null && prevWeight !== null ? latestWeight - prevWeight : null;

  const allWeights = history.map((h) => h.weight_kg);
  const minW_stat = allWeights.length ? Math.min(...allWeights) : null;
  const maxW_stat = allWeights.length ? Math.max(...allWeights) : null;
  const avgW_stat = allWeights.length ? allWeights.reduce((a, b) => a + b, 0) / allWeights.length : null;
  // history newest-first: [0]=latest, [last]=oldest → change = latest - oldest
  const totalChange = allWeights.length >= 2 ? allWeights[0] - allWeights[allWeights.length - 1] : null;

  const chronoHistory = [...history].reverse(); // oldest first for chart
  const hasEnough = chronoHistory.length >= 2;
  const hasTarget = targetKg !== null && targetDateStr.length > 0 && startDate !== null && startKg !== null;
  const showChart = hasEnough && hasTarget;

  // ─── Build SVG chart ─────────────────────────────────────────
  let chartSvg: React.ReactNode = null;
  let projectedDate: string | null = null;

  if (showChart) {
    const todayDN = dateToNum(today);
    const targetDN = dateToNum(targetDateStr);
    const startDN = dateToNum(startDate!);

    const actualPts: Pt[] = chronoHistory.map((h) => ({ x: dateToNum(h.date), y: h.weight_kg }));
    const reg = linearRegression(actualPts);

    let trendEndDN = targetDN;
    if (reg && Math.abs(reg.slope) > 1e-6) {
      const projDN = (targetKg! - reg.intercept) / reg.slope;
      if (projDN > todayDN && projDN < todayDN + 1500) {
        projectedDate = numToDate(projDN);
        trendEndDN = Math.max(targetDN, projDN + 20);
      }
    }

    const allDNs = [startDN, targetDN, ...actualPts.map((p) => p.x), trendEndDN];
    const allKgs = [startKg!, targetKg!, ...actualPts.map((p) => p.y)];
    if (reg) allKgs.push(reg.slope * trendEndDN + reg.intercept);

    const minDN = Math.min(...allDNs);
    const maxDN = Math.max(...allDNs);
    const rawMinW = Math.min(...allKgs);
    const rawMaxW = Math.max(...allKgs);
    const wPad = Math.max((rawMaxW - rawMinW) * 0.15, 1.5);
    const minWW = rawMinW - wPad;
    const maxWW = rawMaxW + wPad;

    const sx = (dn: number) => PAD.left + ((dn - minDN) / (maxDN - minDN)) * PLOT_W;
    const sy = (w: number) => PAD.top + ((maxWW - w) / (maxWW - minWW)) * PLOT_H;

    const p_x1 = sx(startDN), p_y1 = sy(startKg!);
    const p_x2 = sx(targetDN), p_y2 = sy(targetKg!);

    const zigzag = actualPts.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');

    const trendFirstDN = actualPts[0].x;
    const tr_x1 = sx(trendFirstDN);
    const tr_y1 = sy(reg ? reg.slope * trendFirstDN + reg.intercept : actualPts[0].y);
    const tr_x2 = sx(trendEndDN);
    const tr_y2 = sy(reg ? reg.slope * trendEndDN + reg.intercept : actualPts[actualPts.length - 1].y);

    const wRange = maxWW - minWW;
    const yStep = wRange <= 5 ? 1 : wRange <= 15 ? 2 : 5;
    const yFirst = Math.ceil(minWW / yStep) * yStep;
    const yTicks: number[] = [];
    for (let w = yFirst; w <= maxWW + 0.01; w += yStep) yTicks.push(Math.round(w * 10) / 10);

    const xTicks = [0, 1, 2, 3].map((i) => minDN + (i / 3) * (maxDN - minDN));

    const projDN = projectedDate ? dateToNum(projectedDate) : null;
    const projY = projDN && reg ? sy(reg.slope * projDN + reg.intercept) : null;

    chartSvg = (
      <Svg width={CHART_W} height={CHART_H}>
        {/* Y grid + labels */}
        {yTicks.map((w, i) => (
          <G key={i}>
            <Line x1={PAD.left} y1={sy(w)} x2={PAD.left + PLOT_W} y2={sy(w)} stroke="#f0f0f0" strokeWidth={1} />
            <SvgText x={PAD.left - 4} y={sy(w) + 4} fontSize={9} fill="#bbb" textAnchor="end">{w}</SvgText>
          </G>
        ))}

        {/* X date labels */}
        {xTicks.map((dn, i) => (
          <SvgText key={i} x={sx(dn)} y={CHART_H - 5} fontSize={9} fill="#bbb" textAnchor="middle">
            {shortDate(numToDate(dn))}
          </SvgText>
        ))}

        {/* Today vertical marker */}
        {todayDN >= minDN && todayDN <= maxDN && (
          <Line
            x1={sx(todayDN)} y1={PAD.top} x2={sx(todayDN)} y2={PAD.top + PLOT_H}
            stroke="#4ECDC4" strokeWidth={1} strokeDasharray={[4, 4]} opacity={0.5}
          />
        )}

        {/* Required pace line — dashed red */}
        <Line x1={p_x1} y1={p_y1} x2={p_x2} y2={p_y2} stroke="#FF6B6B" strokeWidth={2} strokeDasharray={[8, 5]} />

        {/* Actual zigzag — blue solid */}
        {actualPts.length >= 2 && (
          <Polyline points={zigzag} fill="none" stroke="#45B7D1" strokeWidth={2} />
        )}

        {/* Trend / projection line — orange dashed */}
        {reg && (
          <Line x1={tr_x1} y1={tr_y1} x2={tr_x2} y2={tr_y2} stroke="#FF9800" strokeWidth={2} strokeDasharray={[10, 5]} />
        )}

        {/* Target endpoint dot — red */}
        <Circle cx={p_x2} cy={p_y2} r={5} fill="#FF6B6B" stroke="#fff" strokeWidth={2} />

        {/* Projected date dot — orange */}
        {projDN !== null && projY !== null && (
          <Circle cx={sx(projDN)} cy={projY} r={5} fill="#FF9800" stroke="#fff" strokeWidth={2} />
        )}

        {/* Actual weigh-in dots — blue */}
        {actualPts.map((p, i) => (
          <Circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} fill="#45B7D1" stroke="#fff" strokeWidth={1.5} />
        ))}

        {/* Axes */}
        <Line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#e0e0e0" strokeWidth={1} />
        <Line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#e0e0e0" strokeWidth={1} />
      </Svg>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>Weight Log</Text>

        {/* Summary row */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.latestWeight}>
                {latestWeight !== null ? `${latestWeight} kg` : '— kg'}
              </Text>
              <Text variant="labelSmall" style={styles.statLabel}>Current</Text>
            </View>
            {diff !== null && (
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: diff < 0 ? '#4CAF50' : '#FF5722', fontWeight: 'bold' }}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>vs yesterday</Text>
              </View>
            )}
            {targetKg !== null && latestWeight !== null && (
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: latestWeight <= targetKg ? '#4CAF50' : '#FF5722', fontWeight: 'bold' }}>
                  {(latestWeight - targetKg) > 0 ? '+' : ''}{(latestWeight - targetKg).toFixed(1)} kg
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>vs target</Text>
              </View>
            )}
          </View>
        </Surface>

        {/* Target setting */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.targetHeader}>
            <Text variant="titleSmall" style={{ fontWeight: '700' }}>🎯 Target Weight</Text>
            <IconButton icon="pencil" size={16} onPress={() => setEditingTarget(!editingTarget)} />
          </View>
          {editingTarget ? (
            <View style={{ gap: 8 }}>
              <TextInput
                label="Target weight (kg)"
                value={targetKgStr}
                onChangeText={setTargetKgStr}
                keyboardType="decimal-pad"
                mode="outlined"
                dense
                right={<TextInput.Affix text="kg" />}
              />
              <TextInput
                label="Achieve by (YYYY-MM-DD)"
                value={targetDateStr}
                onChangeText={setTargetDateStr}
                placeholder="e.g. 2026-12-31"
                mode="outlined"
                dense
              />
              <Button mode="contained" onPress={handleSaveTarget}>Set Target</Button>
            </View>
          ) : (
            <View>
              <Text variant="bodyLarge" style={styles.targetValue}>
                {targetKg !== null ? `${targetKg} kg` : 'Not set — tap ✏️ to set a goal'}
              </Text>
              {targetDateStr ? (
                <Text variant="bodySmall" style={{ opacity: 0.5, marginTop: 2 }}>
                  By {formatDateDisplay(targetDateStr)}
                </Text>
              ) : null}
            </View>
          )}
        </Surface>

        {/* Progress chart */}
        {showChart && (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleSmall" style={styles.chartTitle}>📈 Progress Chart</Text>
            {chartSvg}
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: '#FF6B6B' }]} />
              <Text variant="labelSmall" style={styles.legendText}>Required pace</Text>
              <View style={[styles.legendLine, { backgroundColor: '#45B7D1', marginLeft: 8 }]} />
              <Text variant="labelSmall" style={styles.legendText}>Actual</Text>
              <View style={[styles.legendLine, { backgroundColor: '#FF9800', marginLeft: 8 }]} />
              <Text variant="labelSmall" style={styles.legendText}>Trend</Text>
            </View>
            {projectedDate ? (
              <View style={styles.projectedBanner}>
                <Text variant="bodySmall" style={{ color: '#FF9800', fontWeight: '700' }}>
                  🏁 At current pace: reach {targetKg} kg by {formatDateDisplay(projectedDate)}
                </Text>
              </View>
            ) : (
              targetKg !== null && latestWeight !== null && latestWeight <= targetKg && (
                <View style={[styles.projectedBanner, { backgroundColor: 'rgba(76,175,80,0.1)' }]}>
                  <Text variant="bodySmall" style={{ color: '#4CAF50', fontWeight: '700' }}>
                    ✅ Target reached!
                  </Text>
                </View>
              )
            )}
          </Surface>
        )}
        {!showChart && hasEnough && (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.empty}>
              Set a target weight & date (tap ✏️ above) to see progress chart
            </Text>
          </Surface>
        )}

        {/* Statistics */}
        {history.length >= 2 && (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleSmall" style={{ fontWeight: '700', marginBottom: 10 }}>Statistics</Text>
            <View style={styles.statsRow}>
              {minW_stat !== null && <StatBox label="Lowest" value={minW_stat.toFixed(1)} unit="kg" color="#4CAF50" />}
              {maxW_stat !== null && <StatBox label="Highest" value={maxW_stat.toFixed(1)} unit="kg" color="#FF5722" />}
              {avgW_stat !== null && <StatBox label="Average" value={avgW_stat.toFixed(1)} unit="kg" />}
              {totalChange !== null && (
                <StatBox
                  label={totalChange < 0 ? 'Total Lost' : 'Total Gained'}
                  value={Math.abs(totalChange).toFixed(1)}
                  unit="kg"
                  color={totalChange < 0 ? '#4CAF50' : '#FF5722'}
                />
              )}
            </View>
          </Surface>
        )}

        {/* Log today */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.inputTitle}>
            {isToday(today) ? "Today's Weight" : formatDateDisplay(today)}
          </Text>
          <TextInput
            label="Weight (kg)"
            value={weightStr}
            onChangeText={setWeightStr}
            keyboardType="decimal-pad"
            mode="outlined"
            right={<TextInput.Affix text="kg" />}
          />
          <TextInput
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            mode="outlined"
            style={{ marginTop: 8 }}
          />
          <Button mode="contained" onPress={handleSave} loading={saving} icon="scale-bathroom" style={{ marginTop: 12 }}>
            {todayEntry ? 'Update Weight' : 'Log Weight'}
          </Button>
        </Surface>

        <Divider style={{ marginVertical: 8 }} />
        <Text variant="titleSmall" style={styles.historyTitle}>History</Text>
        {history.length === 0 && !loading && (
          <Text style={styles.empty}>No weight entries yet</Text>
        )}
        {history.map((entry) => (
          <List.Item
            key={entry.date}
            title={`${entry.weight_kg} kg${
              targetKg !== null
                ? entry.weight_kg <= targetKg
                  ? ' ✅'
                  : ` (+${(entry.weight_kg - targetKg).toFixed(1)} kg to target)`
                : ''
            }`}
            description={entry.note ?? undefined}
            left={() => (
              <View style={styles.dateBlock}>
                <Text variant="labelMedium" style={styles.entryDate}>{formatDateDisplay(entry.date)}</Text>
              </View>
            )}
            right={() => (
              <IconButton icon="delete-outline" size={18} onPress={() => handleDelete(entry.date)} />
            )}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="titleMedium" style={{ fontWeight: 'bold', color: color ?? '#333' }}>{value}</Text>
      <Text variant="labelSmall" style={{ opacity: 0.5 }}>{unit}</Text>
      <Text variant="labelSmall" style={{ opacity: 0.45, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  title: { fontWeight: 'bold' },
  card: { borderRadius: 12, padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  latestWeight: { fontWeight: 'bold' },
  statLabel: { opacity: 0.5, marginTop: 2 },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  targetValue: { opacity: 0.7, marginTop: 4 },
  chartTitle: { fontWeight: '700', marginBottom: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 4 },
  legendLine: { width: 16, height: 3, borderRadius: 2, marginRight: 4 },
  legendText: { opacity: 0.6, marginRight: 2 },
  projectedBanner: { marginTop: 8, backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: 8, padding: 8 },
  inputTitle: { fontWeight: '600', marginBottom: 8 },
  historyTitle: { fontWeight: '600', paddingHorizontal: 4 },
  dateBlock: { justifyContent: 'center', paddingHorizontal: 8 },
  entryDate: { opacity: 0.6 },
  empty: { textAlign: 'center', padding: 16, opacity: 0.4, fontStyle: 'italic' },
});
