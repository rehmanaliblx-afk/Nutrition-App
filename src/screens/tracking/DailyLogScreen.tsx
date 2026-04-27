import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { FAB, Text, Divider, List, IconButton, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrackingStackParamList } from '@/navigation/types';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { MEAL_TYPES, MEAL_LABELS, MealType } from '@/constants/macros';
import { todayString, formatDateDisplay, addDays, isToday } from '@/utils/dateUtils';
import { roundMacro } from '@/utils/macroCalculations';
import { useDatabase } from '@/context/DatabaseContext';
import GoalsScreen from './GoalsScreen';

type Props = NativeStackScreenProps<TrackingStackParamList, 'DailyLog'>;

export default function DailyLogScreen({ route, navigation }: Props) {
  const { isReady } = useDatabase();
  const [date, setDate] = useState(route.params?.date ?? todayString());
  const { data, loading, load, removeEntry } = useDailyLog();
  const { goal, load: loadGoal } = useGoals();
  const [showGoals, setShowGoals] = useState(false);

  const refresh = useCallback(() => {
    if (!isReady) return;
    load(date);
    loadGoal(date);
  }, [isReady, date, load, loadGoal]);

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

  if (showGoals) {
    return <GoalsScreen onSaved={() => { setShowGoals(false); refresh(); }} />;
  }

  const kcalGoal = goal?.kcal_goal ?? null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Date navigation */}
      <View style={styles.dateRow}>
        <IconButton icon="chevron-left" onPress={() => setDate(addDays(date, -1))} />
        <Text variant="titleMedium" style={styles.dateText}>
          {isToday(date) ? 'Today' : formatDateDisplay(date)}
        </Text>
        <IconButton icon="chevron-right" onPress={() => setDate(addDays(date, 1))} disabled={isToday(date)} />
      </View>

      {/* Daily summary */}
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
        {MEAL_TYPES.map((meal) => {
          const entries = data.entries[meal];
          const mealKcal = roundMacro(entries.reduce((s, e) => s + e.kcal, 0), 0);
          return (
            <View key={meal} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Text variant="titleSmall" style={styles.mealTitle}>{MEAL_LABELS[meal]}</Text>
                <Text variant="labelSmall" style={styles.mealKcal}>{mealKcal > 0 ? `${mealKcal} kcal` : ''}</Text>
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
  mealSection: { marginBottom: 4 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  mealTitle: { flex: 1, fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 },
  mealKcal: { opacity: 0.5 },
  entryItem: { paddingLeft: 16 },
  emptyMeal: { paddingLeft: 16, paddingBottom: 8, opacity: 0.4, fontStyle: 'italic', fontSize: 13 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
