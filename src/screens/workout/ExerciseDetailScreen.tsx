import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Image, ActivityIndicator } from 'react-native';
import { Text, Chip, Divider, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '@/navigation/types';
import { EXERCISES, CATEGORY_LABELS } from '@/constants/exercises';
import ExerciseMuscleMap from '@/components/workout/ExerciseMuscleMap';
import * as FileSystem from 'expo-file-system';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExerciseDetail'>;

const DIFFICULTY_COLORS = {
  beginner:     '#4CAF50',
  intermediate: '#FF9800',
  advanced:     '#F44336',
};

const MUSCLE_COLORS = {
  primary:    '#E53935',
  secondary:  '#FB8C00',
  stabilizer: '#43A047',
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function ExerciseDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const exercise = EXERCISES.find((e) => e.id === route.params.exerciseId);

  const [gifUri, setGifUri]       = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError]   = useState(false);

  useEffect(() => {
    if (!exercise) return;
    let cancelled = false;

    (async () => {
      // 1. Check local cache first
      const cacheFile = `${FileSystem.cacheDirectory}exgif_${exercise.id}.gif`;
      const info = await FileSystem.getInfoAsync(cacheFile);
      if (info.exists) {
        if (!cancelled) setGifUri(cacheFile);
        return;
      }

      // 2. Fetch from oss.exercisedb.dev (free, no API key)
      setGifLoading(true);
      try {
        const name = exercise.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        const res = await fetch(
          `https://oss.exercisedb.dev/api/v1/exercises/name/${encodeURIComponent(name)}?limit=1`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.data ?? json.exercises ?? []);
        const gifUrl: string | undefined = items[0]?.gifUrl;
        if (!gifUrl) throw new Error('no gif');

        // 3. Download and cache gif
        const dl = await FileSystem.downloadAsync(gifUrl, cacheFile);
        if (dl.status !== 200) throw new Error(`dl ${dl.status}`);
        if (!cancelled) setGifUri(dl.uri);
      } catch {
        if (!cancelled) setGifError(true);
      } finally {
        if (!cancelled) setGifLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [exercise?.id]);

  const openVideo = useCallback(async () => {
    if (!exercise) return;
    const supported = await Linking.canOpenURL(exercise.videoUrl);
    if (supported) Linking.openURL(exercise.videoUrl);
    else Alert.alert('Cannot open URL', exercise.videoUrl);
  }, [exercise?.videoUrl]);

  if (!exercise) {
    return <View style={styles.center}><Text>Exercise not found.</Text></View>;
  }

  const alternatives = EXERCISES.filter((e) => exercise.alternatives.includes(e.id));
  const ytId = getYouTubeId(exercise.videoUrl);
  const thumbUri = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

  const SectionCard = ({
    icon, title, children,
  }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; children: React.ReactNode }) => (
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
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
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

        {/* ── 1. Target Muscles ── */}
        <SectionCard icon="body" title="Target Muscles">
          <View style={styles.muscleGroup}>
            <Text variant="labelSmall" style={{ color: MUSCLE_COLORS.primary, fontWeight: '700', marginBottom: 6 }}>
              PRIMARY
            </Text>
            <View style={styles.chips}>
              {exercise.primaryMuscles.map((m) => (
                <Chip key={m} style={[styles.muscleChip, { backgroundColor: MUSCLE_COLORS.primary + '20' }]}
                  textStyle={{ color: MUSCLE_COLORS.primary, fontSize: 12 }}>{m}</Chip>
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
                  <Chip key={m} style={[styles.muscleChip, { backgroundColor: MUSCLE_COLORS.secondary + '20' }]}
                    textStyle={{ color: MUSCLE_COLORS.secondary, fontSize: 12 }}>{m}</Chip>
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
                  <Chip key={m} style={[styles.muscleChip, { backgroundColor: MUSCLE_COLORS.stabilizer + '20' }]}
                    textStyle={{ color: MUSCLE_COLORS.stabilizer, fontSize: 12 }}>{m}</Chip>
                ))}
              </View>
            </View>
          )}
        </SectionCard>

        {/* ── 2. Muscle Map (full width) ── */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness" size={18} color={theme.colors.primary} />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
              Muscle Map
            </Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          <ExerciseMuscleMap
            primaryMuscles={exercise.primaryMuscles}
            secondaryMuscles={exercise.secondaryMuscles}
            stabilizerMuscles={exercise.stabilizerMuscles}
          />
        </Surface>

        {/* ── 3. Exercise Animation ── */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Ionicons name="play-circle" size={18} color={theme.colors.primary} />
            <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.primary }]}>
              Exercise Animation
            </Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />

          {/* GIF from oss.exercisedb.dev (cached locally after first load) */}
          {gifLoading && (
            <View style={styles.animBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}>
                Loading animation…
              </Text>
            </View>
          )}

          {!gifLoading && gifUri && (
            <Image source={{ uri: gifUri }} style={styles.gif} resizeMode="contain" />
          )}

          {/* Fallback: YouTube thumbnail when gif unavailable */}
          {!gifLoading && gifError && (
            <TouchableOpacity onPress={openVideo} activeOpacity={0.85} style={styles.thumbWrap}>
              {thumbUri ? (
                <Image source={{ uri: thumbUri }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Ionicons name="videocam-outline" size={40} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              <View style={styles.playOverlay}>
                <View style={styles.playBtn}>
                  <Ionicons name="logo-youtube" size={28} color="#fff" />
                </View>
              </View>
              <View style={[styles.watchLabel, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Tap to watch on YouTube</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* YouTube button always shown below gif */}
          {!gifLoading && gifUri && (
            <TouchableOpacity
              style={[styles.ytBtn, { backgroundColor: '#FF0000' }]}
              onPress={openVideo}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-youtube" size={18} color="#fff" />
              <Text style={styles.ytBtnText}>Watch on YouTube</Text>
            </TouchableOpacity>
          )}
        </Surface>

        {/* ── 4. Technique ── */}
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

        {/* ── 5. Coaching Tips ── */}
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

        {/* ── 6. Common Mistakes ── */}
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

        {/* ── 7. Alternatives ── */}
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
  root:    { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 32 },

  hero:       { padding: 24, paddingBottom: 28 },
  heroName:   { color: '#fff', fontWeight: '800', marginBottom: 12 },
  heroBadges: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  diffBadge:  { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  diffText:   { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  catBadge:   { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  catText:    { color: '#fff', fontSize: 11, fontWeight: '600' },
  equipRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  equipText:  { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  card:       { marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle:  { fontWeight: '700', letterSpacing: 0.3 },

  // Animation
  animBox:    { height: 180, alignItems: 'center', justifyContent: 'center' },
  gif:        { width: '100%', height: 220, borderRadius: 12 },
  ytBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, paddingVertical: 10, borderRadius: 10 },
  ytBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  // YouTube thumbnail fallback
  thumbWrap:  { borderRadius: 12, overflow: 'hidden', position: 'relative' },
  thumb:      { width: '100%', height: 200, borderRadius: 12 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  muscleGroup: {},
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleChip:  { borderRadius: 8 },

  stepRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  stepNum:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontWeight: '700', fontSize: 13 },
  stepText:    { flex: 1, lineHeight: 22 },
  tipRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },

  altRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
});
