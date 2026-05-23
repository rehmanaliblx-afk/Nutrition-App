import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { FAB, Text, Divider, List, IconButton, Button, Chip, ProgressBar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { TrackingStackParamList } from '@/navigation/types';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { useWater } from '@/hooks/useWater';
import { useMealSlots } from '@/hooks/useMealSlots';
import { copyMealEntries } from '@/db/trackingDao';
import { todayString, formatDateDisplay, addDays, isToday } from '@/utils/dateUtils';
import { roundMacro } from '@/utils/macroCalculations';
import { useDatabase } from '@/context/DatabaseContext';
import GoalsScreen from './GoalsScreen';

type Props = NativeStackScreenProps<TrackingStackParamList, 'DailyLog'>;

const WATER_QUICK = [250, 500, 750, 1000];

// Simple SVG donut chart for macro distribution
function MacroDonut({
  protein, carbs, fat, size = 120,
}: {
  protein: number; carbs: number; fat: number; size?: number;
}) {
  const total = protein + carbs + fat;
  if (total <= 0) {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="35" fill="none" stroke="#E0E0E0" strokeWidth="14" />
      </Svg>
    );
  }

  const cx = 50, cy = 50, r = 35;
  const circumference = 2 * Math.PI * r;

  const pKcal = protein * 4;
  const cKcal = carbs * 4;
  const fKcal = fat * 9;
  const totalKcal = pKcal + cKcal + fKcal || 1;

  const segments = [
    { value: pKcal / totalKcal, color: '#4ECDC4' },
    { value: cKcal / totalKcal, color: '#45B7D1' },
    { value: fKcal / totalKcal, color: '#FF9800' },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = seg.value * circumference;
    const gap = circumference - dash;
    // rotate so arc starts at top (-90 deg)
    const rotation = -90 + offset * 360;
    offset += seg.value;
    return { dash, gap, rotation, color: seg.color };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {arcs.map((arc, i) => (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth="14"
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={0}
          transform={`rotate(${arc.rotation} ${cx} ${cy})`}
          strokeLinecap="butt"
        />
      ))}
    </Svg>
  );
}

export default function DailyLogScreen({ route, navigation }: Props) {
  const { isReady } = useDatabase();
  const [date, setDate] = useState(route.params?.date ?? todayString());
  const { data, loading, load, removeEntry } = useDailyLog();
  const { goal, load: loadGoal } = useGoals();
  const { total: waterTotal, load: loadWater, add: addWater } = useWater();
  const { slots, load: loadSlots } = useMealSlots();
  const [showGoals, setShowGoals] = useState(false);

  const refresh = useCallback(() => {
    if (!isReady) return;
    load(date);
    loadGoal(date);
    loadWater(date);
    loadSlots();
  }, [isReady, date, load, loadGoal, loadWater, loadSlots]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', refresh);
    return unsub;
  }, [navigation, refresh]);

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Remove Entry', `Remove "${name}" from log?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeEntry(id, date) },
    ]);
  };

  const handleCopyMeal = (mealName: string, displayName: string) => {
    const prevDay = addDays(date, -1);
    Alert.alert(
      'Copy Meal',
      `Copy ${displayName} from ${isToday(prevDay) ? 'yesterday' : formatDateDisplay(prevDay)} to today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: async () => {
            try {
              await copyMealEntries(prevDay, date, mealName);
              load(date);
            } catch (e) {
              Alert.alert('Error', String(e));
            }
          },
        },
      ]
    );
  };

  if (showGoals) {
    return <GoalsScreen onSaved={() => { setShowGoals(false); refresh(); }} />;
  }

  const kcalGoal = goal?.kcal_goal ?? null;
  const waterGoal = goal?.water_goal_ml ?? 2000;
  const waterPct = Math.min(waterTotal / waterGoal, 1);

  const t = data.totals;
  const netCarbs = Math.max(0, t.carbs_total - t.carbs_fiber);

  // Remaining macros
  const remaining = {
    kcal: kcalGoal != null ? Math.round(kcalGoal - data.totalKcal) : null,
    protein: goal?.protein_goal != null ? Math.max(0, goal.protein_goal - t.protein) : null,
    carbs: goal?.carbs_goal != null ? Math.max(0, goal.carbs_goal - t.carbs_total) : null,
    fat: goal?.fat_goal != null ? Math.max(0, goal.fat_goal - t.fat_total) : null,
    fiber: goal?.fiber_goal != null ? Math.max(0, goal.fiber_goal - t.carbs_fiber) : null,
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.dateRow}>
        <IconButton icon="chevron-left" onPress={() => setDate(addDays(date, -1))} />
        <Text variant="titleMedium" style={styles.dateText}>
          {isToday(date) ? 'Today' : formatDateDisplay(date)}
        </Text>
        <IconButton icon="chevron-right" onPress={() => setDate(addDays(date, 1))} disabled={isToday(date)} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Macro summary with donut */}
        <Surface style={styles.summaryCard} elevation={1}>
          <View style={styles.summaryRow}>
            <View style={styles.donutWrap}>
              <MacroDonut
                protein={t.protein}
                carbs={t.carbs_total}
                fat={t.fat_total}
                size={110}
              />
              <View style={styles.donutCenter}>
                <Text variant="titleMedium" style={styles.kcalNum}>
                  {roundMacro(data.totalKcal, 0)}
                </Text>
                <Text variant="labelSmall" style={styles.kcalLabel}>
                  {kcalGoal ? `/ ${kcalGoal}` : 'kcal'}
                </Text>
              </View>
            </View>
            <View style={styles.macroLegend}>
              {[
                { label: 'Protein', value: t.protein, color: '#4ECDC4' },
                { label: 'Carbs', value: t.carbs_total, color: '#45B7D1' },
                { label: 'Net Carbs', value: netCarbs, color: '#81D4FA' },
                { label: 'Fiber', value: t.carbs_fiber, color: '#4CAF50' },
                { label: 'Fat', value: t.fat_total, color: '#FF9800' },
              ].map((m) => (
                <View key={m.label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                  <Text variant="labelSmall" style={styles.legendLabel}>{m.label}</Text>
                  <Text variant="labelSmall" style={[styles.legendVal, { color: m.color }]}>
                    {roundMacro(m.value)}g
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Remaining row */}
          {remaining.kcal != null && (
            <>
              <Divider style={{ marginVertical: 10 }} />
              <Text variant="labelSmall" style={styles.remainingTitle}>REMAINING</Text>
              <View style={styles.remainingRow}>
                <View style={styles.remainingItem}>
                  <Text variant="titleSmall" style={{ color: remaining.kcal < 0 ? '#FF5722' : '#4CAF50', fontWeight: '800' }}>
                    {Math.abs(remaining.kcal)}
                  </Text>
                  <Text variant="labelSmall" style={styles.remainingLabel}>kcal</Text>
                </View>
                {remaining.protein != null && (
                  <View style={styles.remainingItem}>
                    <Text variant="titleSmall" style={{ color: '#4ECDC4', fontWeight: '800' }}>
                      {roundMacro(remaining.protein)}g
                    </Text>
                    <Text variant="labelSmall" style={styles.remainingLabel}>protein</Text>
                  </View>
                )}
                {remaining.carbs != null && (
                  <View style={styles.remainingItem}>
                    <Text variant="titleSmall" style={{ color: '#45B7D1', fontWeight: '800' }}>
                      {roundMacro(remaining.carbs)}g
                    </Text>
                    <Text variant="labelSmall" style={styles.remainingLabel}>carbs</Text>
                  </View>
                )}
                {remaining.fiber != null && (
                  <View style={styles.remainingItem}>
                    <Text variant="titleSmall" style={{ color: '#4CAF50', fontWeight: '800' }}>
                      {roundMacro(remaining.fiber)}g
                    </Text>
                    <Text variant="labelSmall" style={styles.remainingLabel}>fiber</Text>
                  </View>
                )}
                {remaining.fat != null && (
                  <View style={styles.remainingItem}>
                    <Text variant="titleSmall" style={{ color: '#FF9800', fontWeight: '800' }}>
                      {roundMacro(remaining.fat)}g
                    </Text>
                    <Text variant="labelSmall" style={styles.remainingLabel}>fat</Text>
                  </View>
                )}
              </View>
            </>
          )}

          <Button compact mode="text" icon="flag" onPress={() => setShowGoals(true)} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
            Edit Goals
          </Button>
        </Surface>

        {/* Water Tracker */}
        <Surface style={styles.waterCard} elevation={1}>
          <View style={styles.waterHeader}>
            <Text variant="titleSmall" style={styles.waterTitle}>💧 Water</Text>
            <Text variant="bodySmall" style={styles.waterTotal}>
              {Math.round(waterTotal)} / {waterGoal} ml
            </Text>
          </View>
          <ProgressBar progress={waterPct} color="#64B5F6" style={styles.waterBar} />
          <View style={styles.waterBtns}>
            {WATER_QUICK.map((ml) => (
              <Chip key={ml} compact onPress={() => addWater(date, ml)} style={styles.waterChip} icon="plus">
                {ml}ml
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Dynamic Meal Sections */}
        {slots.map((slot) => {
          const entries = data.entries[slot.name] ?? [];
          const mealKcal = roundMacro(entries.reduce((s, e) => s + e.kcal, 0), 0);
          const mealProtein = roundMacro(entries.reduce((s, e) => s + e.macros.protein, 0));
          const mealCarbs = roundMacro(entries.reduce((s, e) => s + e.macros.carbs_total, 0));
          const mealFiber = roundMacro(entries.reduce((s, e) => s + e.macros.carbs_fiber, 0));
          const mealFat = roundMacro(entries.reduce((s, e) => s + e.macros.fat_total, 0));

          return (
            <View key={slot.name} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Text variant="titleSmall" style={styles.mealTitle}>
                  {slot.emoji} {slot.display_name.toUpperCase()}
                </Text>
                <Text variant="labelSmall" style={styles.mealKcal}>{mealKcal > 0 ? `${mealKcal} kcal` : ''}</Text>
                <IconButton
                  icon="content-copy"
                  size={16}
                  onPress={() => handleCopyMeal(slot.name, slot.display_name)}
                />
                <IconButton
                  icon="plus"
                  size={18}
                  onPress={() => navigation.navigate('AddMealEntry', { date, mealType: slot.name })}
                />
              </View>

              {entries.length > 0 && (
                <View style={styles.mealMacroRow}>
                  <Text variant="labelSmall" style={{ color: '#4ECDC4' }}>P: {mealProtein}g</Text>
                  <Text variant="labelSmall" style={{ color: '#45B7D1', marginLeft: 8 }}>C: {mealCarbs}g</Text>
                  <Text variant="labelSmall" style={{ color: '#4CAF50', marginLeft: 8 }}>F: {mealFiber}g</Text>
                  <Text variant="labelSmall" style={{ color: '#FF9800', marginLeft: 8 }}>Fat: {mealFat}g</Text>
                </View>
              )}

              {entries.map((re) => (
                <List.Item
                  key={re.entry.id}
                  title={`${re.name} — ${re.entry.grams}g`}
                  description={`${roundMacro(re.kcal, 0)} kcal · P: ${roundMacro(re.macros.protein)}g · C: ${roundMacro(re.macros.carbs_total)}g · F: ${roundMacro(re.macros.fat_total)}g`}
                  right={() => (
                    <IconButton icon="delete-outline" size={18} onPress={() => handleDelete(re.entry.id, re.name)} />
                  )}
                  style={styles.entryItem}
                />
              ))}
              {entries.length === 0 && (
                <Text style={styles.emptyMeal}>Nothing logged yet</Text>
              )}
              <Divider />
            </View>
          );
        })}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddMealEntry', { date, mealType: slots[0]?.name ?? 'breakfast' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateText: { fontWeight: 'bold', minWidth: 140, textAlign: 'center' },
  content: { paddingBottom: 80 },

  summaryCard: { margin: 12, borderRadius: 14, padding: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutWrap: { width: 110, height: 110, position: 'relative' },
  donutCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  kcalNum: { fontWeight: '800', color: '#FF6B6B', lineHeight: 22 },
  kcalLabel: { opacity: 0.5, fontSize: 10 },
  macroLegend: { flex: 1, gap: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, opacity: 0.7 },
  legendVal: { fontWeight: '700' },

  remainingTitle: { opacity: 0.5, fontWeight: '700', marginBottom: 6 },
  remainingRow: { flexDirection: 'row', gap: 0, justifyContent: 'space-around' },
  remainingItem: { alignItems: 'center' },
  remainingLabel: { opacity: 0.5 },

  waterCard: { marginHorizontal: 12, marginBottom: 4, borderRadius: 12, padding: 12 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  waterTitle: { fontWeight: '700' },
  waterTotal: { opacity: 0.6 },
  waterBar: { height: 6, borderRadius: 3, marginBottom: 8 },
  waterBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  waterChip: {},

  mealSection: { marginBottom: 4 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  mealTitle: { flex: 1, fontWeight: '700', opacity: 0.7 },
  mealKcal: { opacity: 0.5 },
  mealMacroRow: { flexDirection: 'row', paddingLeft: 16, paddingBottom: 4 },
  entryItem: { paddingLeft: 16 },
  emptyMeal: { paddingLeft: 16, paddingBottom: 8, opacity: 0.4, fontStyle: 'italic', fontSize: 13 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
