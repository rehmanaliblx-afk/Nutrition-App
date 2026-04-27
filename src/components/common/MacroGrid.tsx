import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MacroSet, calcKcal, roundMacro } from '@/utils/macroCalculations';
import { MACRO_COLORS } from '@/constants/macros';

interface Props {
  macros: MacroSet;
  label?: string;
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Surface style={styles.chip} elevation={1}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text variant="labelSmall" style={styles.chipLabel}>{label}</Text>
      <Text variant="bodySmall" style={styles.chipValue}>{roundMacro(value)}g</Text>
    </Surface>
  );
}

export default function MacroGrid({ macros, label }: Props) {
  const kcal = roundMacro(calcKcal(macros), 0);
  return (
    <View style={styles.container}>
      {label ? <Text variant="titleSmall" style={styles.label}>{label}</Text> : null}
      <View style={styles.kcalRow}>
        <Text variant="titleLarge" style={[styles.kcalNum, { color: MACRO_COLORS.kcal }]}>{kcal}</Text>
        <Text variant="bodyMedium" style={styles.kcalUnit}> kcal</Text>
      </View>
      <View style={styles.grid}>
        <MacroChip label="Protein" value={macros.protein} color={MACRO_COLORS.protein} />
        <MacroChip label="Carbs" value={macros.carbs_total} color={MACRO_COLORS.carbs} />
        <MacroChip label="Fat" value={macros.fat_total} color={MACRO_COLORS.fat} />
        <MacroChip label="Sugar" value={macros.carbs_sugar} color={MACRO_COLORS.sugar} />
        <MacroChip label="Complex C" value={macros.carbs_complex} color={MACRO_COLORS.complex_carb} />
        <MacroChip label="Fiber" value={macros.carbs_fiber} color={MACRO_COLORS.fiber} />
        <MacroChip label="Unsat. Fat" value={macros.fat_unsaturated} color={MACRO_COLORS.unsaturated} />
        <MacroChip label="Mono/Poly" value={macros.fat_mono_poly} color={MACRO_COLORS.mono_poly} />
        <MacroChip label="Trans Fat" value={macros.fat_trans} color={MACRO_COLORS.trans} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontWeight: '600', marginBottom: 4 },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline' },
  kcalNum: { fontWeight: 'bold' },
  kcalUnit: { opacity: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 100 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { flex: 1, opacity: 0.7 },
  chipValue: { fontWeight: '600' },
});
