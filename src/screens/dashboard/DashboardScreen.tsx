import React, { useEffect, useCallback, useState } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { Text, Divider, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { todayString, formatDateDisplay, addDays, isToday } from '@/utils/dateUtils';
import { MACRO_COLORS, MEAL_TYPES, MEAL_LABELS } from '@/constants/macros';
import { roundMacro } from '@/utils/macroCalculations';
import CalorieRing from '@/components/common/CalorieRing';
import MacroBar from '@/components/common/MacroBar';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const [date, setDate] = useState(todayString());
  const { data, loading, load } = useDailyLog();
  const { goal, load: loadGoal } = useGoals();

  const refresh = useCallback(() => {
    load(date);
    loadGoal(date);
  }, [date, load, loadGoal]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Button icon="chevron-left" mode="text" compact onPress={() => setDate(addDays(date, -1))}>
            {''}
          </Button>
          <Text variant="titleMedium" style={styles.dateText}>
            {isToday(date) ? 'Today' : formatDateDisplay(date)}
          </Text>
          <Button icon="chevron-right" mode="text" compact onPress={() => setDate(addDays(date, 1))} disabled={isToday(date)}>
            {''}
          </Button>
        </View>

        {/* Calorie Ring */}
        <View style={styles.ringRow}>
          <CalorieRing current={data.totalKcal} goal={goal?.kcal_goal ?? null} />
        </View>

        {/* Macro Bars */}
        <Surface style={styles.macroCard} elevation={1}>
          <MacroBar label="Protein" current={data.totals.protein} goal={goal?.protein_goal ?? null} color={MACRO_COLORS.protein} />
          <MacroBar label="Carbs" current={data.totals.carbs_total} goal={goal?.carbs_goal ?? null} color={MACRO_COLORS.carbs} />
          <MacroBar label="Fat" current={data.totals.fat_total} goal={goal?.fat_goal ?? null} color={MACRO_COLORS.fat} />
        </Surface>

        {/* Sub-macro breakdown */}
        <Surface style={styles.macroCard} elevation={1}>
          <Text variant="labelMedium" style={styles.subTitle}>Carb Breakdown</Text>
          <View style={styles.subRow}>
            <View style={styles.subItem}>
              <Text variant="titleSmall">{roundMacro(data.totals.carbs_sugar)}g</Text>
              <Text variant="labelSmall" style={styles.subLabel}>Sugar</Text>
            </View>
            <View style={styles.subItem}>
              <Text variant="titleSmall">{roundMacro(data.totals.carbs_complex)}g</Text>
              <Text variant="labelSmall" style={styles.subLabel}>Complex</Text>
            </View>
            <View style={styles.subItem}>
              <Text variant="titleSmall">{roundMacro(data.totals.carbs_fiber)}g</Text>
              <Text variant="labelSmall" style={styles.subLabel}>Fiber</Text>
            </View>
          </View>
          <Divider style={styles.innerDivider} />
          <Text variant="labelMedium" style={styles.subTitle}>Fat Breakdown</Text>
          <View style={styles.subRow}>
            <View style={styles.subItem}>
              <Text variant="titleSmall">{roundMacro(data.totals.fat_unsaturated)}g</Text>
              <Text variant="labelSmall" style={styles.subLabel}>Unsat.</Text>
            </View>
            <View style={styles.subItem}>
              <Text variant="titleSmall">{roundMacro(data.totals.fat_mono_poly)}g</Text>
              <Text variant="labelSmall" style={styles.subLabel}>Mono/Poly</Text>
            </View>
            <View style={styles.subItem}>
              <Text variant="titleSmall">{roundMacro(data.totals.fat_trans)}g</Text>
              <Text variant="labelSmall" style={styles.subLabel}>Trans</Text>
            </View>
          </View>
        </Surface>

        {/* Meal summaries */}
        <Surface style={styles.macroCard} elevation={1}>
          <Text variant="titleSmall" style={styles.mealSummaryTitle}>Meals</Text>
          {MEAL_TYPES.map((meal) => {
            const entries = data.entries[meal];
            const mealKcal = Math.round(entries.reduce((s, e) => s + e.kcal, 0));
            return (
              <View key={meal} style={styles.mealRow}>
                <View style={styles.mealIcon}>
                  <Ionicons
                    name={meal === 'breakfast' ? 'sunny-outline' : meal === 'lunch' ? 'partly-sunny-outline' : meal === 'dinner' ? 'moon-outline' : 'cafe-outline'}
                    size={18}
                    color={MACRO_COLORS.kcal}
                  />
                </View>
                <Text variant="bodyMedium" style={styles.mealName}>{MEAL_LABELS[meal]}</Text>
                <Text variant="bodySmall" style={styles.mealKcal}>
                  {entries.length > 0 ? `${mealKcal} kcal (${entries.length} items)` : 'Empty'}
                </Text>
              </View>
            );
          })}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateText: { fontWeight: 'bold', flex: 1, textAlign: 'center' },
  ringRow: { alignItems: 'center', paddingVertical: 8 },
  macroCard: { borderRadius: 12, padding: 16 },
  subTitle: { fontWeight: '600', marginBottom: 8, opacity: 0.7 },
  subRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  subItem: { alignItems: 'center', gap: 2 },
  subLabel: { opacity: 0.5 },
  innerDivider: { marginVertical: 10 },
  mealSummaryTitle: { fontWeight: '700', marginBottom: 10 },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 10 },
  mealIcon: { width: 24, alignItems: 'center' },
  mealName: { flex: 1 },
  mealKcal: { opacity: 0.6 },
});
