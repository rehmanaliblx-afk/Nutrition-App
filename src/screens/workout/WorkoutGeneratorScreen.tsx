import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text, Surface, Chip, Button, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '@/navigation/types';
import {
  generateWorkout,
  GeneratedWorkout,
  SplitType,
  EquipmentFilter,
  SPLIT_LABELS,
  EQUIPMENT_LABELS,
} from '@/utils/workoutGenerator';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutGenerator'>;

type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type Focus = 'hypertrophy' | 'strength';

const SPLIT_KEYS = Object.keys(SPLIT_LABELS) as SplitType[];
const EQUIPMENT_KEYS = Object.keys(EQUIPMENT_LABELS) as EquipmentFilter[];
const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
const FOCUS_OPTIONS: { value: Focus; label: string }[] = [
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'strength', label: 'Strength' },
];

function formatRest(sec: number): string {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60 > 0 ? `${sec % 60}s` : ''}`.trim();
}

export default function WorkoutGeneratorScreen({ navigation }: Props) {
  const theme = useTheme();

  const [split, setSplit] = useState<SplitType>('push');
  const [equipment, setEquipment] = useState<EquipmentFilter>('any');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [focus, setFocus] = useState<Focus>('hypertrophy');
  const [result, setResult] = useState<GeneratedWorkout | null>(null);

  const handleGenerate = () => {
    try {
      const workout = generateWorkout(split, equipment, difficulty, focus);
      setResult(workout);
    } catch {
      Alert.alert('Could not generate workout', 'No exercises match the selected filters. Try different options.');
    }
  };

  const handleSaveAsPlan = () => {
    if (!result) return;
    // Navigate to plan form with a note
    Alert.alert('Save as Plan', `"${result.name}" would be saved as a new workout plan. Plan form integration coming soon.`, [
      { text: 'OK' },
    ]);
  };

  const SectionCard = ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    children: React.ReactNode;
  }) => (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
        <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>{title}</Text>
      </View>
      <Divider style={{ marginBottom: 12 }} />
      {children}
    </Surface>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.headerTitle}>Workout Generator</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Split */}
        <SectionCard title="Step 1 — Training Split" icon="git-branch-outline">
          <View style={styles.chipGroup}>
            {SPLIT_KEYS.map((key) => (
              <Chip
                key={key}
                selected={split === key}
                onPress={() => setSplit(key)}
                style={[
                  styles.chip,
                  split === key && { backgroundColor: theme.colors.primaryContainer },
                ]}
                textStyle={{ color: split === key ? theme.colors.primary : theme.colors.onSurface, fontSize: 12 }}
              >
                {SPLIT_LABELS[key].split('(')[0].trim()}
              </Chip>
            ))}
          </View>
        </SectionCard>

        {/* Step 2: Equipment */}
        <SectionCard title="Step 2 — Equipment" icon="barbell-outline">
          <View style={styles.chipGroup}>
            {EQUIPMENT_KEYS.map((key) => (
              <Chip
                key={key}
                selected={equipment === key}
                onPress={() => setEquipment(key)}
                style={[
                  styles.chip,
                  equipment === key && { backgroundColor: theme.colors.primaryContainer },
                ]}
                textStyle={{ color: equipment === key ? theme.colors.primary : theme.colors.onSurface, fontSize: 12 }}
              >
                {EQUIPMENT_LABELS[key]}
              </Chip>
            ))}
          </View>
        </SectionCard>

        {/* Step 3: Difficulty */}
        <SectionCard title="Step 3 — Difficulty" icon="speedometer-outline">
          <View style={styles.chipGroup}>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                selected={difficulty === opt.value}
                onPress={() => setDifficulty(opt.value)}
                style={[
                  styles.chip,
                  difficulty === opt.value && { backgroundColor: theme.colors.primaryContainer },
                ]}
                textStyle={{ color: difficulty === opt.value ? theme.colors.primary : theme.colors.onSurface, fontSize: 12 }}
              >
                {opt.label}
              </Chip>
            ))}
          </View>
        </SectionCard>

        {/* Step 4: Focus */}
        <SectionCard title="Step 4 — Training Focus" icon="flame-outline">
          <View style={styles.chipGroup}>
            {FOCUS_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                selected={focus === opt.value}
                onPress={() => setFocus(opt.value)}
                style={[
                  styles.chip,
                  focus === opt.value && { backgroundColor: theme.colors.primaryContainer },
                ]}
                textStyle={{ color: focus === opt.value ? theme.colors.primary : theme.colors.onSurface, fontSize: 12 }}
              >
                {opt.label}
              </Chip>
            ))}
          </View>
        </SectionCard>

        <Button
          mode="contained"
          onPress={handleGenerate}
          style={[styles.generateBtn, { backgroundColor: theme.colors.primary }]}
          contentStyle={{ paddingVertical: 6 }}
          icon="flash-outline"
        >
          Generate Workout
        </Button>

        {/* Results */}
        {result && (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.primary} />
              <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
                {result.name}
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
              Est. {result.estimatedMinutes} min · {result.exercises.length} exercises
            </Text>
            <Divider style={{ marginBottom: 12 }} />

            {result.exercises.map((ex, i) => (
              <React.Fragment key={ex.exerciseId}>
                {i > 0 && <Divider style={{ marginVertical: 10 }} />}
                <View style={styles.exRow}>
                  <View style={[styles.exNumBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text style={[styles.exNumText, { color: theme.colors.primary }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.exInfo}>
                    <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                      {ex.exerciseName}
                    </Text>
                    <View style={styles.exMeta}>
                      <View style={[styles.metaChip, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                          {ex.sets} sets × {ex.repsRange} reps
                        </Text>
                      </View>
                      <View style={[styles.metaChip, { backgroundColor: theme.colors.secondaryContainer }]}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer }}>
                          {formatRest(ex.restSec)} rest
                        </Text>
                      </View>
                    </View>
                    {ex.notes ? (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, fontStyle: 'italic' }}>
                        {ex.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </React.Fragment>
            ))}

            <Divider style={{ marginTop: 16, marginBottom: 12 }} />
            <Button
              mode="outlined"
              onPress={handleSaveAsPlan}
              icon="bookmark-outline"
              style={{ borderColor: theme.colors.primary }}
              textColor={theme.colors.primary}
            >
              Save as Plan
            </Button>
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
  content: { padding: 16, paddingBottom: 48, gap: 14 },
  card: { borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontWeight: '700', flex: 1 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20 },
  generateBtn: { borderRadius: 14 },
  exRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  exNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  exNumText: { fontWeight: '700', fontSize: 13 },
  exInfo: { flex: 1 },
  exMeta: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  metaChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});
