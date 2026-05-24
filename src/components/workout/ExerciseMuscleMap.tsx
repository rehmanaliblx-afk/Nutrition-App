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

// Original image: 713×678 (front body LEFT half, back body RIGHT half)
// body_diagram_clean.png has no pre-highlighted muscles (programmatically removed)
// Overlay coords derived from actual pixel analysis of the PNG.
// FRONT body center x≈92, BACK body center x≈74 (bodies are not centred at 77)
const DISP_W = 155;
const FULL_W = DISP_W * 2;
const DISP_H = Math.round(FULL_W * (678 / 713)); // 295

type BodyView = 'front' | 'back';

interface Overlay { m: MuscleGroup; l: number; t: number; w: number; h: number; br: number; }

// FRONT: coordinates in 155×295 display space
const FRONT: Overlay[] = [
  // Chest — two pecs (red pre-highlight was at display l=67,t=53,w=51)
  { m: 'chest',     l: 65,  t: 53,  w: 24, h: 24, br: 11 },
  { m: 'chest',     l: 93,  t: 53,  w: 24, h: 24, br: 11 },
  // Anterior deltoids (shoulder widens from x=70 at y=44 to x=56 at y=54)
  { m: 'shoulders', l: 53,  t: 44,  w: 18, h: 24, br: 9  },
  { m: 'shoulders', l: 113, t: 44,  w: 18, h: 24, br: 9  },
  // Biceps (arms separate from torso at y≈98)
  { m: 'biceps',    l: 46,  t: 87,  w: 20, h: 44, br: 10 },
  { m: 'biceps',    l: 119, t: 87,  w: 20, h: 44, br: 10 },
  // Forearms (arm width ≈7-13px at y=131-163)
  { m: 'forearms',  l: 46,  t: 131, w: 13, h: 32, br: 6  },
  { m: 'forearms',  l: 127, t: 131, w: 13, h: 32, br: 6  },
  // Core / abs (torso centre x=74-116 at waist)
  { m: 'core',      l: 68,  t: 78,  w: 46, h: 76, br: 8  },
  // Quadriceps (legs split at y=174, each ~24px wide)
  { m: 'quads',     l: 63,  t: 163, w: 27, h: 65, br: 13 },
  { m: 'quads',     l: 97,  t: 163, w: 27, h: 65, br: 13 },
  // Calves front (lower leg x=56-77 / x=108-129)
  { m: 'calves',    l: 55,  t: 228, w: 24, h: 40, br: 11 },
  { m: 'calves',    l: 106, t: 228, w: 24, h: 40, br: 11 },
];

// BACK: coordinates in 155×295 display space
const BACK: Overlay[] = [
  // Upper trapezius — narrow band at neck (red pre-highlight t=31,w=53)
  { m: 'traps',      l: 63,  t: 31,  w: 22, h: 14, br: 7  },
  // Mid trapezius — widens across shoulders
  { m: 'traps',      l: 42,  t: 44,  w: 65, h: 16, br: 7  },
  // Rear deltoids (shoulder widens from x=59 at y=44 to x=40 at y=54)
  { m: 'shoulders',  l: 37,  t: 44,  w: 22, h: 24, br: 11 },
  { m: 'shoulders',  l: 90,  t: 44,  w: 22, h: 24, br: 11 },
  // Latissimus dorsi (armpit sweep, body x=35-113 at y=65)
  { m: 'back',       l: 32,  t: 65,  w: 25, h: 78, br: 12 },
  { m: 'back',       l: 92,  t: 65,  w: 25, h: 78, br: 12 },
  // Rhomboids (between shoulder blades, torso centre x=52-92)
  { m: 'back',       l: 52,  t: 65,  w: 40, h: 28, br: 7  },
  // Erector spinae / lower back (torso x=50-98 at y=141)
  { m: 'back',       l: 52,  t: 125, w: 46, h: 24, br: 7  },
  // Triceps (back of upper arms, arm x=30-45 / x=103-118 at y=98)
  { m: 'triceps',    l: 28,  t: 87,  w: 18, h: 44, br: 9  },
  { m: 'triceps',    l: 103, t: 87,  w: 18, h: 44, br: 9  },
  // Forearms back
  { m: 'forearms',   l: 27,  t: 131, w: 13, h: 32, br: 6  },
  { m: 'forearms',   l: 109, t: 131, w: 13, h: 32, br: 6  },
  // Glutes (legs split at y=185, x=48-69 / x=80-101)
  { m: 'glutes',     l: 44,  t: 157, w: 26, h: 32, br: 13 },
  { m: 'glutes',     l: 78,  t: 157, w: 26, h: 32, br: 13 },
  // Hamstrings (back of thighs, y=185-228)
  { m: 'hamstrings', l: 43,  t: 185, w: 28, h: 43, br: 12 },
  { m: 'hamstrings', l: 78,  t: 185, w: 28, h: 43, br: 12 },
  // Calves back (leg x=46-62 / x=87-102 at y=228)
  { m: 'calves',     l: 44,  t: 228, w: 20, h: 38, br: 10 },
  { m: 'calves',     l: 86,  t: 228, w: 20, h: 38, br: 10 },
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

      <View style={{ width: DISP_W, height: DISP_H }}>
        <View style={{ width: DISP_W, height: DISP_H, overflow: 'hidden' }}>
          <Image
            source={require('../../assets/body_diagram_clean.png')}
            style={{ width: FULL_W, height: DISP_H, marginLeft: view === 'back' ? -DISP_W : 0 }}
            resizeMode="stretch"
          />
        </View>

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
