import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Surface, TextInput, Button, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '@/navigation/types';
import { calcOneRM, ONE_RM_PERCENTAGES } from '@/utils/oneRMCalc';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'OneRMCalculator'>;

// Percentage buckets to display + corresponding rep range
const PERCENTAGE_ROWS: { pct: number; reps: string }[] = [
  { pct: 100, reps: '1' },
  { pct: 95, reps: '2' },
  { pct: 90, reps: '3' },
  { pct: 85, reps: '4-5' },
  { pct: 80, reps: '6' },
  { pct: 75, reps: '8' },
  { pct: 70, reps: '10-12' },
  { pct: 65, reps: '14-15' },
];

export default function OneRMCalculatorScreen({ navigation }: Props) {
  const theme = useTheme();
  const [weightStr, setWeightStr] = useState('');
  const [repsStr, setRepsStr] = useState('');
  const [oneRM, setOneRM] = useState<number | null>(null);

  const handleCalculate = () => {
    const w = parseFloat(weightStr);
    const r = parseInt(repsStr, 10);
    if (!isNaN(w) && w > 0 && !isNaN(r) && r > 0) {
      setOneRM(Math.round(calcOneRM(w, r)));
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.headerTitle}>1RM Calculator</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Input card */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="barbell-outline" size={18} color={theme.colors.primary} />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
              Enter Your Lift
            </Text>
          </View>
          <Divider style={{ marginBottom: 16 }} />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              mode="outlined"
              label="Weight (kg)"
              keyboardType="decimal-pad"
              value={weightStr}
              onChangeText={setWeightStr}
              outlineStyle={{ borderRadius: 10 }}
              right={<TextInput.Affix text="kg" />}
            />
            <TextInput
              style={styles.input}
              mode="outlined"
              label="Reps"
              keyboardType="number-pad"
              value={repsStr}
              onChangeText={setRepsStr}
              outlineStyle={{ borderRadius: 10 }}
            />
          </View>
          <Button
            mode="contained"
            onPress={handleCalculate}
            style={[styles.calcBtn, { backgroundColor: theme.colors.primary }]}
            contentStyle={{ paddingVertical: 4 }}
            icon="calculator-outline"
          >
            Calculate
          </Button>
        </Surface>

        {/* Results */}
        {oneRM !== null && (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy-outline" size={18} color={theme.colors.primary} />
              <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
                Estimated 1RM
              </Text>
            </View>
            <Divider style={{ marginBottom: 16 }} />

            {/* Big 1RM value */}
            <View style={[styles.ormHero, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: '900' }}>
                {oneRM} kg
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.primary, opacity: 0.75 }}>
                Estimated One-Rep Max
              </Text>
            </View>

            {/* Percentage table */}
            <View style={styles.tableWrap}>
              {/* Header */}
              <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="labelSmall" style={[styles.tableColPct, { color: theme.colors.onSurfaceVariant, fontWeight: '700' }]}>%</Text>
                <Text variant="labelSmall" style={[styles.tableColWeight, { color: theme.colors.onSurfaceVariant, fontWeight: '700' }]}>WEIGHT</Text>
                <Text variant="labelSmall" style={[styles.tableColReps, { color: theme.colors.onSurfaceVariant, fontWeight: '700' }]}>REPS</Text>
              </View>

              {PERCENTAGE_ROWS.map((row, i) => {
                const pctDecimal = row.pct / 100;
                const weight = Math.round(oneRM * pctDecimal);
                const isEven = i % 2 === 0;
                return (
                  <View
                    key={row.pct}
                    style={[
                      styles.tableRow,
                      { backgroundColor: isEven ? theme.colors.surface : theme.colors.surfaceVariant + '55' },
                    ]}
                  >
                    <Text variant="bodyMedium" style={[styles.tableColPct, { color: row.pct === 100 ? theme.colors.primary : theme.colors.onSurface, fontWeight: row.pct === 100 ? '700' : '400' }]}>
                      {row.pct}%
                    </Text>
                    <Text variant="bodyMedium" style={[styles.tableColWeight, { color: theme.colors.onSurface, fontWeight: row.pct === 100 ? '700' : '400' }]}>
                      {weight} kg
                    </Text>
                    <Text variant="bodyMedium" style={[styles.tableColReps, { color: theme.colors.onSurfaceVariant }]}>
                      {row.reps} rep{row.reps === '1' ? '' : 's'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, fontStyle: 'italic' }}>
              Calculated using the Epley + Brzycki formula average.
            </Text>
          </Surface>
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
  content: { padding: 16, paddingBottom: 48, gap: 16 },
  card: { borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  input: { flex: 1 },
  calcBtn: { borderRadius: 12 },
  ormHero: {
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  tableWrap: { borderRadius: 10, overflow: 'hidden' },
  tableHeaderRow: {},
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableColPct: { width: 50 },
  tableColWeight: { flex: 1 },
  tableColReps: { flex: 1, textAlign: 'right' },
});
