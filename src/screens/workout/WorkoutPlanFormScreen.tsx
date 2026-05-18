import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  Searchbar,
  Divider,
  useTheme,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '@/navigation/types';
import { useWorkoutPlans } from '@/hooks/useWorkoutPlans';
import { WorkoutPlanExercise } from '@/db/workoutDao';
import { EXERCISES, CATEGORY_LABELS, ExerciseCategory, Exercise } from '@/constants/exercises';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutPlanForm'>;

interface PlanExerciseRow {
  exercise_id: string;
  sets: number;
  reps: string;
  notes: string;
}

const DIFFICULTY_COLORS = { beginner: '#4CAF50', intermediate: '#FF9800', advanced: '#F44336' };
const CATEGORY_ORDER: ExerciseCategory[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'cardio', 'full_body',
];

export default function WorkoutPlanFormScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const planId = route.params?.planId;
  const isEdit = planId !== undefined;
  const { add, update, getById } = useWorkoutPlans();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<PlanExerciseRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState<ExerciseCategory | null>(null);

  useEffect(() => {
    if (isEdit && planId) {
      getById(planId).then((plan) => {
        if (plan) {
          setName(plan.name);
          setDescription(plan.description ?? '');
          setExercises(
            plan.exercises.map((e) => ({
              exercise_id: e.exercise_id,
              sets: e.sets,
              reps: e.reps,
              notes: e.notes ?? '',
            }))
          );
        }
      });
    }
  }, [isEdit, planId, getById]);

  const filteredPickerExercises = useCallback(() => {
    let list = EXERCISES;
    if (pickerCategory) list = list.filter((e) => e.category === pickerCategory);
    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase();
      list = list.filter(
        (e) => e.name.toLowerCase().includes(q) || e.primaryMuscles.some((m) => m.toLowerCase().includes(q))
      );
    }
    return list;
  }, [pickerCategory, pickerSearch]);

  const addExercise = (ex: Exercise) => {
    if (exercises.find((e) => e.exercise_id === ex.id)) {
      Alert.alert('Already added', `${ex.name} is already in the plan.`);
      return;
    }
    setExercises((prev) => [...prev, { exercise_id: ex.id, sets: 3, reps: '8-12', notes: '' }]);
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, field: keyof PlanExerciseRow, value: string | number) => {
    setExercises((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a plan name.');
      return;
    }
    setSaving(true);
    try {
      const exRows: Omit<WorkoutPlanExercise, 'id' | 'plan_id'>[] = exercises.map((e, i) => ({
        exercise_id: e.exercise_id,
        sets: e.sets,
        reps: e.reps,
        sort_order: i,
        notes: e.notes || null,
      }));
      if (isEdit && planId) {
        await update(planId, name.trim(), description.trim() || null, exRows);
        navigation.goBack();
      } else {
        const newId = await add(name.trim(), description.trim() || null, exRows);
        navigation.replace('WorkoutPlanDetail', { planId: newId });
      }
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  const pickerList = filteredPickerExercises();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Plan Info */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Plan Info
          </Text>
          <TextInput
            label="Plan Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
          />
        </Surface>

        {/* Exercises */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Exercises ({exercises.length})
            </Text>
            <Button
              mode="contained-tonal"
              onPress={() => setPickerVisible(true)}
              icon="plus"
              compact
            >
              Add
            </Button>
          </View>

          {exercises.map((row, idx) => {
            const ex = EXERCISES.find((e) => e.id === row.exercise_id);
            if (!ex) return null;
            return (
              <View key={idx} style={[styles.exRow, { borderColor: theme.colors.outlineVariant }]}>
                <View style={styles.exRowTop}>
                  <View style={[styles.exIdx, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text style={[styles.exIdxText, { color: theme.colors.primary }]}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                      {ex.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                      {ex.primaryMuscles.join(' · ')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeExercise(idx)} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={22} color="#E53935" />
                  </TouchableOpacity>
                </View>
                <View style={styles.exRowInputs}>
                  <TextInput
                    label="Sets"
                    value={String(row.sets)}
                    onChangeText={(v) => updateField(idx, 'sets', parseInt(v) || 1)}
                    keyboardType="numeric"
                    mode="outlined"
                    dense
                    style={styles.smallInput}
                  />
                  <TextInput
                    label="Reps"
                    value={row.reps}
                    onChangeText={(v) => updateField(idx, 'reps', v)}
                    mode="outlined"
                    dense
                    style={styles.smallInput}
                  />
                  <TextInput
                    label="Notes"
                    value={row.notes}
                    onChangeText={(v) => updateField(idx, 'notes', v)}
                    mode="outlined"
                    dense
                    style={[styles.smallInput, { flex: 1 }]}
                  />
                </View>
              </View>
            );
          })}

          {exercises.length === 0 && (
            <View style={styles.emptyEx}>
              <Ionicons name="barbell-outline" size={36} color={theme.colors.outlineVariant} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                No exercises added yet
              </Text>
            </View>
          )}
        </Surface>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveBtn}
          contentStyle={{ paddingVertical: 6 }}
        >
          {isEdit ? 'Update Plan' : 'Create Plan'}
        </Button>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <SafeAreaView style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
            <Text variant="titleMedium" style={{ fontWeight: '700', flex: 1 }}>Select Exercises</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
          <Searchbar
            placeholder="Search..."
            value={pickerSearch}
            onChangeText={setPickerSearch}
            style={styles.pickerSearch}
            inputStyle={{ fontSize: 14 }}
          />
          <FlatList
            horizontal
            data={[null, ...CATEGORY_ORDER] as (ExerciseCategory | null)[]}
            keyExtractor={(item) => item ?? 'all'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catList}
            renderItem={({ item }) => (
              <Chip
                selected={pickerCategory === item}
                onPress={() => setPickerCategory(item === pickerCategory ? null : item)}
                style={{ marginRight: 6 }}
                textStyle={{ fontSize: 12 }}
              >
                {item ? CATEGORY_LABELS[item] : 'All'}
              </Chip>
            )}
          />
          <FlatList
            data={pickerList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            renderItem={({ item }) => {
              const alreadyAdded = exercises.some((e) => e.exercise_id === item.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor: alreadyAdded ? theme.colors.primaryContainer : theme.colors.surface,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                  onPress={() => {
                    addExercise(item);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                      {item.primaryMuscles.join(' · ')}
                    </Text>
                  </View>
                  {alreadyAdded ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="add-circle-outline" size={20} color={theme.colors.onSurfaceVariant} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  input: { marginBottom: 10 },
  exRow: { borderTopWidth: 1, paddingTop: 12, marginTop: 12 },
  exRowTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  exIdx: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  exIdxText: { fontWeight: '700', fontSize: 13 },
  removeBtn: { padding: 4 },
  exRowInputs: { flexDirection: 'row', gap: 8 },
  smallInput: { flex: 0.4 },
  emptyEx: { alignItems: 'center', paddingVertical: 24 },
  saveBtn: { borderRadius: 14 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  pickerSearch: { margin: 12, borderRadius: 12 },
  catList: { paddingHorizontal: 12, paddingBottom: 8 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
});
