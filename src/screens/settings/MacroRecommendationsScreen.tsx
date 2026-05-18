import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  TextInput,
  Chip,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Rect } from 'react-native-svg';
import { NutritionStackParamList } from '@/navigation/types';
import {
  getRecommendation,
  calcBMR,
  calcTDEE,
  MacroRecommendation,
  Goal,
  ActivityLevel,
  Sex,
  ACTIVITY_LABELS,
  GOAL_LABELS,
} from '@/utils/macroRecommendations';
import { useGoals } from '@/hooks/useGoals';
import { todayString } from '@/utils/dateUtils';

type Props = NativeStackScreenProps<NutritionStackParamList, 'MacroRecommendations'>;

const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const GOALS: Goal[] = ['cut', 'maintain', 'bulk', 'recomp'];

const BAR_COLORS = {
  protein: '#4ECDC4',
  carbs: '#45B7D1',
  fat: '#FFA07A',
};

export default function MacroRecommendationsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { save: saveGoal } = useGoals();

  // Form inputs
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');

  const [result, setResult] = useState<MacroRecommendation | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);

  const handleCalculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    if (isNaN(w) || w <= 0) { Alert.alert('Input Error', 'Please enter a valid weight (kg).'); return; }
    if (isNaN(h) || h <= 0) { Alert.alert('Input Error', 'Please enter a valid height (cm).'); return; }
    if (isNaN(a) || a <= 0) { Alert.alert('Input Error', 'Please enter a valid age.'); return; }

    const calcedBmr = calcBMR(w, h, a, sex);
    const calcedTdee = calcTDEE(calcedBmr, activityLevel);
    const rec = getRecommendation(w, h, a, sex, activityLevel, goal);

    setBmr(Math.round(calcedBmr));
    setTdee(Math.round(calcedTdee));
    setResult(rec);
  };

  const handleApplyGoal = async () => {
    if (!result) return;
    setApplying(true);
    try {
      await saveGoal({
        date: todayString(),
        kcal_goal: result.kcal,
        protein_goal: result.protein,
        carbs_goal: result.carbs,
        fat_goal: result.fat,
        water_goal_ml: 2000,
      });
      Alert.alert('Applied!', 'Your daily goal has been updated.');
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setApplying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.appBar}>
          <IconButton
            icon="arrow-left"
            iconColor="#fff"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          />
          <Text variant="titleLarge" style={styles.appBarTitle}>Macro Recommendations</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Input Form */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Your Stats</Text>
          <Divider style={styles.divider} />

          <View style={styles.row}>
            <TextInput
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              mode="outlined"
              dense
              style={styles.halfInput}
            />
            <TextInput
              label="Height (cm)"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              mode="outlined"
              dense
              style={styles.halfInput}
            />
          </View>

          <TextInput
            label="Age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            mode="outlined"
            dense
          />

          {/* Sex selector */}
          <Text variant="labelMedium" style={styles.fieldLabel}>Sex</Text>
          <View style={styles.chipRow}>
            {(['male', 'female'] as Sex[]).map((s) => (
              <Chip
                key={s}
                selected={sex === s}
                onPress={() => setSex(s)}
                style={styles.chip}
              >
                {s === 'male' ? 'Male' : 'Female'}
              </Chip>
            ))}
          </View>

          {/* Activity Level */}
          <Text variant="labelMedium" style={styles.fieldLabel}>Activity Level</Text>
          <View style={styles.chipColumnWrap}>
            {ACTIVITY_LEVELS.map((level) => (
              <Chip
                key={level}
                selected={activityLevel === level}
                onPress={() => setActivityLevel(level)}
                style={styles.wideChip}
                compact
              >
                {ACTIVITY_LABELS[level]}
              </Chip>
            ))}
          </View>

          {/* Goal */}
          <Text variant="labelMedium" style={styles.fieldLabel}>Goal</Text>
          <View style={styles.chipRow}>
            {GOALS.map((g) => (
              <Chip
                key={g}
                selected={goal === g}
                onPress={() => setGoal(g)}
                style={styles.chip}
                compact
              >
                {GOAL_LABELS[g].split(' ')[0]}
              </Chip>
            ))}
          </View>

          <Button
            mode="contained"
            icon="calculator"
            onPress={handleCalculate}
            style={styles.calcBtn}
          >
            Calculate
          </Button>
        </Surface>

        {/* Results */}
        {result && bmr !== null && tdee !== null && (
          <Surface style={styles.card} elevation={2}>
            <Text variant="titleMedium" style={styles.cardTitle}>Results</Text>
            <Divider style={styles.divider} />

            <View style={styles.metaRow}>
              <MetricItem label="BMR" value={`${bmr} kcal`} />
              <MetricItem label="TDEE" value={`${tdee} kcal`} />
              <MetricItem label="Target" value={`${result.kcal} kcal`} color="#FF6B6B" />
            </View>

            <Divider style={styles.divider} />
            <Text variant="labelMedium" style={styles.macroLabel}>Daily Macros</Text>
            <View style={styles.macroGrid}>
              <MetricItem label="Protein" value={`${result.protein}g`} color={BAR_COLORS.protein} />
              <MetricItem label="Carbs" value={`${result.carbs}g`} color={BAR_COLORS.carbs} />
              <MetricItem label="Fat" value={`${result.fat}g`} color={BAR_COLORS.fat} />
            </View>

            {/* Macro split bars */}
            <Text variant="labelSmall" style={styles.splitLabel}>Macro Split</Text>
            <MacroSplitBar
              proteinPct={result.proteinPct}
              carbsPct={result.carbsPct}
              fatPct={result.fatPct}
            />
            <View style={styles.splitLegend}>
              <LegendDot color={BAR_COLORS.protein} label={`Protein ${result.proteinPct}%`} />
              <LegendDot color={BAR_COLORS.carbs} label={`Carbs ${result.carbsPct}%`} />
              <LegendDot color={BAR_COLORS.fat} label={`Fat ${result.fatPct}%`} />
            </View>

            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.notes}>{result.notes}</Text>

            <Button
              mode="contained"
              icon="flag-checkered"
              onPress={handleApplyGoal}
              loading={applying}
              style={styles.applyBtn}
            >
              Apply as Daily Goal
            </Button>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
}

function MetricItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={metricStyles.container}>
      <Text variant="titleMedium" style={[metricStyles.value, color ? { color } : undefined]}>
        {value}
      </Text>
      <Text variant="labelSmall" style={metricStyles.label}>{label}</Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1 },
  value: { fontWeight: '700' },
  label: { opacity: 0.5 },
});

function MacroSplitBar({ proteinPct, carbsPct, fatPct }: { proteinPct: number; carbsPct: number; fatPct: number }) {
  const totalW = 280;
  const h = 24;
  const pW = (proteinPct / 100) * totalW;
  const cW = (carbsPct / 100) * totalW;
  const fW = totalW - pW - cW;

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={totalW} height={h}>
        <Rect x={0} y={0} width={pW} height={h} rx={0} fill={BAR_COLORS.protein} />
        <Rect x={pW} y={0} width={cW} height={h} rx={0} fill={BAR_COLORS.carbs} />
        <Rect x={pW + cW} y={0} width={fW} height={h} rx={0} fill={BAR_COLORS.fat} />
      </Svg>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={legendStyles.row}>
      <View style={[legendStyles.dot, { backgroundColor: color }]} />
      <Text style={legendStyles.label}>{label}</Text>
    </View>
  );
}

const legendStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 12, opacity: 0.7 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, paddingVertical: 4 },
  backBtn: { margin: 0 },
  appBarTitle: { color: '#fff', fontWeight: '700', flex: 1 },

  content: { padding: 12, gap: 12, paddingBottom: 40 },

  card: { borderRadius: 12, padding: 16, gap: 8 },
  cardTitle: { fontWeight: '700' },
  divider: { marginVertical: 4 },

  row: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },

  fieldLabel: { fontWeight: '600', opacity: 0.7, marginTop: 8, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipColumnWrap: { flexDirection: 'column', gap: 4 },
  chip: {},
  wideChip: { alignSelf: 'flex-start' },

  calcBtn: { marginTop: 8 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  macroLabel: { fontWeight: '600', opacity: 0.6, marginBottom: 4 },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },

  splitLabel: { opacity: 0.6, marginTop: 4 },
  splitLegend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },

  notes: { opacity: 0.6, fontStyle: 'italic', lineHeight: 18 },
  applyBtn: { marginTop: 8 },
});
