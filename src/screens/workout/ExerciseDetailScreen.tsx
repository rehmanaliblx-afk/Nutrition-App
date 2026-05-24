import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Image, ActivityIndicator } from 'react-native';
import { Text, Chip, Divider, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '@/navigation/types';
import { EXERCISES, CATEGORY_LABELS } from '@/constants/exercises';
import ExerciseMuscleMap from '@/components/workout/ExerciseMuscleMap';
import { getAppSetting } from '@/db/mealSlotsDao';
import { useDatabase } from '@/context/DatabaseContext';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExerciseDetail'>;

const DIFFICULTY_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

const MUSCLE_COLORS = {
  primary: '#E53935',
  secondary: '#FB8C00',
  stabilizer: '#43A047',
};

interface ExerciseDBResult {
  gifUrl: string;
  name: string;
}

export default function ExerciseDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { isReady } = useDatabase();
  const exercise = EXERCISES.find((e) => e.id === route.params.exerciseId);

  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    if (!isReady || !exercise) return;
    let cancelled = false;

    (async () => {
      const key = await getAppSetting('exercisedb_api_key');
      if (!key) {
        setApiKeyMissing(true);
        return;
      }
      setApiKeyMissing(false);
      setGifLoading(true);
      setGifError(null);
      try {
        const nameParam = encodeURIComponent(exercise.name.toLowerCase());
        const res = await fetch(
          `https://exercisedb.p.rapidapi.com/exercises/name/${nameParam}?limit=1&offset=0`,
          {
            headers: {
              'x-rapidapi-key': key,
              'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
            },
          }
        );
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: ExerciseDBResult[] = await res.json();
        if (!cancelled && data.length > 0) {
          setGifUrl(data[0].gifUrl);
        } else if (!cancelled) {
          setGifError('No animation found for this exercise.');
        }
      } catch (e: any) {
        if (!cancelled) setGifError('Could not load animation. Check internet connection.');
      } finally {
        if (!cancelled) setGifLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isReady, exercise]);

  if (!exercise) {
    return (
      <View style={styles.center}>
        <Text>Exercise not found.</Text>
      </View>
    );
  }

  const alternatives = EXERCISES.filter((e) => exercise.alternatives.includes(e.id));

  const openVideo = useCallback(async () => {
    const supported = await Linking.canOpenURL(exercise.videoUrl);
    if (supported) {
      Linking.openURL(exercise.videoUrl);
    } else {
      Alert.alert('Cannot open URL', exercise.videoUrl);
    }
  }, [exercise.videoUrl]);

  const SectionCard = ({
    icon,
    title,
    children,
  }: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    children: React.ReactNode;
  }) => (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
        <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
          {title}
        </Text>
      </View>
      <Divider style={{ marginBottom: 12 }} />
      {children}
    </Surface>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
          <Text variant="headlineSmall" style={styles.heroName}>{exercise.name}</Text>
          <View style={styles.heroBadges}>
            <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[exercise.difficulty] }]}>
              <Text style={styles.diffText}>{exercise.difficulty.toUpperCase()}</Text>
            </View>
            <View style={[styles.catBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.catText}>{CATEGORY_LABELS[exercise.category]}</Text>
            </View>
          </View>
          <View style={styles.equipRow}>
            <Ionicons name="barbell-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.equipText}>{exercise.equipment}</Text>
          </View>
        </View>

        {/* Muscle Map + GIF side by side layout */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.mapGifRow}>
            {/* Left: SVG muscle map */}
            <View style={styles.mapCol}>
              <ExerciseMuscleMap
                primaryMuscles={exercise.primaryMuscles}
                secondaryMuscles={exercise.secondaryMuscles}
                stabilizerMuscles={exercise.stabilizerMuscles}
              />
            </View>

            {/* Right: GIF animation */}
            <View style={styles.gifCol}>
              <Text variant="labelSmall" style={[styles.gifLabel, { color: theme.colors.onSurfaceVariant }]}>
                EXERCISE ANIMATION
              </Text>
              {gifLoading && (
                <View style={styles.gifPlaceholder}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                    Loading…
                  </Text>
                </View>
              )}
              {!gifLoading && gifUrl && (
                <Image
                  source={{ uri: gifUrl }}
                  style={styles.gif}
                  resizeMode="contain"
                />
              )}
              {!gifLoading && gifError && (
                <View style={styles.gifPlaceholder}>
                  <Ionicons name="cloud-offline-outline" size={28} color={theme.colors.onSurfaceVariant} />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }}>
                    {gifError}
                  </Text>
                </View>
              )}
              {!gifLoading && apiKeyMissing && (
                <View style={styles.gifPlaceholder}>
                  <Ionicons name="key-outline" size={28} color={theme.colors.onSurfaceVariant} />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }}>
                    Add ExerciseDB API key in Settings to see animations
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Surface>

        {/* Target Muscles — keep existing UI unchanged */}
        <SectionCard icon="body" title="Target Muscles">
          <View style={styles.muscleGroup}>
            <Text variant="labelSmall" style={{ color: MUSCLE_COLORS.primary, fontWeight: '700', marginBottom: 6 }}>
              PRIMARY
            </Text>
            <View style={styles.chips}>
              {exercise.primaryMuscles.map((m) => (
                <Chip key={m} style={[styles.muscleChip, { backgroundColor: MUSCLE_COLORS.primary + '20' }]} textStyle={{ color: MUSCLE_COLORS.primary, fontSize: 12 }}>
                  {m}
                </Chip>
              ))}
            </View>
          </View>
          {exercise.secondaryMuscles.length > 0 && (
            <View style={[styles.muscleGroup, { marginTop: 10 }]}>
              <Text variant="labelSmall" style={{ color: MUSCLE_COLORS.secondary, fontWeight: '700', marginBottom: 6 }}>
                SECONDARY
              </Text>
              <View style={styles.chips}>
                {exercise.secondaryMuscles.map((m) => (
                  <Chip key={m} style={[styles.muscleChip, { backgroundColor: MUSCLE_COLORS.secondary + '20' }]} textStyle={{ color: MUSCLE_COLORS.secondary, fontSize: 12 }}>
                    {m}
                  </Chip>
                ))}
              </View>
            </View>
          )}
          {exercise.stabilizerMuscles.length > 0 && (
            <View style={[styles.muscleGroup, { marginTop: 10 }]}>
              <Text variant="labelSmall" style={{ color: MUSCLE_COLORS.stabilizer, fontWeight: '700', marginBottom: 6 }}>
                STABILIZERS
              </Text>
              <View style={styles.chips}>
                {exercise.stabilizerMuscles.map((m) => (
                  <Chip key={m} style={[styles.muscleChip, { backgroundColor: MUSCLE_COLORS.stabilizer + '20' }]} textStyle={{ color: MUSCLE_COLORS.stabilizer, fontSize: 12 }}>
                    {m}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </SectionCard>

        {/* Technique */}
        <SectionCard icon="list" title="Technique">
          {exercise.technique.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={[styles.stepNumText, { color: theme.colors.primary }]}>{i + 1}</Text>
              </View>
              <Text variant="bodyMedium" style={[styles.stepText, { color: theme.colors.onSurface }]}>
                {step}
              </Text>
            </View>
          ))}
        </SectionCard>

        {/* Tips */}
        <SectionCard icon="bulb" title="Coaching Tips">
          {exercise.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} style={{ marginTop: 2 }} />
              <Text variant="bodyMedium" style={[{ flex: 1, marginLeft: 10 }, { color: theme.colors.onSurface }]}>
                {tip}
              </Text>
            </View>
          ))}
        </SectionCard>

        {/* Common Mistakes */}
        <SectionCard icon="warning" title="Common Mistakes">
          {exercise.commonMistakes.map((m, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="close-circle" size={16} color="#E53935" style={{ marginTop: 2 }} />
              <Text variant="bodyMedium" style={[{ flex: 1, marginLeft: 10 }, { color: theme.colors.onSurface }]}>
                {m}
              </Text>
            </View>
          ))}
        </SectionCard>

        {/* Video */}
        <TouchableOpacity
          style={[styles.videoBtn, { backgroundColor: '#FF0000' }]}
          onPress={openVideo}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-youtube" size={24} color="#fff" />
          <Text style={styles.videoBtnText}>Watch on YouTube</Text>
          <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <SectionCard icon="swap-horizontal" title="Alternative Exercises">
            {alternatives.map((alt) => (
              <TouchableOpacity
                key={alt.id}
                style={[styles.altRow, { borderColor: theme.colors.outlineVariant }]}
                onPress={() => navigation.push('ExerciseDetail', { exerciseId: alt.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                    {alt.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                    {alt.primaryMuscles.join(' · ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </SectionCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 32 },
  hero: { padding: 24, paddingBottom: 28 },
  heroName: { color: '#fff', fontWeight: '800', marginBottom: 12 },
  heroBadges: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  diffText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  catBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  catText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  equipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  equipText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontWeight: '700', letterSpacing: 0.3 },

  // Map + GIF row
  mapGifRow: { flexDirection: 'row', gap: 12 },
  mapCol: { flex: 1, alignItems: 'center' },
  gifCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gifLabel: { fontWeight: '700', marginBottom: 8, letterSpacing: 0.4 },
  gif: { width: '100%', aspectRatio: 1, borderRadius: 10 },
  gifPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(128,128,128,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },

  muscleGroup: {},
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleChip: { borderRadius: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontWeight: '700', fontSize: 13 },
  stepText: { flex: 1, lineHeight: 22 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  videoBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  videoBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  altRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
});
