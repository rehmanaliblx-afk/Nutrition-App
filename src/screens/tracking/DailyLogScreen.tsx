import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { FAB, Text, Divider, List, IconButton, Button, Chip, ProgressBar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrackingStackParamList } from '@/navigation/types';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { useWater } from '@/hooks/useWater';
import { copyMealEntries } from '@/db/trackingDao';
import { MEAL_TYPES, MEAL_LABELS, MealType } from '@/constants/macros';
import { todayString, formatDateDisplay, addDays, isToday } from '@/utils/dateUtils';
import { roundMacro } from '@/utils/macroCalculations';
import { useDatabase } from '@/context/DatabaseContext';
import GoalsScreen from './GoalsScreen';

type Props = NativeStackScreenProps<TrackingStackParamList, 'DailyLog'>;

const WATER_QUICK = [250, 500, 750, 1000];

export default function DailyLogScreen({ route, navigation }: Props) {
  const { isReady } = useDatabase();
  const [date, setDate] = useState(route.params?.date ?? todayString());
  const { data, loading, load, removeEntry } = useDailyLog();
  const { goal, load: loadGoal } = useGoals();
  const { total: waterTotal, load: loadWater, add: addWater } = useWater();
  const [showGoals, setShowGoals] = useState(false);

  const refresh = useCallback(() => {
    if (!isReady) return;
    load(date);
    loadGoal(date);
    loadWater(date);
  }, [isReady, date, load, loadGoal, loadWater]);

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

  const handleCopyMeal = (meal: MealType) => {
    const prevDay = addDays(date, -1);
    Alert.alert(
      'Copy Meal',
      `Copy ${MEAL_LABELS[meal]} from ${isToday(prevDay) ? 'yesterday' : formatDateDisplay(prevDay)} to today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: async () => {
            try {
              await copyMealEntries(prevDay, date, meal);
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.dateRow}>
        <IconButton icon="chevron-left" onPress={() => setDate(addDays(date, -1))} />
        <Text variant="titleMedium" style={styles.dateText}>
          {isToday(date) ? 'Today' : formatDateDisplay(date)}
        </Text>
        <IconButton icon="chevron-right" onPress={() => setDate(addDays(date, 1))} disabled={isToday(date)} />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text variant="headlineSmall" style={styles.kcalNum}>{roundMacro(data.totalKcal, 0)}</Text>
          <Text variant="labelSmall" style={styles.summaryLabel}>
            {kcalGoal ? `/ ${kcalGoal} kcal` : 'kcal'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text variant="titleMedium">{roundMacro(data.totals.protein)}g</Text>
          <Text variant="labelSmall" style={styles.summaryLabel}>Protein</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text variant="titleMedium">{roundMacro(data.totals.carbs_total)}g</Text>
          <Text variant="labelSmall" style={styles.summaryLabel}>Carbs</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text variant="titleMedium">{roundMacro(data.totals.fat_total)}g</Text>
          <Text variant="labelSmall" style={styles.summaryLabel}>Fat</Text>
        </View>
        <Button compact mode="text" icon="flag" onPress={() => setShowGoals(true)}>Goals</Button>
      </View>
      <Divider />

      <ScrollView contentContainerStyle={styles.content}>
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
              <Chip
                key={ml}
                compact
                onPress={() => addWater(date, ml)}
                style={styles.waterChip}
                icon="plus"
              >
                {ml}ml
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Meal Sections */}
        {MEAL_TYPES.map((meal) => {
          const entries = data.entries[meal];
          const mealKcal = roundMacro(entries.reduce((s, e) => s + e.kcal, 0), 0);
          return (
            <View key={meal} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Text variant="titleSmall" style={styles.mealTitle}>{MEAL_LABELS[meal]}</Text>
                <Text variant="labelSmall" style={styles.mealKcal}>{mealKcal > 0 ? `${mealKcal} kcal` : ''}</Text>
                <IconButton
                  icon="content-copy"
                  size={16}
                  onPress={() => handleCopyMeal(meal as MealType)}
                  accessibilityLabel="Copy from yesterday"
                />
                <IconButton
                  icon="plus"
                  size={18}
                  onPress={() => navigation.navigate('AddMealEntry', { date, mealType: meal as MealType })}
                />
              </View>
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
        onPress={() => navigation.navigate('AddMealEntry', { date, mealType: 'breakfast' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateText: { fontWeight: 'bold', minWidth: 140, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, paddingBottom: 8 },
  summaryItem: { alignItems: 'center' },
  kcalNum: { fontWeight: 'bold', color: '#FF6B6B' },
  summaryLabel: { opacity: 0.6 },
  content: { paddingBottom: 80 },
  waterCard: { margin: 12, borderRadius: 12, padding: 12 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  waterTitle: { fontWeight: '700' },
  waterTotal: { opacity: 0.6 },
  waterBar: { height: 6, borderRadius: 3, marginBottom: 8 },
  waterBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  waterChip: {},
  mealSection: { marginBottom: 4 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  mealTitle: { flex: 1, fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 },
  mealKcal: { opacity: 0.5 },
  entryItem: { paddingLeft: 16 },
  emptyMeal: { paddingLeft: 16, paddingBottom: 8, opacity: 0.4, fontStyle: 'italic', fontSize: 13 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
