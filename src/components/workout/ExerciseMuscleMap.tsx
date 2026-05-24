import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, Ellipse, Rect, Path, G } from 'react-native-svg';
import { MuscleGroup } from './BodyDiagram';

// Maps muscle name strings → body regions
const MUSCLE_TO_REGION: Record<string, MuscleGroup> = {
  // Chest
  'pectoralis major': 'chest',
  'pectoralis major (upper)': 'chest',
  'pectoralis major (lower)': 'chest',
  'upper pectoralis': 'chest',
  'serratus anterior': 'chest',
  // Shoulders
  'anterior deltoid': 'shoulders',
  'medial deltoid': 'shoulders',
  'lateral deltoid': 'shoulders',
  'posterior deltoid': 'shoulders',
  'rear deltoid': 'shoulders',
  'deltoid': 'shoulders',
  'rotator cuff': 'shoulders',
  'supraspinatus': 'shoulders',
  // Back
  'latissimus dorsi': 'back',
  'rhomboids': 'back',
  'teres major': 'back',
  'lower back': 'back',
  // Traps
  'trapezius': 'traps',
  'upper trapezius': 'traps',
  'trapezius (mid/lower)': 'traps',
  'trapezius (middle)': 'traps',
  // Biceps
  'biceps brachii': 'biceps',
  'biceps brachii (long head)': 'biceps',
  'biceps brachii (short head)': 'biceps',
  'brachialis': 'biceps',
  // Triceps
  'triceps brachii': 'triceps',
  'triceps brachii (long head)': 'triceps',
  'triceps brachii (lateral head)': 'triceps',
  'triceps brachii (medial head)': 'triceps',
  'anconeus': 'triceps',
  // Forearms
  'brachioradialis': 'forearms',
  'forearms': 'forearms',
  // Core
  'rectus abdominis': 'core',
  'rectus abdominis (lower)': 'core',
  'obliques': 'core',
  'transverse abdominis': 'core',
  'hip flexors': 'core',
  'core': 'core',
  // Legs
  'quadriceps': 'quads',
  'rectus femoris': 'quads',
  'adductors': 'quads',
  'hamstrings': 'hamstrings',
  'biceps femoris': 'hamstrings',
  'gastrocnemius': 'calves',
  'soleus': 'calves',
  'calves': 'calves',
  // Glutes
  'gluteus maximus': 'glutes',
  'gluteus medius': 'glutes',
  'glutes': 'glutes',
  // Erector - can be back or core depending on context
  'erector spinae': 'back',
};

function toRegions(names: string[]): Set<MuscleGroup> {
  const result = new Set<MuscleGroup>();
  for (const name of names) {
    const key = name.toLowerCase().trim();
    if (MUSCLE_TO_REGION[key]) {
      result.add(MUSCLE_TO_REGION[key]);
      continue;
    }
    for (const [mapKey, region] of Object.entries(MUSCLE_TO_REGION)) {
      if (key.includes(mapKey) || mapKey.includes(key)) {
        result.add(region);
        break;
      }
    }
  }
  return result;
}

type BodyView = 'front' | 'back';

interface Props {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  stabilizerMuscles: string[];
}

export default function ExerciseMuscleMap({ primaryMuscles, secondaryMuscles, stabilizerMuscles }: Props) {
  const theme = useTheme();
  const [view, setView] = useState<BodyView>('front');

  const primaryRegions = toRegions(primaryMuscles);
  const secondaryRegions = toRegions(secondaryMuscles);
  const stabRegions = toRegions(stabilizerMuscles);

  const bodyFill = theme.dark ? '#2e2e2e' : '#e0e0e0';
  const bodyStroke = theme.dark ? '#4a4a4a' : '#bdbdbd';

  const reg = (muscle: MuscleGroup) => {
    if (primaryRegions.has(muscle)) {
      return { fill: '#E5393588', stroke: '#E53935', strokeWidth: 2.5 };
    }
    if (secondaryRegions.has(muscle)) {
      return { fill: '#FB8C0066', stroke: '#FB8C00', strokeWidth: 2 };
    }
    if (stabRegions.has(muscle)) {
      return { fill: '#43A04744', stroke: '#43A047', strokeWidth: 1.5 };
    }
    return { fill: 'transparent', stroke: 'transparent', strokeWidth: 0 };
  };

  const legendItems = [
    { label: 'Primary', color: '#E53935' },
    { label: 'Secondary', color: '#FB8C00' },
    { label: 'Stabilizer', color: '#43A047' },
  ];

  return (
    <View style={styles.container}>
      {/* Toggle */}
      <View style={[styles.toggle, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'front' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setView('front')}
        >
          <Text style={{ color: view === 'front' ? '#fff' : theme.colors.onSurfaceVariant, fontSize: 11, fontWeight: '700' }}>FRONT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'back' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setView('back')}
        >
          <Text style={{ color: view === 'back' ? '#fff' : theme.colors.onSurfaceVariant, fontSize: 11, fontWeight: '700' }}>BACK</Text>
        </TouchableOpacity>
      </View>

      <Svg viewBox="0 0 180 350" width={150} height={290} style={styles.svg}>
        {/* Body Silhouette */}
        <Circle cx={90} cy={23} r={20} fill={bodyFill} stroke={bodyStroke} strokeWidth={1.5} />
        <Rect x={83} y={43} width={14} height={14} rx={3} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Path d="M 48,55 L 132,55 L 120,168 L 60,168 Z" fill={bodyFill} stroke={bodyStroke} strokeWidth={1.5} />
        <Ellipse cx={43} cy={65} rx={18} ry={14} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Ellipse cx={137} cy={65} rx={18} ry={14} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Rect x={27} y={64} width={18} height={74} rx={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Rect x={135} y={64} width={18} height={74} rx={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Rect x={21} y={138} width={14} height={58} rx={6} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Rect x={145} y={138} width={14} height={58} rx={6} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Ellipse cx={28} cy={202} rx={9} ry={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Ellipse cx={152} cy={202} rx={9} ry={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Rect x={58} y={164} width={64} height={22} rx={10} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Rect x={58} y={183} width={28} height={87} rx={10} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Rect x={94} y={183} width={28} height={87} rx={10} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Ellipse cx={72} cy={275} rx={14} ry={9} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Ellipse cx={108} cy={275} rx={14} ry={9} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Rect x={60} y={282} width={24} height={58} rx={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Rect x={96} y={282} width={24} height={58} rx={8} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Ellipse cx={72} cy={344} rx={15} ry={7} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />
        <Ellipse cx={108} cy={344} rx={15} ry={7} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} />

        {/* Front Muscle Regions */}
        {view === 'front' && (
          <G>
            <Ellipse cx={90} cy={97} rx={34} ry={22} {...reg('chest')} />
            <Ellipse cx={43} cy={68} rx={16} ry={13} {...reg('shoulders')} />
            <Ellipse cx={137} cy={68} rx={16} ry={13} {...reg('shoulders')} />
            <Ellipse cx={33} cy={108} rx={10} ry={26} {...reg('biceps')} />
            <Ellipse cx={147} cy={108} rx={10} ry={26} {...reg('biceps')} />
            <Ellipse cx={26} cy={162} rx={8} ry={22} {...reg('forearms')} />
            <Ellipse cx={154} cy={162} rx={8} ry={22} {...reg('forearms')} />
            <Ellipse cx={90} cy={143} rx={24} ry={26} {...reg('core')} />
            <Ellipse cx={71} cy={230} rx={15} ry={34} {...reg('quads')} />
            <Ellipse cx={109} cy={230} rx={15} ry={34} {...reg('quads')} />
            <Ellipse cx={72} cy={308} rx={12} ry={22} {...reg('calves')} />
            <Ellipse cx={108} cy={308} rx={12} ry={22} {...reg('calves')} />
          </G>
        )}

        {/* Back Muscle Regions */}
        {view === 'back' && (
          <G>
            <Ellipse cx={90} cy={70} rx={36} ry={15} {...reg('traps')} />
            <Ellipse cx={61} cy={108} rx={15} ry={28} {...reg('back')} />
            <Ellipse cx={119} cy={108} rx={15} ry={28} {...reg('back')} />
            <Ellipse cx={90} cy={152} rx={22} ry={16} {...reg('back')} />
            <Ellipse cx={33} cy={106} rx={10} ry={26} {...reg('triceps')} />
            <Ellipse cx={147} cy={106} rx={10} ry={26} {...reg('triceps')} />
            <Ellipse cx={43} cy={68} rx={15} ry={12} {...reg('shoulders')} />
            <Ellipse cx={137} cy={68} rx={15} ry={12} {...reg('shoulders')} />
            <Ellipse cx={74} cy={193} rx={20} ry={18} {...reg('glutes')} />
            <Ellipse cx={106} cy={193} rx={20} ry={18} {...reg('glutes')} />
            <Ellipse cx={71} cy={236} rx={15} ry={34} {...reg('hamstrings')} />
            <Ellipse cx={109} cy={236} rx={15} ry={34} {...reg('hamstrings')} />
            <Ellipse cx={72} cy={308} rx={12} ry={22} {...reg('calves')} />
            <Ellipse cx={108} cy={308} rx={12} ry={22} {...reg('calves')} />
          </G>
        )}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {legendItems.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={{ fontSize: 10, color: item.color, fontWeight: '700' }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 10 },
  toggle: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  toggleBtn: { paddingHorizontal: 24, paddingVertical: 7 },
  svg: {},
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});
