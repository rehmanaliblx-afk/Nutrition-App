import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Ellipse, Path } from 'react-native-svg';
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

// Image: 713×678 — front body LEFT half, back body RIGHT half.
// body_diagram_clean.png has red pre-highlights removed.
// Coordinates derived from actual pixel analysis (body centre x≈92 front, x≈74 back).
const DISP_W = 155;
const FULL_W  = DISP_W * 2;
const DISP_H  = Math.round(FULL_W * (678 / 713)); // 295

type BodyView = 'front' | 'back';

// SVG shape primitives
type EShape = { k: 'e'; cx: number; cy: number; rx: number; ry: number };
type PShape = { k: 'p'; d: string };
type Shape  = EShape | PShape;

interface MEntry { m: MuscleGroup; s: Shape[] }

// ─── FRONT (all coords in 155×295 SVG space) ───────────────────────────────
// Pixel analysis: body centre x=92. Arms separate at y≈98.
const FRONT: MEntry[] = [
  { m: 'chest', s: [
    // Left pec — fan shape (pre-highlight spanned x=67-118, split at sternum x=92)
    { k: 'e', cx: 79,  cy: 65, rx: 13, ry: 13 },
    // Right pec
    { k: 'e', cx: 105, cy: 65, rx: 13, ry: 13 },
  ]},
  { m: 'shoulders', s: [
    // Anterior deltoid — body widens from x=70 at y=44 to x=56 at y=54
    { k: 'e', cx: 62,  cy: 56, rx: 10, ry: 13 },
    { k: 'e', cx: 122, cy: 56, rx: 10, ry: 13 },
  ]},
  { m: 'biceps', s: [
    // Upper arm — left arm x=48-64 at y=98, right x=121-137
    { k: 'e', cx: 56,  cy: 109, rx: 10, ry: 23 },
    { k: 'e', cx: 129, cy: 109, rx: 10, ry: 23 },
  ]},
  { m: 'forearms', s: [
    // Forearm — left arm x=49-56 at y=131, right x=129-136
    { k: 'e', cx: 53,  cy: 147, rx: 7, ry: 16 },
    { k: 'e', cx: 133, cy: 147, rx: 7, ry: 16 },
  ]},
  { m: 'core', s: [
    // Abs / obliques — torso centre x=74-116, waist narrowest at y=98
    { k: 'e', cx: 92, cy: 118, rx: 22, ry: 38 },
  ]},
  { m: 'quads', s: [
    // Thighs — left leg x=64-88 (centre=76), right x=98-121 (centre=109) at y=174
    { k: 'e', cx: 76,  cy: 194, rx: 12, ry: 31 },
    { k: 'e', cx: 109, cy: 194, rx: 12, ry: 31 },
  ]},
  { m: 'calves', s: [
    // Lower leg — left x=65-77 (centre=71), right x=108-120 (centre=114) at y=250
    { k: 'e', cx: 71,  cy: 248, rx: 10, ry: 19 },
    { k: 'e', cx: 113, cy: 248, rx: 10, ry: 19 },
  ]},
];

// ─── BACK (all coords in 155×295 SVG space) ────────────────────────────────
// Pixel analysis: body centre x=74. Arms separate at y≈98.
const BACK: MEntry[] = [
  { m: 'traps', s: [
    // Trapezius kite shape: narrow at neck (74,31), widens to shoulders (42,58)/(106,58), point at mid-back (74,64)
    { k: 'p', d: 'M74,31 Q58,43 42,58 Q58,63 74,65 Q90,63 106,58 Q90,43 74,31Z' },
  ]},
  { m: 'shoulders', s: [
    // Rear deltoid — body x=40-108 at y=54, outer shoulder caps
    { k: 'e', cx: 47,  cy: 56, rx: 11, ry: 13 },
    { k: 'e', cx: 101, cy: 56, rx: 11, ry: 13 },
  ]},
  { m: 'back', s: [
    // Left lat — sweeps from armpit (y=65) to waist (y=143)
    { k: 'e', cx: 44,  cy: 104, rx: 13, ry: 39 },
    // Right lat
    { k: 'e', cx: 104, cy: 104, rx: 13, ry: 39 },
    // Rhomboids — between shoulder blades (torso x=52-92)
    { k: 'e', cx: 74,  cy: 79,  rx: 21, ry: 14 },
    // Erector spinae / lower back (torso x=52-98 at y=137)
    { k: 'e', cx: 75,  cy: 137, rx: 23, ry: 12 },
  ]},
  { m: 'triceps', s: [
    // Back of upper arm — left x=30-45 (centre=37), right x=103-118 (centre=110) at y=98
    { k: 'e', cx: 37,  cy: 109, rx: 9, ry: 23 },
    { k: 'e', cx: 111, cy: 109, rx: 9, ry: 23 },
  ]},
  { m: 'forearms', s: [
    // Left arm x=30-38 at y=131, right x=110-119
    { k: 'e', cx: 34,  cy: 147, rx: 7, ry: 16 },
    { k: 'e', cx: 115, cy: 147, rx: 7, ry: 16 },
  ]},
  { m: 'glutes', s: [
    // Buttocks — legs split at y=185: left x=48-69 (centre=58), right x=80-101 (centre=90)
    { k: 'e', cx: 58,  cy: 171, rx: 13, ry: 16 },
    { k: 'e', cx: 90,  cy: 171, rx: 13, ry: 16 },
  ]},
  { m: 'hamstrings', s: [
    // Back of thighs y=185-228, centres: left=56, right=92
    { k: 'e', cx: 56,  cy: 206, rx: 11, ry: 22 },
    { k: 'e', cx: 92,  cy: 206, rx: 11, ry: 22 },
  ]},
  { m: 'calves', s: [
    // Back lower leg — left x=46-62 (centre=54), right x=87-102 (centre=94) at y=228
    { k: 'e', cx: 54,  cy: 246, rx: 10, ry: 19 },
    { k: 'e', cx: 94,  cy: 246, rx: 10, ry: 19 },
  ]},
];

// ─── Colours ────────────────────────────────────────────────────────────────
const COL = {
  primary:   { fill: 'rgba(229,57,53,0.45)',  stroke: '#C62828', sw: 2   },
  secondary: { fill: 'rgba(251,140,0,0.40)',  stroke: '#E65100', sw: 1.5 },
  stab:      { fill: 'rgba(67,160,71,0.38)',  stroke: '#2E7D32', sw: 1.5 },
} as const;

interface Props { primaryMuscles: string[]; secondaryMuscles: string[]; stabilizerMuscles: string[]; }

export default function ExerciseMuscleMap({ primaryMuscles, secondaryMuscles, stabilizerMuscles }: Props) {
  const theme = useTheme();
  const [view, setView] = useState<BodyView>('front');

  const primary   = toRegions(primaryMuscles);
  const secondary = toRegions(secondaryMuscles);
  const stab      = toRegions(stabilizerMuscles);

  const getCol = (m: MuscleGroup) => {
    if (primary.has(m))   return COL.primary;
    if (secondary.has(m)) return COL.secondary;
    if (stab.has(m))      return COL.stab;
    return null;
  };

  const muscles = view === 'front' ? FRONT : BACK;

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

      {/* Body image + SVG muscle overlay */}
      <View style={{ width: DISP_W, height: DISP_H }}>
        {/* Clip PNG to one half */}
        <View style={{ width: DISP_W, height: DISP_H, overflow: 'hidden' }}>
          <Image
            source={require('../../assets/body_diagram_clean.png')}
            style={{ width: FULL_W, height: DISP_H, marginLeft: view === 'back' ? -DISP_W : 0 }}
            resizeMode="stretch"
          />
        </View>

        {/* SVG overlay — Ellipse/Path shapes trace actual muscle contours */}
        <Svg width={DISP_W} height={DISP_H} style={StyleSheet.absoluteFill}>
          {muscles.map(({ m, s }) => {
            const c = getCol(m);
            if (!c) return null;
            return s.map((shape, i) => {
              if (shape.k === 'e') {
                return (
                  <Ellipse
                    key={`${m}-${i}`}
                    cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry}
                    fill={c.fill} stroke={c.stroke} strokeWidth={c.sw}
                  />
                );
              }
              return (
                <Path
                  key={`${m}-${i}`}
                  d={shape.d}
                  fill={c.fill} stroke={c.stroke} strokeWidth={c.sw}
                />
              );
            });
          })}
        </Svg>
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
  container:  { alignItems: 'center', paddingVertical: 10 },
  toggle:     { flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  toggleBtn:  { paddingHorizontal: 24, paddingVertical: 7 },
  legend:     { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
});
