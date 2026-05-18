import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions } from 'react-native';
import { Text, TextInput, Button, List, Divider, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useWeight } from '@/hooks/useWeight';
import { getAppSetting, setAppSetting } from '@/db/mealSlotsDao';
import { todayString, formatDateDisplay, isToday } from '@/utils/dateUtils';
import { useDatabase } from '@/context/DatabaseContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function shortDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

export default function WeightLogScreen() {
  const { isReady } = useDatabase();
  const { history, todayEntry, loading, loadHistory, loadToday, save, remove } = useWeight();
  const today = todayString();

  const [weightStr, setWeightStr] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [targetStr, setTargetStr] = useState('');
  const [editingTarget, setEditingTarget] = useState(false);

  const loadTarget = useCallback(async () => {
    const t = await getAppSetting('weight_target_kg');
    if (t) setTargetStr(t);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    loadHistory(30);
    loadToday(today);
    loadTarget();
  }, [isReady, loadHistory, loadToday, today, loadTarget]);

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
    const kg = parseFloat(targetStr);
    if (isNaN(kg) || kg <= 0 || kg > 500) {
      Alert.alert('Invalid', 'Please enter a valid target weight.');
      return;
    }
    await setAppSetting('weight_target_kg', String(kg));
    setEditingTarget(false);
  };

  const handleDelete = (date: string) => {
    Alert.alert('Delete Entry', `Remove weight entry for ${formatDateDisplay(date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(date) },
    ]);
  };

  const targetKg = parseFloat(targetStr) || null;
  const latestWeight = history[0]?.weight_kg ?? null;
  const prevWeight = history[1]?.weight_kg ?? null;
  const diff = latestWeight && prevWeight ? latestWeight - prevWeight : null;

  // Chart data — show up to 14 most recent entries in chronological order
  const chartEntries = [...history].reverse().slice(-14);
  const hasChart = chartEntries.length >= 2;

  // Stats
  const allWeights = history.map((h) => h.weight_kg);
  const minW = allWeights.length ? Math.min(...allWeights) : null;
  const maxW = allWeights.length ? Math.max(...allWeights) : null;
  const avgW = allWeights.length ? allWeights.reduce((a, b) => a + b, 0) / allWeights.length : null;
  const totalLost = allWeights.length >= 2 ? allWeights[allWeights.length - 1] - allWeights[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>Weight Log</Text>

        {/* Current vs Target */}
        <Surface style={styles.statsCard} elevation={1}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.latestWeight}>
                {latestWeight ? `${latestWeight} kg` : '— kg'}
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
            {targetKg && latestWeight && (
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: latestWeight <= targetKg ? '#4CAF50' : '#FF5722', fontWeight: 'bold' }}>
                  {(latestWeight - targetKg) > 0 ? '+' : ''}{(latestWeight - targetKg).toFixed(1)} kg
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>vs target</Text>
              </View>
            )}
          </View>
        </Surface>

        {/* Target Weight */}
        <Surface style={styles.targetCard} elevation={1}>
          <View style={styles.targetHeader}>
            <Text variant="titleSmall" style={{ fontWeight: '700' }}>🎯 Target Weight</Text>
            <IconButton icon="pencil" size={16} onPress={() => setEditingTarget(!editingTarget)} />
          </View>
          {editingTarget ? (
            <View style={styles.targetRow}>
              <TextInput
                label="Target (kg)"
                value={targetStr}
                onChangeText={setTargetStr}
                keyboardType="decimal-pad"
                mode="outlined"
                dense
                style={{ flex: 1 }}
                right={<TextInput.Affix text="kg" />}
              />
              <Button mode="contained" onPress={handleSaveTarget} style={{ marginLeft: 8 }}>Set</Button>
            </View>
          ) : (
            <Text variant="bodyLarge" style={styles.targetValue}>
              {targetKg ? `${targetKg} kg` : 'Not set — tap ✏️ to set a target'}
            </Text>
          )}
        </Surface>

        {/* Dual Line Chart */}
        {hasChart && (
          <Surface style={styles.chartCard} elevation={1}>
            <Text variant="titleSmall" style={styles.chartTitle}>Progress Chart</Text>
            <LineChart
              data={{
                labels: chartEntries.map((w) => shortDate(w.date)),
                datasets: [
                  {
                    data: chartEntries.map((w) => w.weight_kg),
                    color: () => '#81C784',
                    strokeWidth: 2,
                  },
                  ...(targetKg ? [{
                    data: chartEntries.map(() => targetKg),
                    color: () => '#FF6B6B',
                    strokeWidth: 1,
                    withDots: false,
                  }] : []),
                ],
                legend: targetKg ? ['Actual', 'Target'] : ['Weight'],
              }}
              width={SCREEN_WIDTH - 64}
              height={180}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 1,
                color: (o = 1) => `rgba(129, 199, 132, ${o})`,
                labelColor: () => '#888',
                propsForBackgroundLines: { stroke: '#f0f0f0' },
              }}
              bezier
              style={styles.chart}
            />
            {targetKg && (
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#81C784' }]} />
                <Text variant="labelSmall" style={styles.legendText}>Actual weight</Text>
                <View style={[styles.legendDot, { backgroundColor: '#FF6B6B', marginLeft: 12 }]} />
                <Text variant="labelSmall" style={styles.legendText}>Target {targetKg} kg</Text>
              </View>
            )}
          </Surface>
        )}

        {/* Statistics */}
        {history.length >= 2 && (
          <Surface style={styles.statsCard} elevation={1}>
            <Text variant="titleSmall" style={{ fontWeight: '700', marginBottom: 10 }}>Statistics</Text>
            <View style={styles.statsRow}>
              {minW !== null && <StatBox label="Lowest" value={`${minW.toFixed(1)}`} unit="kg" />}
              {maxW !== null && <StatBox label="Highest" value={`${maxW.toFixed(1)}`} unit="kg" />}
              {avgW !== null && <StatBox label="Average" value={`${avgW.toFixed(1)}`} unit="kg" />}
              {totalLost !== null && (
                <StatBox
                  label={totalLost < 0 ? 'Total Lost' : 'Total Gained'}
                  value={`${Math.abs(totalLost).toFixed(1)}`}
                  unit="kg"
                  color={totalLost < 0 ? '#4CAF50' : '#FF5722'}
                />
              )}
            </View>
          </Surface>
        )}

        {/* Log Today */}
        <Surface style={styles.inputCard} elevation={1}>
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
            title={`${entry.weight_kg} kg ${targetKg ? (entry.weight_kg <= targetKg ? '✅' : `(${(entry.weight_kg - targetKg) > 0 ? '+' : ''}${(entry.weight_kg - targetKg).toFixed(1)} kg to target)`) : ''}`}
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
  statsCard: { borderRadius: 12, padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  latestWeight: { fontWeight: 'bold' },
  statLabel: { opacity: 0.5, marginTop: 2 },
  targetCard: { borderRadius: 12, padding: 14 },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  targetRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  targetValue: { opacity: 0.7, marginTop: 4 },
  chartCard: { borderRadius: 12, padding: 16 },
  chartTitle: { fontWeight: '700', marginBottom: 8 },
  chart: { borderRadius: 8, marginLeft: -8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { opacity: 0.6 },
  inputCard: { borderRadius: 12, padding: 16 },
  inputTitle: { fontWeight: '600', marginBottom: 8 },
  historyTitle: { fontWeight: '600', paddingHorizontal: 4 },
  dateBlock: { justifyContent: 'center', paddingHorizontal: 8 },
  entryDate: { opacity: 0.6 },
  empty: { textAlign: 'center', padding: 24, opacity: 0.4, fontStyle: 'italic' },
});
