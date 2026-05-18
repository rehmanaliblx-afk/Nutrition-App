import React, { useEffect, useCallback, useState } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Divider, Button, Surface, ProgressBar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { useWater } from '@/hooks/useWater';
import { useWeight } from '@/hooks/useWeight';
import { todayString, formatDateDisplay, addDays, isToday } from '@/utils/dateUtils';
import { MACRO_COLORS, MEAL_TYPES, MEAL_LABELS } from '@/constants/macros';
import { roundMacro } from '@/utils/macroCalculations';
import CalorieRing from '@/components/common/CalorieRing';
import MacroBar from '@/components/common/MacroBar';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const theme = useTheme();
  const drawerNav = useNavigation();
  const [date, setDate] = useState(todayString());
  const { data, loading, load } = useDailyLog();
  const { goal, load: loadGoal } = useGoals();
  const { total: waterTotal, load: loadWater } = useWater();
  const { history: weightHistory, loadHistory: loadWeight } = useWeight();

  const refresh = useCallback(() => {
    load(date);
    loadGoal(date);
    loadWater(date);
    loadWeight(5);
  }, [date, load, loadGoal, loadWater, loadWeight]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => drawerNav.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color="#fff" />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.appBarTitle}>Dashboard</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {/* Date Nav */}
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
              <Text variant="labelSmall" style={styles.subLabel}>Saturated</Text>
            </View>
            <View style={styles.subItem}>
              <Text variant="titleSmall">{roundMacro(data.totals.fat_mono_poly)}g</Text>
              <Text variant="labelSmall" style={styles.subLabel}>Mono/Poly Unsat.</Text>
            </View>
            <View style={styles.subItem}>
              <Text variant="titleSmall">{roundMacro(data.totals.fat_trans)}g</Text>
              <Text variant="labelSmall" style={styles.subLabel}>Trans</Text>
            </View>
          </View>
        </Surface>

        {/* Water & Weight row */}
        <View style={styles.quickRow}>
          <Surface style={[styles.quickCard, { flex: 1 }]} elevation={1}>
            <Text variant="labelMedium" style={styles.subTitle}>💧 Water</Text>
            <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
              {Math.round(waterTotal)} <Text variant="labelSmall" style={{ fontWeight: 'normal', opacity: 0.6 }}>/ {goal?.water_goal_ml ?? 2000} ml</Text>
            </Text>
            <ProgressBar
              progress={Math.min(waterTotal / (goal?.water_goal_ml ?? 2000), 1)}
              color="#64B5F6"
              style={{ height: 5, borderRadius: 3, marginTop: 6 }}
            />
          </Surface>
          {weightHistory.length > 0 && (
            <Surface style={[styles.quickCard, { flex: 1 }]} elevation={1}>
              <Text variant="labelMedium" style={styles.subTitle}>⚖️ Weight</Text>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                {weightHistory[0].weight_kg} kg
              </Text>
              {weightHistory.length >= 2 && (
                <Text variant="labelSmall" style={{ opacity: 0.5 }}>
                  {(weightHistory[0].weight_kg - weightHistory[1].weight_kg) >= 0 ? '+' : ''}
                  {(weightHistory[0].weight_kg - weightHistory[1].weight_kg).toFixed(1)} kg
                </Text>
              )}
            </Surface>
          )}
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  menuBtn: { padding: 4, marginRight: 8 },
  appBarTitle: { color: '#fff', fontWeight: '700', flex: 1 },
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
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: { borderRadius: 12, padding: 12 },
});
