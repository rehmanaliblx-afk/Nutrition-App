import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, Ellipse, Rect, Path, G } from 'react-native-svg';

export type MuscleGroup =
  | 'chest' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'core' | 'quads' | 'hamstrings' | 'glutes' | 'calves'
  | 'back' | 'traps';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', forearms: 'Forearms', core: 'Core / Abs',
  quads: 'Quadriceps', hamstrings: 'Hamstrings', glutes: 'Glutes',
  calves: 'Calves', back: 'Back / Lats', traps: 'Trapezius',
};

interface Props {
  selected: MuscleGroup | null;
  onSelect: (m: MuscleGroup | null) => void;
}

type BodyView = 'front' | 'back';

// Muscle region colors - maps muscle to a distinct tint when inactive
const MUSCLE_TINTS: Record<MuscleGroup, string> = {
  chest: '#E53935',
  shoulders: '#7B1FA2',
  biceps: '#1976D2',
  triceps: '#0288D1',
  forearms: '#00838F',
  core: '#F57F17',
  quads: '#2E7D32',
  hamstrings: '#4CAF50',
  glutes: '#FF6F00',
  calves: '#558B2F',
  back: '#6A1B9A',
  traps: '#AD1457',
};

export default function BodyDiagram({ selected, onSelect }: Props) {
  const theme = useTheme();
  const [view, setView] = React.useState<BodyView>('front');

  const bodyFill = theme.dark ? '#2e2e2e' : '#e0e0e0';
  const bodyStroke = theme.dark ? '#4a4a4a' : '#bdbdbd';

  const reg = (muscle: MuscleGroup) => {
    const isSelected = selected === muscle;
    const tint = MUSCLE_TINTS[muscle];
    return {
      fill: isSelected ? tint + 'CC' : tint + '40',
      stroke: isSelected ? tint : tint + '88',
      strokeWidth: isSelected ? 2.5 : 1.5,
      onPress: () => onSelect(selected === muscle ? null : muscle),
    };
  };

  return (
    <View style={styles.container}>
      {/* Front / Back toggle */}
      <View style={[styles.toggle, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'front' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setView('front')}
        >
          <Text style={{ color: view === 'front' ? '#fff' : theme.colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' }}>
            FRONT
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'back' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setView('back')}
        >
          <Text style={{ color: view === 'back' ? '#fff' : theme.colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' }}>
            BACK
          </Text>
        </TouchableOpacity>
      </View>

      {/* SVG Body Diagram */}
      <Svg viewBox="0 0 180 350" width={160} height={310} style={styles.svg}>
        {/* ── BODY SILHOUETTE ── */}
        {/* Head */}
        <Circle cx={90} cy={23} r={20} fill={bodyFill} stroke={bodyStroke} strokeWidth={1.5} />
        {/* Neck */}
        <Rect x={83} y={43} width={14} height={14} rx={3} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Torso */}
        <Path d="M 48,55 L 132,55 L 120,168 L 60,168 Z" fill={bodyFill} stroke={bodyStroke} strokeWidth={1.5} />
        {/* Left Shoulder Cap */}
        <Ellipse cx={43} cy={65} rx={18} ry={14} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Right Shoulder Cap */}
        <Ellipse cx={137} cy={65} rx={18} ry={14} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Left Upper Arm */}
        <Rect x={27} y={64} width={18} height={74} rx={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Right Upper Arm */}
        <Rect x={135} y={64} width={18} height={74} rx={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Left Forearm */}
        <Rect x={21} y={138} width={14} height={58} rx={6} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Right Forearm */}
        <Rect x={145} y={138} width={14} height={58} rx={6} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Left Hand */}
        <Ellipse cx={28} cy={202} rx={9} ry={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Right Hand */}
        <Ellipse cx={152} cy={202} rx={9} ry={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Hips */}
        <Rect x={58} y={164} width={64} height={22} rx={10} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Left Thigh */}
        <Rect x={58} y={183} width={28} height={87} rx={10} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Right Thigh */}
        <Rect x={94} y={183} width={28} height={87} rx={10} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Left Knee */}
        <Ellipse cx={72} cy={275} rx={14} ry={9} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Right Knee */}
        <Ellipse cx={108} cy={275} rx={14} ry={9} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Left Calf */}
        <Rect x={60} y={282} width={24} height={58} rx={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Right Calf */}
        <Rect x={96} y={282} width={24} height={58} rx={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        {/* Feet */}
        <Ellipse cx={72} cy={344} rx={15} ry={7} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Ellipse cx={108} cy={344} rx={15} ry={7} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />

        {/* ── FRONT MUSCLE REGIONS ── */}
        {view === 'front' && (
          <G>
            {/* Chest */}
            <Ellipse cx={90} cy={97} rx={34} ry={22} {...reg('chest')} />
            {/* Left Delt */}
            <Ellipse cx={43} cy={68} rx={16} ry={13} {...reg('shoulders')} />
            {/* Right Delt */}
            <Ellipse cx={137} cy={68} rx={16} ry={13} {...reg('shoulders')} />
            {/* Left Bicep */}
            <Ellipse cx={33} cy={108} rx={10} ry={26} {...reg('biceps')} />
            {/* Right Bicep */}
            <Ellipse cx={147} cy={108} rx={10} ry={26} {...reg('biceps')} />
            {/* Left Forearm */}
            <Ellipse cx={26} cy={162} rx={8} ry={22} {...reg('forearms')} />
            {/* Right Forearm */}
            <Ellipse cx={154} cy={162} rx={8} ry={22} {...reg('forearms')} />
            {/* Core / Abs */}
            <Ellipse cx={90} cy={143} rx={24} ry={26} {...reg('core')} />
            {/* Left Quad */}
            <Ellipse cx={71} cy={230} rx={15} ry={34} {...reg('quads')} />
            {/* Right Quad */}
            <Ellipse cx={109} cy={230} rx={15} ry={34} {...reg('quads')} />
            {/* Left Calf (front) */}
            <Ellipse cx={72} cy={308} rx={12} ry={22} {...reg('calves')} />
            {/* Right Calf (front) */}
            <Ellipse cx={108} cy={308} rx={12} ry={22} {...reg('calves')} />
          </G>
        )}

        {/* ── BACK MUSCLE REGIONS ── */}
        {view === 'back' && (
          <G>
            {/* Trapezius */}
            <Ellipse cx={90} cy={70} rx={36} ry={15} {...reg('traps')} />
            {/* Left Lat */}
            <Ellipse cx={61} cy={108} rx={15} ry={28} {...reg('back')} />
            {/* Right Lat */}
            <Ellipse cx={119} cy={108} rx={15} ry={28} {...reg('back')} />
            {/* Lower Back */}
            <Ellipse cx={90} cy={152} rx={22} ry={16} {...reg('back')} />
            {/* Left Tricep */}
            <Ellipse cx={33} cy={106} rx={10} ry={26} {...reg('triceps')} />
            {/* Right Tricep */}
            <Ellipse cx={147} cy={106} rx={10} ry={26} {...reg('triceps')} />
            {/* Left Rear Delt */}
            <Ellipse cx={43} cy={68} rx={15} ry={12} {...reg('shoulders')} />
            {/* Right Rear Delt */}
            <Ellipse cx={137} cy={68} rx={15} ry={12} {...reg('shoulders')} />
            {/* Left Glute */}
            <Ellipse cx={74} cy={193} rx={20} ry={18} {...reg('glutes')} />
            {/* Right Glute */}
            <Ellipse cx={106} cy={193} rx={20} ry={18} {...reg('glutes')} />
            {/* Left Hamstring */}
            <Ellipse cx={71} cy={236} rx={15} ry={34} {...reg('hamstrings')} />
            {/* Right Hamstring */}
            <Ellipse cx={109} cy={236} rx={15} ry={34} {...reg('hamstrings')} />
            {/* Left Calf (back) */}
            <Ellipse cx={72} cy={308} rx={12} ry={22} {...reg('calves')} />
            {/* Right Calf (back) */}
            <Ellipse cx={108} cy={308} rx={12} ry={22} {...reg('calves')} />
          </G>
        )}
      </Svg>

      {/* Selected muscle badge */}
      <View style={styles.badgeRow}>
        {selected ? (
          <View style={[styles.badge, { backgroundColor: MUSCLE_TINTS[selected] + '22', borderColor: MUSCLE_TINTS[selected] }]}>
            <View style={[styles.badgeDot, { backgroundColor: MUSCLE_TINTS[selected] }]} />
            <Text style={{ color: MUSCLE_TINTS[selected], fontWeight: '700', fontSize: 13 }}>
              {MUSCLE_LABELS[selected]}
            </Text>
            <TouchableOpacity onPress={() => onSelect(null)} style={styles.badgeClear}>
              <Text style={{ color: MUSCLE_TINTS[selected], fontSize: 18, lineHeight: 20 }}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, textAlign: 'center' }}>
            Tap a muscle to filter exercises
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 14 },
  toggle: {
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  toggleBtn: { paddingHorizontal: 28, paddingVertical: 8 },
  svg: {},
  badgeRow: { marginTop: 10, height: 38, alignItems: 'center', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeClear: { marginLeft: 4 },
});
