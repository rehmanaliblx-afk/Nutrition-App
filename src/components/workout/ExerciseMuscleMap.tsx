import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MuscleGroup } from './BodyDiagram';

const MUSCLE_TO_REGION: Record<string, MuscleGroup> = {
  'pectoralis major': 'chest', 'pectoralis major (upper)': 'chest',
  'pectoralis major (lower)': 'chest', 'upper pectoralis': 'chest',
  'serratus anterior': 'chest',
  'anterior deltoid': 'shoulders', 'medial deltoid': 'shoulders',
  'lateral deltoid': 'shoulders', 'posterior deltoid': 'shoulders',
  'rear deltoid': 'shoulders', 'deltoid': 'shoulders',
  'rotator cuff': 'shoulders', 'supraspinatus': 'shoulders',
  'latissimus dorsi': 'back', 'rhomboids': 'back',
  'teres major': 'back', 'lower back': 'back', 'erector spinae': 'back',
  'trapezius': 'traps', 'upper trapezius': 'traps',
  'trapezius (mid/lower)': 'traps', 'trapezius (middle)': 'traps',
  'biceps brachii': 'biceps', 'biceps brachii (long head)': 'biceps',
  'biceps brachii (short head)': 'biceps', 'brachialis': 'biceps',
  'triceps brachii': 'triceps', 'triceps brachii (long head)': 'triceps',
  'triceps brachii (lateral head)': 'triceps', 'triceps brachii (medial head)': 'triceps',
  'anconeus': 'triceps',
  'brachioradialis': 'forearms', 'forearms': 'forearms',
  'rectus abdominis': 'core', 'rectus abdominis (lower)': 'core',
  'obliques': 'core', 'transverse abdominis': 'core',
  'hip flexors': 'core', 'core': 'core',
  'quadriceps': 'quads', 'rectus femoris': 'quads', 'adductors': 'quads',
  'hamstrings': 'hamstrings', 'biceps femoris': 'hamstrings',
  'gastrocnemius': 'calves', 'soleus': 'calves', 'calves': 'calves',
  'gluteus maximus': 'glutes', 'gluteus medius': 'glutes', 'glutes': 'glutes',
};

function toRegions(names: string[]): Set<MuscleGroup> {
  const result = new Set<MuscleGroup>();
  for (const name of names) {
    const key = name.toLowerCase().trim();
    if (MUSCLE_TO_REGION[key]) { result.add(MUSCLE_TO_REGION[key]); continue; }
    for (const [mk, region] of Object.entries(MUSCLE_TO_REGION)) {
      if (key.includes(mk) || mk.includes(key)) { result.add(region); break; }
    }
  }
  return result;
}

// Original image: 713 × 678 (front body LEFT half, back body RIGHT half)
// Each half is 356.5 × 678. We display each half at:
const DISP_W = 155;
const FULL_W = DISP_W * 2;          // 310  — full image rendered width
const DISP_H = Math.round(FULL_W * (678 / 713)); // 295

type BodyView = 'front' | 'back';

interface Overlay { m: MuscleGroup; l: number; t: number; w: number; h: number; br: number; }

// All coordinates are in the 155 × 295 display space of ONE HALF
const FRONT: Overlay[] = [
  // Chest — two pecs
  { m: 'chest',     l: 26,  t: 80,  w: 50, h: 32, br: 16 },
  { m: 'chest',     l: 79,  t: 80,  w: 50, h: 32, br: 16 },
  // Anterior deltoids
  { m: 'shoulders', l: 8,   t: 66,  w: 28, h: 24, br: 12 },
  { m: 'shoulders', l: 119, t: 66,  w: 28, h: 24, br: 12 },
  // Biceps
  { m: 'biceps',    l: 6,   t: 93,  w: 18, h: 38, br: 9  },
  { m: 'biceps',    l: 131, t: 93,  w: 18, h: 38, br: 9  },
  // Forearms
  { m: 'forearms',  l: 4,   t: 135, w: 16, h: 33, br: 8  },
  { m: 'forearms',  l: 135, t: 135, w: 16, h: 33, br: 8  },
  // Rectus abdominis + obliques (core)
  { m: 'core',      l: 50,  t: 113, w: 55, h: 52, br: 8  },
  // Quadriceps — left & right
  { m: 'quads',     l: 33,  t: 175, w: 30, h: 50, br: 13 },
  { m: 'quads',     l: 92,  t: 175, w: 30, h: 50, br: 13 },
  // Calves
  { m: 'calves',    l: 36,  t: 233, w: 23, h: 30, br: 11 },
  { m: 'calves',    l: 96,  t: 233, w: 23, h: 30, br: 11 },
];

const BACK: Overlay[] = [
  // Upper trapezius (wide across top)
  { m: 'traps',      l: 38,  t: 62,  w: 79, h: 18, br: 8  },
  // Mid trapezius
  { m: 'traps',      l: 47,  t: 86,  w: 61, h: 22, br: 6  },
  // Rear deltoids
  { m: 'shoulders',  l: 8,   t: 66,  w: 27, h: 23, br: 11 },
  { m: 'shoulders',  l: 120, t: 66,  w: 27, h: 23, br: 11 },
  // Latissimus dorsi (sweep from armpit to waist)
  { m: 'back',       l: 11,  t: 96,  w: 28, h: 42, br: 12 },
  { m: 'back',       l: 116, t: 96,  w: 28, h: 42, br: 12 },
  // Rhomboids (between shoulder blades)
  { m: 'back',       l: 48,  t: 96,  w: 59, h: 24, br: 6  },
  // Erector spinae / lower back
  { m: 'back',       l: 56,  t: 126, w: 43, h: 22, br: 6  },
  // Triceps
  { m: 'triceps',    l: 5,   t: 91,  w: 18, h: 37, br: 9  },
  { m: 'triceps',    l: 132, t: 91,  w: 18, h: 37, br: 9  },
  // Forearms
  { m: 'forearms',   l: 4,   t: 132, w: 16, h: 33, br: 8  },
  { m: 'forearms',   l: 135, t: 132, w: 16, h: 33, br: 8  },
  // Gluteus maximus
  { m: 'glutes',     l: 35,  t: 160, w: 30, h: 27, br: 13 },
  { m: 'glutes',     l: 90,  t: 160, w: 30, h: 27, br: 13 },
  // Hamstrings
  { m: 'hamstrings', l: 34,  t: 190, w: 28, h: 46, br: 12 },
  { m: 'hamstrings', l: 93,  t: 190, w: 28, h: 46, br: 12 },
  // Calves (back)
  { m: 'calves',     l: 36,  t: 244, w: 23, h: 28, br: 11 },
  { m: 'calves',     l: 96,  t: 244, w: 23, h: 28, br: 11 },
];

interface Props { primaryMuscles: string[]; secondaryMuscles: string[]; stabilizerMuscles: string[]; }

export default function ExerciseMuscleMap({ primaryMuscles, secondaryMuscles, stabilizerMuscles }: Props) {
  const theme = useTheme();
  const [view, setView] = useState<BodyView>('front');

  const primary   = toRegions(primaryMuscles);
  const secondary = toRegions(secondaryMuscles);
  const stab      = toRegions(stabilizerMuscles);

  const getStyle = (m: MuscleGroup): object | null => {
    if (primary.has(m))   return { backgroundColor: '#E5393575', borderColor: '#C62828', borderWidth: 2 };
    if (secondary.has(m)) return { backgroundColor: '#FB8C0065', borderColor: '#E65100', borderWidth: 1.5 };
    if (stab.has(m))      return { backgroundColor: '#43A04760', borderColor: '#2E7D32', borderWidth: 1.5 };
    return null;
  };

  const overlays = view === 'front' ? FRONT : BACK;

  return (
    <View style={styles.container}>
      {/* FRONT / BACK toggle */}
      <View style={[styles.toggle, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant }]}>
        {(['front', 'back'] as BodyView[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.toggleBtn, view === v && { backgroundColor: theme.colors.primary }]}
            onPress={() => setView(v)}
          >
            <Text style={{ color: view === v ? '#fff' : theme.colors.onSurfaceVariant, fontSize: 11, fontWeight: '700' }}>
              {v.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body image + overlay */}
      <View style={{ width: DISP_W, height: DISP_H }}>
        {/* Clip to one half */}
        <View style={{ width: DISP_W, height: DISP_H, overflow: 'hidden' }}>
          <Image
            source={require('../../assets/body_diagram.png')}
            style={{ width: FULL_W, height: DISP_H, marginLeft: view === 'back' ? -DISP_W : 0 }}
            resizeMode="stretch"
          />
        </View>

        {/* Muscle highlight overlays — only rendered when active */}
        {overlays.map((item, i) => {
          const s = getStyle(item.m);
          if (!s) return null;
          return (
            <View
              key={i}
              style={[
                styles.overlay,
                { left: item.l, top: item.t, width: item.w, height: item.h, borderRadius: item.br },
                s,
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
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
  container:   { alignItems: 'center', paddingVertical: 10 },
  toggle:      { flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  toggleBtn:   { paddingHorizontal: 24, paddingVertical: 7 },
  overlay:     { position: 'absolute' },
  legend:      { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
});
