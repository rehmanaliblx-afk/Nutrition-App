import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Chip, Divider, Surface, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '@/navigation/types';
import { useWorkoutPlans } from '@/hooks/useWorkoutPlans';
import { WorkoutPlanWithExercises } from '@/db/workoutDao';
import { EXERCISES } from '@/constants/exercises';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutPlanDetail'>;

const DIFFICULTY_COLORS = { beginner: '#4CAF50', intermediate: '#FF9800', advanced: '#F44336' };

export default function WorkoutPlanDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { planId } = route.params;
  const { getById, remove } = useWorkoutPlans();
  const [plan, setPlan] = useState<WorkoutPlanWithExercises | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getById(planId).then((p) => {
      setPlan(p);
      setLoading(false);
    });
  }, [planId, getById]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('WorkoutPlanForm', { planId })}
            style={{ padding: 8 }}
          >
            <Ionicons name="pencil" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Delete Plan', 'Delete this plan?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await remove(planId);
                    navigation.goBack();
                  },
                },
              ]);
            }}
            style={{ padding: 8 }}
          >
            <Ionicons name="trash-outline" size={20} color="#E53935" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, planId, remove, theme]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text>Plan not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
          <Text variant="headlineSmall" style={styles.heroTitle}>{plan.name}</Text>
          {plan.description ? (
            <Text style={styles.heroDesc}>{plan.description}</Text>
          ) : null}
          <Text style={styles.heroMeta}>{plan.exercises.length} exercises</Text>
        </View>

        {/* Exercises */}
        <View style={styles.exerciseList}>
          {plan.exercises.map((pe, idx) => {
            const ex = EXERCISES.find((e) => e.id === pe.exercise_id);
            if (!ex) return null;
            return (
              <TouchableOpacity
                key={pe.id}
                style={[styles.exCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
                onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
                activeOpacity={0.75}
              >
                <View style={[styles.exNum, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={[styles.exNumText, { color: theme.colors.primary }]}>{idx + 1}</Text>
                </View>
                <View style={styles.exInfo}>
                  <View style={styles.exNameRow}>
                    <Text variant="titleSmall" style={{ fontWeight: '600', flex: 1, color: theme.colors.onSurface }}>
                      {ex.name}
                    </Text>
                    <View style={[styles.diffDot, { backgroundColor: DIFFICULTY_COLORS[ex.difficulty] }]} />
                  </View>
                  <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 1 }}>
                    {ex.primaryMuscles.join(' · ')}
                  </Text>
                  <View style={styles.setsRow}>
                    <View style={styles.setsBadge}>
                      <Ionicons name="repeat" size={12} color={theme.colors.onSurfaceVariant} />
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                        {pe.sets} sets × {pe.reps} reps
                      </Text>
                    </View>
                    {pe.notes ? (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }} numberOfLines={1}>
                        {pe.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            );
          })}
          {plan.exercises.length === 0 && (
            <View style={styles.emptyExercises}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No exercises in this plan.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 40 },
  hero: { padding: 24, paddingBottom: 28 },
  heroTitle: { color: '#fff', fontWeight: '800', marginBottom: 8 },
  heroDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 12 },
  heroMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  exerciseList: { padding: 16, gap: 10 },
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  exNum: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exNumText: { fontWeight: '700', fontSize: 15 },
  exInfo: { flex: 1 },
  exNameRow: { flexDirection: 'row', alignItems: 'center' },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  setsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  setsBadge: { flexDirection: 'row', alignItems: 'center' },
  emptyExercises: { alignItems: 'center', paddingTop: 40 },
});
