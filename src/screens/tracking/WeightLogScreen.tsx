import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, List, Divider, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeight } from '@/hooks/useWeight';
import { todayString, formatDateDisplay, isToday } from '@/utils/dateUtils';
import { useDatabase } from '@/context/DatabaseContext';

export default function WeightLogScreen() {
  const { isReady } = useDatabase();
  const { history, todayEntry, loading, loadHistory, loadToday, save, remove } = useWeight();
  const today = todayString();

  const [weightStr, setWeightStr] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    loadHistory();
    loadToday(today);
  }, [isReady, loadHistory, loadToday, today]);

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

  const handleDelete = (date: string) => {
    Alert.alert('Delete Entry', `Remove weight entry for ${formatDateDisplay(date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(date) },
    ]);
  };

  const latestWeight = history[0]?.weight_kg ?? null;
  const prevWeight = history[1]?.weight_kg ?? null;
  const diff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>Weight Log</Text>

        {latestWeight && (
          <Surface style={styles.statsCard} elevation={1}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.latestWeight}>{latestWeight} kg</Text>
                <Text variant="labelSmall" style={styles.statLabel}>Latest</Text>
              </View>
              {diff && (
                <View style={styles.statItem}>
                  <Text variant="titleLarge" style={[styles.diffText, { color: parseFloat(diff) < 0 ? '#4CAF50' : '#FF5722' }]}>
                    {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
                  </Text>
                  <Text variant="labelSmall" style={styles.statLabel}>vs previous</Text>
                </View>
              )}
            </View>
          </Surface>
        )}

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
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            icon="scale-bathroom"
            style={{ marginTop: 12 }}
          >
            {todayEntry ? 'Update' : 'Log Weight'}
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
            title={`${entry.weight_kg} kg`}
            description={entry.note ?? undefined}
            left={(p) => (
              <View {...p} style={styles.dateBlock}>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  title: { fontWeight: 'bold' },
  statsCard: { borderRadius: 12, padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  latestWeight: { fontWeight: 'bold' },
  diffText: { fontWeight: 'bold' },
  statLabel: { opacity: 0.5, marginTop: 2 },
  inputCard: { borderRadius: 12, padding: 16 },
  inputTitle: { fontWeight: '600', marginBottom: 8 },
  historyTitle: { fontWeight: '600', paddingHorizontal: 4 },
  dateBlock: { justifyContent: 'center', paddingHorizontal: 8 },
  entryDate: { opacity: 0.6 },
  empty: { textAlign: 'center', padding: 24, opacity: 0.4, fontStyle: 'italic' },
});
