import React, { useEffect, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Divider, useTheme, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { roundMacro } from '@/utils/macroCalculations';
import { MICRONUTRIENTS } from '@/constants/micronutrients';

type Props = NativeStackScreenProps<NutritionStackParamList, 'MacroDetail'>;

function GoalBar({
  label,
  current,
  goal,
  color,
  unit = 'g',
}: {
  label: string;
  current: number;
  goal: number | null;
  color: string;
  unit?: string;
}) {
  const theme = useTheme();
  const progress = goal ? Math.min(current / goal, 1) : 0;
  return (
    <View style={styles.goalRow}>
      <View style={styles.goalLabelRow}>
        <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
          {label}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {roundMacro(current)}{unit} {goal ? `/ ${goal}${unit}` : ''}
        </Text>
      </View>
      {goal ? (
        <ProgressBar progress={progress} color={color} style={styles.progressBar} />
      ) : (
        <View style={[styles.progressBar, { backgroundColor: color + '30', borderRadius: 4 }]}>
          <View style={{ width: `${Math.min(current / 50, 1) * 100}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
        </View>
      )}
    </View>
  );
}

function SubMacroRow({ label, value, color }: { label: string; value: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.subMacroRow}>
      <View style={[styles.subDot, { backgroundColor: color }]} />
      <Text variant="bodySmall" style={[styles.subMacroLabel, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <Text variant="bodySmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
        {roundMacro(value)}g
      </Text>
    </View>
  );
}

export default function MacroDetailScreen({ route, navigation }: Props) {
  const { date } = route.params;
  const theme = useTheme();
  const { data, load } = useDailyLog();
  const { goal, load: loadGoal } = useGoals();

  useEffect(() => {
    load(date);
    loadGoal(date);
  }, [date, load, loadGoal]);

  const t = data.totals;
  const netCarbs = Math.max(0, t.carbs_total - t.carbs_fiber);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text variant="titleMedium" style={styles.headerTitle}>Macro Details</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Protein */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness-outline" size={18} color="#4ECDC4" />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: '#4ECDC4' }]}>Protein</Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          <GoalBar
            label="Total Protein"
            current={t.protein}
            goal={goal?.protein_goal ?? null}
            color="#4ECDC4"
          />
        </Surface>

        {/* Carbohydrates */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf-outline" size={18} color="#45B7D1" />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: '#45B7D1' }]}>Carbohydrates</Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          <GoalBar
            label="Total Carbs"
            current={t.carbs_total}
            goal={goal?.carbs_goal ?? null}
            color="#45B7D1"
          />
          <View style={styles.subMacroSection}>
            <SubMacroRow label="Sugar" value={t.carbs_sugar} color="#FF6B6B" />
            <SubMacroRow label="Complex Carbs" value={t.carbs_complex} color="#45B7D1" />
            <SubMacroRow label="Dietary Fiber" value={t.carbs_fiber} color="#4CAF50" />
          </View>
          <Divider style={{ marginVertical: 10 }} />
          <View style={styles.netCarbsRow}>
            <Ionicons name="calculator-outline" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
              Net Carbs (carbs − fiber) ={' '}
              <Text style={{ fontWeight: '700', color: theme.colors.onSurface }}>{roundMacro(netCarbs)}g</Text>
            </Text>
          </View>
          {goal?.fiber_goal && (
            <View style={{ marginTop: 8 }}>
              <GoalBar
                label="Fiber Goal"
                current={t.carbs_fiber}
                goal={goal.fiber_goal}
                color="#4CAF50"
              />
            </View>
          )}
        </Surface>

        {/* Fat */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="water-outline" size={18} color="#FF9800" />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: '#FF9800' }]}>Fat</Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          <GoalBar
            label="Total Fat"
            current={t.fat_total}
            goal={goal?.fat_goal ?? null}
            color="#FF9800"
          />
          <View style={styles.subMacroSection}>
            <SubMacroRow label="Saturated Fat" value={t.fat_unsaturated} color="#FF5722" />
            <SubMacroRow label="Mono/Poly Unsaturated" value={t.fat_mono_poly} color="#FF9800" />
            <SubMacroRow label="Trans Fat" value={t.fat_trans} color="#9E9E9E" />
          </View>
        </Surface>

        {/* Calorie Breakdown */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame-outline" size={18} color="#FF6B6B" />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: '#FF6B6B' }]}>Calorie Breakdown</Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          <View style={styles.kcalGrid}>
            {[
              { label: 'From Protein', kcal: Math.round(t.protein * 4), color: '#4ECDC4' },
              { label: 'From Carbs', kcal: Math.round(t.carbs_total * 4), color: '#45B7D1' },
              { label: 'From Fat', kcal: Math.round(t.fat_total * 9), color: '#FF9800' },
            ].map((item) => (
              <View key={item.label} style={[styles.kcalCell, { backgroundColor: item.color + '18' }]}>
                <Text variant="titleMedium" style={{ fontWeight: '800', color: item.color }}>
                  {item.kcal}
                </Text>
                <Text variant="labelSmall" style={{ color: item.color, opacity: 0.8 }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Surface>

        {/* Micronutrients Reference */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="flask-outline" size={18} color={theme.colors.primary} />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
              Micronutrient Reference
            </Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
            Key vitamins & minerals and their daily needs. Track them by eating varied whole foods.
          </Text>
          {['fat-soluble vitamin', 'water-soluble vitamin', 'macromineral', 'trace mineral'].map((cat) => {
            const items = MICRONUTRIENTS.filter((n) => n.category === cat).slice(0, 4);
            if (!items.length) return null;
            const catLabel = cat === 'fat-soluble vitamin' ? 'Fat-Soluble Vitamins'
              : cat === 'water-soluble vitamin' ? 'Water-Soluble Vitamins'
              : cat === 'macromineral' ? 'Macrominerals'
              : 'Trace Minerals';
            return (
              <View key={cat} style={{ marginBottom: 12 }}>
                <Text variant="labelMedium" style={{ fontWeight: '700', color: theme.colors.onSurfaceVariant, marginBottom: 6 }}>
                  {catLabel}
                </Text>
                {items.map((n) => (
                  <View key={n.id} style={styles.microRow}>
                    <Text style={{ fontSize: 16 }}>{n.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text variant="bodySmall" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                        {n.name}
                      </Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        RDA: {n.rda}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('MicronutrientDetail', { id: n.id })}
                      style={styles.microDetailBtn}
                    >
                      <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}
          <TouchableOpacity
            onPress={() => navigation.navigate('Micronutrients')}
            style={[styles.viewAllBtn, { borderColor: theme.colors.primary }]}
          >
            <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>
              View Full Micronutrient Guide
            </Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </Surface>
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
  headerTitle: { color: '#fff', fontWeight: '700', flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontWeight: '700' },
  goalRow: { marginBottom: 10 },
  goalLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressBar: { height: 8, borderRadius: 4 },
  subMacroSection: { marginTop: 10, gap: 6 },
  subMacroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subDot: { width: 8, height: 8, borderRadius: 4 },
  subMacroLabel: { flex: 1 },
  netCarbsRow: { flexDirection: 'row', alignItems: 'center' },
  kcalGrid: { flexDirection: 'row', gap: 8 },
  kcalCell: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  microRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  microDetailBtn: { padding: 4 },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 8,
  },
});
