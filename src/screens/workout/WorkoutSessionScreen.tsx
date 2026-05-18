import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Surface, TextInput, Button, Chip, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '@/navigation/types';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { useWorkoutPlans } from '@/hooks/useWorkoutPlans';
import { EXERCISES } from '@/constants/exercises';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutSession'>;

interface SetData {
  id: number | null; // null until persisted
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
}

interface ExerciseEntry {
  exerciseId: string;
  exerciseName: string;
  sets: SetData[];
}

const REST_DURATION = 90;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function WorkoutSessionScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const params = route.params ?? {};
  const planId = params.planId ?? null;
  const planName = params.planName ?? null;

  const { startSession, endSession, addSet, updateSet } = useWorkoutSession();
  const { getById } = useWorkoutPlans();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);

  const elapsedRef = useRef(0);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<number | null>(null);

  // Start session + load plan exercises
  useEffect(() => {
    let mounted = true;
    (async () => {
      const id = await startSession(planId ?? null, planName ?? null);
      if (!mounted) return;
      sessionIdRef.current = id;
      setSessionId(id);

      if (planId) {
        const plan = await getById(planId);
        if (plan && mounted) {
          const entries: ExerciseEntry[] = plan.exercises.map((pe) => {
            const ex = EXERCISES.find((e) => e.id === pe.exercise_id);
            return {
              exerciseId: pe.exercise_id,
              exerciseName: ex?.name ?? pe.exercise_id,
              sets: [{ id: null, setNumber: 1, weight: '', reps: '', completed: false }],
            };
          });
          setExercises(entries);
        }
      }
    })();

    // Start elapsed timer
    elapsedIntervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSec(elapsedRef.current);
    }, 1000);

    return () => {
      mounted = false;
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
      if (restRef.current) clearInterval(restRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rest timer countdown
  useEffect(() => {
    if (restTimer === null) {
      if (restRef.current) {
        clearInterval(restRef.current);
        restRef.current = null;
      }
      return;
    }
    if (restRef.current) clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(restRef.current!);
          restRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (restRef.current) clearInterval(restRef.current);
    };
  }, [restTimer !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddSet = useCallback((exIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const entry = { ...updated[exIdx] };
      const nextNum = entry.sets.length + 1;
      entry.sets = [...entry.sets, { id: null, setNumber: nextNum, weight: '', reps: '', completed: false }];
      updated[exIdx] = entry;
      return updated;
    });
  }, []);

  const handleWeightChange = useCallback((exIdx: number, setIdx: number, val: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      const entry = { ...updated[exIdx] };
      const sets = [...entry.sets];
      sets[setIdx] = { ...sets[setIdx], weight: val };
      entry.sets = sets;
      updated[exIdx] = entry;
      return updated;
    });
  }, []);

  const handleRepsChange = useCallback((exIdx: number, setIdx: number, val: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      const entry = { ...updated[exIdx] };
      const sets = [...entry.sets];
      sets[setIdx] = { ...sets[setIdx], reps: val };
      entry.sets = sets;
      updated[exIdx] = entry;
      return updated;
    });
  }, []);

  const handleCompleteSet = useCallback(
    async (exIdx: number, setIdx: number) => {
      const sid = sessionIdRef.current;
      if (sid == null) return;
      const entry = exercises[exIdx];
      const setData = entry.sets[setIdx];
      const weightKg = parseFloat(setData.weight) || null;
      const reps = parseInt(setData.reps, 10) || null;

      let dbId = setData.id;
      if (dbId === null) {
        dbId = await addSet(sid, entry.exerciseId, entry.exerciseName, setData.setNumber, weightKg, reps);
        await updateSet(dbId, weightKg, reps, true);
      } else {
        await updateSet(dbId, weightKg, reps, true);
      }

      setExercises((prev) => {
        const updated = [...prev];
        const ent = { ...updated[exIdx] };
        const sets = [...ent.sets];
        sets[setIdx] = { ...sets[setIdx], id: dbId, completed: true, weight: setData.weight, reps: setData.reps };
        ent.sets = sets;
        updated[exIdx] = ent;
        return updated;
      });

      // Start rest timer
      setRestTimer(REST_DURATION);
    },
    [exercises, addSet, updateSet]
  );

  const handleFinish = useCallback(() => {
    Alert.alert('Finish Workout', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        style: 'default',
        onPress: async () => {
          const sid = sessionIdRef.current;
          if (sid == null) {
            navigation.goBack();
            return;
          }
          const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);
          await endSession(sid, elapsedRef.current, totalSets);
          if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
          if (restRef.current) clearInterval(restRef.current);
          navigation.goBack();
        },
      },
    ]);
  }, [exercises, endSession, navigation]);

  const renderSetRow = (exIdx: number, setData: SetData, setIdx: number) => (
    <View key={setIdx} style={styles.setRow}>
      <View style={[styles.setNumBadge, { backgroundColor: theme.colors.primaryContainer }]}>
        <Text style={[styles.setNumText, { color: theme.colors.primary }]}>{setData.setNumber}</Text>
      </View>
      <TextInput
        style={styles.setInput}
        mode="outlined"
        dense
        label="kg"
        keyboardType="decimal-pad"
        value={setData.weight}
        onChangeText={(v) => handleWeightChange(exIdx, setIdx, v)}
        editable={!setData.completed}
        outlineStyle={{ borderRadius: 8 }}
      />
      <TextInput
        style={styles.setInput}
        mode="outlined"
        dense
        label="reps"
        keyboardType="number-pad"
        value={setData.reps}
        onChangeText={(v) => handleRepsChange(exIdx, setIdx, v)}
        editable={!setData.completed}
        outlineStyle={{ borderRadius: 8 }}
      />
      <TouchableOpacity
        onPress={() => !setData.completed && handleCompleteSet(exIdx, setIdx)}
        style={[
          styles.checkBtn,
          {
            backgroundColor: setData.completed ? theme.colors.primary : theme.colors.surfaceVariant,
            borderColor: setData.completed ? theme.colors.primary : theme.colors.outline,
          },
        ]}
      >
        <Ionicons
          name={setData.completed ? 'checkmark' : 'checkmark-outline'}
          size={20}
          color={setData.completed ? '#fff' : theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>
    </View>
  );

  const renderExercise = ({ item, index: exIdx }: { item: ExerciseEntry; index: number }) => (
    <Surface style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="titleSmall" style={[styles.exerciseName, { color: theme.colors.onSurface }]}>
        {item.exerciseName}
      </Text>
      <View style={styles.setHeader}>
        <Text variant="labelSmall" style={[styles.setHeaderLabel, { color: theme.colors.onSurfaceVariant }]}>SET</Text>
        <Text variant="labelSmall" style={[styles.setHeaderLabel, { color: theme.colors.onSurfaceVariant, marginLeft: 36 }]}>WEIGHT</Text>
        <Text variant="labelSmall" style={[styles.setHeaderLabel, { color: theme.colors.onSurfaceVariant, marginLeft: 24 }]}>REPS</Text>
      </View>
      {item.sets.map((s, setIdx) => renderSetRow(exIdx, s, setIdx))}
      <TouchableOpacity
        style={[styles.addSetBtn, { borderColor: theme.colors.primary }]}
        onPress={() => handleAddSet(exIdx)}
      >
        <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
        <Text variant="labelMedium" style={{ color: theme.colors.primary, marginLeft: 6 }}>Add Set</Text>
      </TouchableOpacity>
    </Surface>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1}>
              {planName ?? 'Quick Workout'}
            </Text>
            <Text variant="bodySmall" style={styles.headerTimer}>{formatTime(elapsedSec)}</Text>
          </View>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {restTimer !== null && (
        <Chip
          style={[styles.restChip, { backgroundColor: theme.colors.secondaryContainer }]}
          textStyle={{ color: theme.colors.onSecondaryContainer, fontWeight: '700' }}
          onClose={() => setRestTimer(null)}
          icon="timer-outline"
        >
          Rest: {formatTime(restTimer)}
        </Chip>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={exercises}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderExercise}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={theme.colors.outlineVariant} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: 'center' }}>
                No exercises yet. Add an exercise to get started.
              </Text>
            </View>
          }
          ListFooterComponent={
            <Button
              mode="contained"
              style={[styles.finishLargeBtn, { backgroundColor: theme.colors.primary }]}
              contentStyle={{ paddingVertical: 6 }}
              onPress={handleFinish}
              icon="flag-checkered"
            >
              Finish Workout
            </Button>
          }
        />
      </KeyboardAvoidingView>
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
    gap: 12,
  },
  headerTitle: { color: '#fff', fontWeight: '700' },
  headerTimer: { color: 'rgba(255,255,255,0.8)', marginTop: 2, fontVariant: ['tabular-nums'] },
  finishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  finishBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  restChip: {
    margin: 12,
    alignSelf: 'flex-start',
  },
  listContent: { padding: 16, paddingBottom: 32, gap: 12 },
  exerciseCard: { borderRadius: 16, padding: 16 },
  exerciseName: { fontWeight: '700', marginBottom: 10 },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  setHeaderLabel: { fontSize: 10, letterSpacing: 0.5 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumText: { fontSize: 12, fontWeight: '700' },
  setInput: { flex: 1, height: 40, fontSize: 14 },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  finishLargeBtn: { marginTop: 16, marginHorizontal: 0, borderRadius: 14 },
});
