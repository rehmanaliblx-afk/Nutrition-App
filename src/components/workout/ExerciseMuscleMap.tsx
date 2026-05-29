import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';

// Map ExerciseDB muscle name strings → library slug
const MUSCLE_MAP: Record<string, Slug> = {
  // ── Chest ─────────────────────────────────────────────────────────────────
  'chest': 'chest', 'pectoralis major': 'chest', 'upper chest': 'chest',
  'lower chest': 'chest', 'pectoralis minor': 'chest',
  'sternal head': 'chest', 'clavicular head': 'chest',

  // ── Shoulders / Deltoids ──────────────────────────────────────────────────
  'deltoids': 'deltoids', 'deltoid': 'deltoids', 'shoulders': 'deltoids',
  'anterior deltoid': 'deltoids', 'lateral deltoid': 'deltoids',
  'medial deltoid': 'deltoids', 'front deltoid': 'deltoids',
  'posterior deltoid': 'deltoids', 'rear deltoid': 'deltoids',
  'shoulder girdle': 'deltoids', 'shoulder stabilizers': 'deltoids',
  'rotator cuff': 'deltoids', 'supraspinatus': 'deltoids',
  'infraspinatus': 'deltoids', 'teres minor': 'deltoids',
  'subscapularis': 'deltoids',

  // ── Trapezius ─────────────────────────────────────────────────────────────
  'trapezius': 'trapezius', 'upper trapezius': 'trapezius',
  'middle trapezius': 'trapezius', 'lower trapezius': 'trapezius',
  'traps': 'trapezius', 'middle traps': 'trapezius', 'lower traps': 'trapezius',

  // ── Neck ──────────────────────────────────────────────────────────────────
  'neck': 'neck', 'sternocleidomastoid': 'neck', 'levator scapulae': 'neck',
  'scalenes': 'neck', 'omohyoid': 'neck', 'splenius capitis': 'neck',

  // ── Biceps ────────────────────────────────────────────────────────────────
  'biceps': 'biceps', 'biceps brachii': 'biceps', 'brachialis': 'biceps',
  'coracobrachialis': 'biceps', 'arms': 'biceps',

  // ── Triceps ───────────────────────────────────────────────────────────────
  'triceps': 'triceps', 'triceps brachii': 'triceps', 'anconeus': 'triceps',

  // ── Forearms ──────────────────────────────────────────────────────────────
  'forearms': 'forearm', 'forearm': 'forearm', 'brachioradialis': 'forearm',
  'forearm flexors': 'forearm', 'wrist flexors': 'forearm',
  'wrist extensors': 'forearm', 'grip muscles': 'forearm',
  'pronator teres': 'forearm', 'extensor carpi radialis': 'forearm',
  'flexor carpi radialis': 'forearm', 'flexor carpi ulnaris': 'forearm',
  'finger flexors': 'forearm', 'finger extensors': 'forearm',
  'palmaris longus': 'forearm',

  // ── Abs / Core ────────────────────────────────────────────────────────────
  'abs': 'abs', 'abdominals': 'abs', 'rectus abdominis': 'abs',
  'core': 'abs', 'entire core': 'abs', 'full body': 'abs',
  'transverse abdominis': 'abs', 'transversus abdominis': 'abs',
  'hip flexors': 'abs', 'iliopsoas': 'abs', 'psoas major': 'abs',
  'iliacus': 'abs', 'lower abs': 'abs', 'upper abs': 'abs',

  // ── Obliques ──────────────────────────────────────────────────────────────
  'obliques': 'obliques', 'external oblique': 'obliques',
  'external obliques': 'obliques', 'internal oblique': 'obliques',
  'internal obliques': 'obliques',

  // ── Upper Back / Lats ─────────────────────────────────────────────────────
  'latissimus dorsi': 'upper-back', 'lats': 'upper-back',
  'rhomboids': 'upper-back', 'rhomboid major': 'upper-back',
  'rhomboid minor': 'upper-back', 'teres major': 'upper-back',
  'upper back': 'upper-back', 'middle back': 'upper-back',
  'back': 'upper-back', 'serratus anterior': 'upper-back',
  'serratus posterior': 'upper-back',

  // ── Lower Back ────────────────────────────────────────────────────────────
  'lower back': 'lower-back', 'erector spinae': 'lower-back',
  'spinal erectors': 'lower-back', 'quadratus lumborum': 'lower-back',
  'multifidus': 'lower-back', 'thoracolumbar fascia': 'lower-back',

  // ── Glutes ────────────────────────────────────────────────────────────────
  'glutes': 'gluteal', 'gluteus maximus': 'gluteal',
  'gluteus medius': 'gluteal', 'gluteus minimus': 'gluteal',
  'piriformis': 'gluteal', 'deep hip rotators': 'gluteal',
  'hip stabilizers': 'gluteal',

  // ── Hip Abductors (no dedicated slug — map to gluteal) ────────────────────
  'hip abductors': 'gluteal', 'abductors': 'gluteal',
  'tensor fasciae latae': 'gluteal', 'iliotibial band': 'gluteal',

  // ── Hamstrings ────────────────────────────────────────────────────────────
  'hamstrings': 'hamstring', 'biceps femoris': 'hamstring',
  'semitendinosus': 'hamstring', 'semimembranosus': 'hamstring',

  // ── Quads ─────────────────────────────────────────────────────────────────
  'quadriceps': 'quadriceps', 'quads': 'quadriceps', 'legs': 'quadriceps',
  'rectus femoris': 'quadriceps', 'vastus lateralis': 'quadriceps',
  'vastus medialis': 'quadriceps', 'vastus intermedius': 'quadriceps',

  // ── Adductors ─────────────────────────────────────────────────────────────
  'adductors': 'adductors', 'adductor longus': 'adductors',
  'adductor brevis': 'adductors', 'adductor magnus': 'adductors',
  'pectineus': 'adductors', 'gracilis': 'adductors', 'sartorius': 'adductors',

  // ── Calves ────────────────────────────────────────────────────────────────
  'calves': 'calves', 'gastrocnemius': 'calves', 'soleus': 'calves',
  'ankle stabilizers': 'calves', 'peroneus longus': 'calves',
  'peroneus brevis': 'calves',

  // ── Tibialis (front of shin) ──────────────────────────────────────────────
  'tibialis anterior': 'tibialis', 'tibialis': 'tibialis',
};

function toSlug(name: string): Slug | null {
  const key = name.toLowerCase().trim();
  if (MUSCLE_MAP[key]) return MUSCLE_MAP[key];
  for (const [mk, slug] of Object.entries(MUSCLE_MAP)) {
    if (key.includes(mk) || mk.includes(key)) return slug;
  }
  return null;
}

function buildData(
  primary: string[],
  secondary: string[],
  stabilizer: string[],
): ExtendedBodyPart[] {
  const map = new Map<Slug, ExtendedBodyPart>();

  const add = (names: string[], fill: string, stroke: string) => {
    for (const n of names) {
      const slug = toSlug(n);
      if (slug && !map.has(slug)) {
        map.set(slug, { slug, intensity: 1, styles: { fill, stroke, strokeWidth: 1 } });
      }
    }
  };

  // Add in priority order: stabilizer first (lowest), primary last (highest)
  add(stabilizer, 'rgba(67,160,71,0.65)',  '#2E7D32');
  add(secondary,  'rgba(251,140,0,0.65)',  '#E65100');
  add(primary,    'rgba(229,57,53,0.65)',  '#C62828');

  return Array.from(map.values());
}

interface Props {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  stabilizerMuscles: string[];
}

export default function ExerciseMuscleMap({ primaryMuscles, secondaryMuscles, stabilizerMuscles }: Props) {
  const theme = useTheme();
  const [side, setSide] = useState<'front' | 'back'>('front');

  const data = buildData(primaryMuscles, secondaryMuscles, stabilizerMuscles);

  return (
    <View style={styles.container}>
      <View style={[styles.toggle, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant }]}>
        {(['front', 'back'] as const).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.toggleBtn, side === v && { backgroundColor: theme.colors.primary }]}
            onPress={() => setSide(v)}
          >
            <Text style={{ color: side === v ? '#fff' : theme.colors.onSurfaceVariant, fontSize: 11, fontWeight: '700' }}>
              {v.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Body
        data={data}
        gender="male"
        side={side}
        scale={1.1}
        border={theme.dark ? '#666' : '#ccc'}
        defaultFill={theme.dark ? '#2a2a2a' : '#f0f0f0'}
      />

      <View style={styles.legend}>
        {[
          { label: 'Primary',    color: '#E53935' },
          { label: 'Secondary',  color: '#FB8C00' },
          { label: 'Stabilizer', color: '#43A047' },
        ].map(({ label, color }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={{ fontSize: 10, color, fontWeight: '700' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { alignItems: 'center', paddingVertical: 10 },
  toggle:     { flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  toggleBtn:  { paddingHorizontal: 24, paddingVertical: 7 },
  legend:     { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
});
