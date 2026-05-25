import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';

// Internal region identifiers — superset of MuscleGroup.
// 'front_shoulders' = anterior/lateral deltoid (FRONT view only).
// 'shoulders'       = posterior/rear deltoid   (BACK view only).
// 'serratus'        = serratus anterior        (FRONT view only).
type Region = string;

const MUSCLE_TO_REGION: Record<string, Region> = {
  // ── Chest ─────────────────────────────────────────────────────────────────────
  'pectoralis major': 'chest', 'pectoralis major (upper)': 'chest',
  'pectoralis major (lower)': 'chest', 'pectoralis minor': 'chest',
  'upper pectoralis': 'chest', 'chest': 'chest',
  'lower chest': 'chest', 'upper chest': 'chest',
  'sternal head': 'chest', 'clavicular head': 'chest',

  // ── Serratus anterior (front, side of ribcage) ────────────────────────────────
  'serratus anterior': 'serratus',

  // ── Front shoulders: anterior + lateral deltoid (FRONT view only) ────────────
  'anterior deltoid': 'front_shoulders', 'lateral deltoid': 'front_shoulders',
  'medial deltoid': 'front_shoulders',   'front deltoid': 'front_shoulders',
  'deltoid': 'front_shoulders',          'shoulders': 'front_shoulders',
  'shoulder girdle': 'front_shoulders',  'shoulder stabilizers': 'front_shoulders',
  'deltoid (anterior head)': 'front_shoulders',
  'deltoid (lateral head)': 'front_shoulders',

  // ── Back shoulders: posterior deltoid + rotator cuff (BACK view only) ────────
  'posterior deltoid': 'shoulders',   'rear deltoid': 'shoulders',
  'rotator cuff': 'shoulders',        'supraspinatus': 'shoulders',
  'infraspinatus': 'shoulders',       'teres minor': 'shoulders',
  'subscapularis': 'shoulders',
  'deltoid (posterior head)': 'shoulders',

  // ── Back ──────────────────────────────────────────────────────────────────────
  'latissimus dorsi': 'back', 'lats': 'back',
  'rhomboids': 'back',        'rhomboid major': 'back',  'rhomboid minor': 'back',
  'teres major': 'back',      'lower back': 'back',      'erector spinae': 'back',
  'upper back': 'back',       'middle back': 'back',     'back': 'back',
  'thoracolumbar fascia': 'back', 'multifidus': 'back',
  'quadratus lumborum': 'back',   'spinal erectors': 'back',
  'serratus posterior': 'back',

  // ── Traps + Neck (neck muscles map to traps — nearest visible region) ─────────
  'trapezius': 'traps',           'upper trapezius': 'traps',
  'trapezius (mid/lower)': 'traps', 'trapezius (middle)': 'traps',
  'middle trapezius': 'traps',    'lower trapezius': 'traps',
  'lower traps': 'traps',         'middle traps': 'traps',
  'levator scapulae': 'traps',    'sternocleidomastoid': 'traps',
  'omohyoid': 'traps',            'scalenes': 'traps',
  'neck': 'traps',                'splenius capitis': 'traps',
  'suboccipitals': 'traps',       'cervical erectors': 'traps',

  // ── Biceps ────────────────────────────────────────────────────────────────────
  'biceps brachii': 'biceps',              'biceps brachii (long head)': 'biceps',
  'biceps brachii (short head)': 'biceps', 'brachialis': 'biceps',
  'biceps': 'biceps',                      'arms': 'biceps',
  'coracobrachialis': 'biceps',

  // ── Triceps ───────────────────────────────────────────────────────────────────
  'triceps brachii': 'triceps',               'triceps brachii (long head)': 'triceps',
  'triceps brachii (lateral head)': 'triceps','triceps brachii (medial head)': 'triceps',
  'anconeus': 'triceps', 'triceps': 'triceps',
  'triceps long head': 'triceps',   'triceps medial head': 'triceps',
  'triceps lateral head': 'triceps',

  // ── Forearms (all wrist/hand muscles, from reference image forearm section) ───
  'brachioradialis': 'forearms',        'forearms': 'forearms',
  'forearm flexors': 'forearms',        'grip muscles': 'forearms',
  'pronator teres': 'forearms',         'pronator quadratus': 'forearms',
  'supinator': 'forearms',
  'extensor carpi ulnaris': 'forearms', 'flexor carpi ulnaris': 'forearms',
  'extensor carpi radialis': 'forearms','extensor carpi radialis brevis': 'forearms',
  'extensor carpi radialis longus': 'forearms', 'flexor carpi radialis': 'forearms',
  'extensor pollicis brevis': 'forearms','extensor pollicis longus': 'forearms',
  'abductor pollicis longus': 'forearms','flexor pollicis longus': 'forearms',
  'flexor digitorum superficialis': 'forearms','flexor digitorum profundus': 'forearms',
  'extensor digitorum': 'forearms',     'extensor digiti minimi': 'forearms',
  'palmaris longus': 'forearms',
  'wrist flexors': 'forearms',          'wrist extensors': 'forearms',
  'finger flexors': 'forearms',         'finger extensors': 'forearms',

  // ── Core / Abs (front: rectus abdominis + obliques) ──────────────────────────
  'rectus abdominis': 'core',    'rectus abdominis (lower)': 'core',
  'obliques': 'core',            'external oblique': 'core',  'external obliques': 'core',
  'internal oblique': 'core',    'internal obliques': 'core',
  'transverse abdominis': 'core','transversus abdominis': 'core',
  'hip flexors': 'core',         'core': 'core',   'entire core': 'core',
  'abdominals': 'core',          'abs': 'core',
  'lower abs': 'core',           'upper abs': 'core',
  'iliopsoas': 'core',           'psoas major': 'core',  'iliacus': 'core',
  'full body': 'core',

  // ── Quads + Thigh (FRONT view: rectus femoris, vastus heads, adductors) ──────
  'quadriceps': 'quads',       'rectus femoris': 'quads',
  'vastus lateralis': 'quads', 'vastus medialis': 'quads', 'vastus intermedius': 'quads',
  'adductors': 'quads',        'adductor longus': 'quads', 'adductor brevis': 'quads',
  'adductor magnus': 'quads',  'pectineus': 'quads',
  'tensor fasciae latae': 'quads', 'iliotibial band': 'quads', 'it band': 'quads',
  'sartorius': 'quads',        'gracilis': 'quads',
  'quads': 'quads',            'legs': 'quads',

  // ── Hamstrings (BACK view: biceps femoris, semitendinosus, semimembranosus) ──
  'hamstrings': 'hamstrings',      'biceps femoris': 'hamstrings',
  'semitendinosus': 'hamstrings',  'semimembranosus': 'hamstrings',

  // ── Calves (front: tibialis anterior; back: gastrocnemius, soleus, peroneus) ─
  'gastrocnemius': 'calves',     'soleus': 'calves',     'calves': 'calves',
  'tibialis anterior': 'calves', 'popliteus': 'calves',  'ankle stabilizers': 'calves',
  'peroneus longus': 'calves',   'peroneus brevis': 'calves',
  'fibularis longus': 'calves',  'fibularis brevis': 'calves',
  'flexor hallucis longus': 'calves',   'flexor digitorum longus': 'calves',
  'extensor digitorum longus': 'calves','extensor hallucis longus': 'calves',
  'tibialis posterior': 'calves',

  // ── Glutes (BACK view: gluteus maximus, medius, minimus; deep hip rotators) ──
  'gluteus maximus': 'glutes',  'gluteus medius': 'glutes', 'gluteus minimus': 'glutes',
  'glutes': 'glutes',           'glutes (medius)': 'glutes',
  'hip abductors': 'glutes',    'hip stabilizers': 'glutes',
  'piriformis': 'glutes',       'deep hip rotators': 'glutes',
};

function toRegions(names: string[]): Set<Region> {
  const result = new Set<Region>();
  for (const name of names) {
    const key = name.toLowerCase().trim();
    if (MUSCLE_TO_REGION[key]) { result.add(MUSCLE_TO_REGION[key]); continue; }
    for (const [mk, region] of Object.entries(MUSCLE_TO_REGION)) {
      if (key.includes(mk) || mk.includes(key)) { result.add(region); break; }
    }
  }
  return result;
}

// Two separate anatomical images (cropped to 155×295 aspect ratio).
// body_front.png: 612×1166 crop, figure centered at 60% of width.
// body_back.png:  628×1197 crop, figure centered at 48% of width.
const DISP_W = 155;
const DISP_H = 295;

type BodyView = 'front' | 'back';

interface MEntry { m: Region; paths: string[] }

// ─── FRONT paths (155×295 SVG viewport) ──────────────────────────────────────
const FRONT: MEntry[] = [
  { m: 'chest', paths: [
    'M74.5,54.4 L68.4,60.9 L67.9,65.7 L76.2,72.7 L82.3,74.4 L87.5,73.5 L90.1,70.1 L90.1,64.0 L91.4,63.1 L91.4,57.9 L89.7,55.3 L84.0,53.1 Z',
    'M109.3,53.5 L101.4,53.1 L95.4,55.7 L93.6,63.1 L94.9,64.0 L94.5,68.3 L97.1,73.5 L101.0,74.8 L106.7,73.5 L115.4,68.3 L117.6,62.2 Z',
  ]},
  // front_shoulders = anterior/lateral deltoid (only on FRONT view)
  { m: 'front_shoulders', paths: [
    'M71.4,52.6 L60.5,50.9 L57.0,53.5 L54.0,64.0 L54.0,68.3 L55.7,73.1 L59.2,72.7 L64.0,68.3 L67.1,60.9 L71.4,55.7 Z',
    'M114.1,52.2 L113.6,55.7 L118.0,60.9 L121.5,68.7 L126.3,72.7 L129.3,73.1 L131.1,69.2 L131.1,63.1 L128.0,53.1 L124.5,50.9 Z',
  ]},
  // serratus anterior — side of ribcage
  { m: 'serratus', paths: [
    'M67,69 L68,70 L67,79 L63,91 L57,100 L54,93 L54,78 L56,74 L64,69 Z',
    'M128,100 L124,96 L118,82 L117,69 L121,69 L127,73 L129,76 L131,87 Z',
  ]},
  { m: 'biceps', paths: [
    'M50.9,92.7 L48.8,97.0 L48.8,105.3 L56.2,124.0 L58.3,117.9 L58.8,108.3 Z',
    'M134.1,92.7 L126.3,108.8 L126.7,117.9 L128.9,124.0 L136.7,103.6 L136.7,98.3 Z',
  ]},
  { m: 'forearms', paths: [
    'M49.2,127.9 L49.6,149.2 L51.4,152.3 L52.2,151.9 L51.8,140.5 L54.4,139.2 L56.2,143.1 L57.0,140.1 L55.3,134.0 L50.9,127.9 Z',
    'M135.8,127.9 L133.7,127.9 L129.3,134.9 L128.0,140.1 L128.9,144.0 L130.6,139.7 L133.2,140.1 L132.8,152.3 L133.7,152.7 L135.4,149.7 Z',
  ]},
  // core — full rectus abdominis from just below chest to lower abs
  { m: 'core', paths: [
    'M80,88 L105,88 L108,112 L108,145 L92,150 L76,145 L76,112 Z',
  ]},
  { m: 'quads', paths: [
    'M69.7,198.8 L68.8,200.1 L70.5,203.6 L70.5,229.7 L72.7,229.7 L73.6,211.5 L77.9,202.3 L74.5,202.3 Z',
    'M110.6,183.2 L102.8,191.0 L109.3,190.6 L109.3,194.9 L115.4,197.5 L112.3,201.5 L107.1,202.8 L111.5,210.6 L112.8,229.7 L114.9,229.7 L114.1,204.9 L117.1,198.4 L117.1,191.0 L113.2,188.8 Z',
  ]},
  { m: 'calves', paths: [
    'M72.7,235.0 L70.1,235.0 L67.5,248.9 L64.0,255.0 L56.2,262.4 L57.0,268.5 L61.0,271.5 L64.0,271.1 L69.7,265.8 L71.4,259.3 L76.6,253.7 L75.8,246.7 L72.7,241.0 Z',
    'M112.8,235.0 L108.4,253.7 L112.8,257.6 L115.8,265.8 L123.7,271.5 L128.0,268.9 L128.9,261.9 L121.0,254.5 L117.6,248.4 L118.0,235.0 Z',
  ]},
];

// ─── BACK paths (155×295 SVG viewport) ───────────────────────────────────────
const BACK: MEntry[] = [
  { m: 'traps', paths: [
    'M74,32 L42,58 L74,66 L106,58 Z',
  ]},
  // shoulders = posterior/rear deltoid (BACK view only)
  { m: 'shoulders', paths: [
    'M44.4,54.4 L40.5,55.3 L37.9,58.7 L35.7,67.0 L35.7,72.2 L37.0,74.4 L40.5,71.8 L48.3,68.7 L50.9,65.7 L50.5,59.2 Z',
    'M103.6,54.4 L97.5,59.6 L97.1,64.8 L99.3,68.3 L107.1,71.4 L111.0,74.4 L112.8,71.4 L111.0,60.5 L108.4,55.7 Z',
  ]},
  { m: 'back', paths: [
    'M47.5,70.1 L36.6,77.0 L34.4,85.7 L34.4,93.5 L36.6,97.9 L41.4,86.2 L44.0,84.0 L45.3,87.9 L41.8,97.9 L44.4,97.0 L50.9,82.2 Z',
    'M100.6,70.1 L98.0,83.5 L104.5,97.9 L106.7,98.3 L102.8,86.2 L104.5,84.0 L111.9,97.5 L114.1,87.5 L111.5,76.6 Z',
    'M85.8,64.8 L74.9,64.8 L74.9,92.7 L77.9,90.5 L86.6,76.6 L87.1,70.1 Z',
    'M62.2,64.8 L73.1,64.8 L73.1,92.7 L70.1,90.5 L61.4,76.6 L60.9,70.1 Z',
    'M65.3,120.1 L73.1,131.8 L75.8,147.1 L81.4,151.0 L93.2,154.0 L91.0,142.7 L91.9,132.3 L78.8,126.6 L83.2,120.1 Z',
  ]},
  { m: 'triceps', paths: [
    'M36.1,108.3 L31.3,117.5 L30.9,135.8 L32.2,137.1 L38.3,113.6 Z',
    'M110.6,104.4 L108.0,109.6 L111.5,117.5 L112.3,125.3 L116.2,137.1 L117.6,133.1 L117.1,117.9 Z',
  ]},
  { m: 'forearms', paths: [
    'M35.3,133.6 L34.0,137.5 L30.5,138.8 L30.5,149.2 L35.7,155.3 L36.6,154.0 L34.0,151.0 L33.5,145.3 L35.7,143.1 L37.9,147.1 L39.6,147.1 L39.2,141.0 Z',
    'M112.8,132.3 L108.8,143.1 L108.8,147.9 L110.6,147.9 L110.6,145.3 L112.8,143.1 L114.9,146.2 L114.1,151.4 L111.5,154.5 L112.3,155.8 L115.8,152.7 L118.0,147.9 L118.0,138.8 L114.1,137.1 Z',
  ]},
  { m: 'glutes', paths: [
    'M59.6,154.5 L53.1,155.3 L50.1,165.8 L47.9,182.3 L50.5,196.2 L58.3,175.8 L60.5,161.0 Z',
    'M88.8,154.5 L87.9,163.2 L89.7,174.9 L97.5,195.4 L100.1,184.0 L98.4,166.6 L95.4,155.8 Z',
  ]},
  { m: 'hamstrings', paths: [
    'M52.7,196.7 L50.9,198.4 L47.9,208.4 L49.2,227.6 L50.9,229.7 L54.0,228.4 L54.0,218.9 L56.6,207.5 L54.9,199.3 Z',
    'M95.8,196.7 L92.7,201.5 L91.9,208.0 L93.6,213.2 L94.5,228.4 L97.1,229.7 L99.3,226.7 L100.6,212.3 L100.1,206.2 Z',
  ]},
  { m: 'calves', paths: [
    'M50.9,230.2 L51.8,245.8 L47.0,255.4 L37.4,262.4 L40.9,265.8 L54.4,270.6 L58.8,268.0 L55.7,251.5 L58.3,234.5 Z',
    'M97.5,230.2 L89.7,234.5 L92.7,249.7 L89.3,267.2 L93.6,270.6 L97.1,270.6 L111.0,262.4 L101.0,255.4 L96.7,246.7 Z',
  ]},
];

const COL = {
  primary:   { fill: 'rgba(229,57,53,0.55)',  stroke: '#C62828', sw: 1.5 },
  secondary: { fill: 'rgba(251,140,0,0.50)',  stroke: '#E65100', sw: 1.5 },
  stab:      { fill: 'rgba(67,160,71,0.45)',  stroke: '#2E7D32', sw: 1.5 },
} as const;

interface Props { primaryMuscles: string[]; secondaryMuscles: string[]; stabilizerMuscles: string[]; }

export default function ExerciseMuscleMap({ primaryMuscles, secondaryMuscles, stabilizerMuscles }: Props) {
  const theme = useTheme();
  const [view, setView] = useState<BodyView>('front');

  const primary   = toRegions(primaryMuscles);
  const secondary = toRegions(secondaryMuscles);
  const stab      = toRegions(stabilizerMuscles);

  const getCol = (m: Region) => {
    if (primary.has(m))   return COL.primary;
    if (secondary.has(m)) return COL.secondary;
    if (stab.has(m))      return COL.stab;
    return null;
  };

  const muscles = view === 'front' ? FRONT : BACK;

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
        <View style={{ width: DISP_W, height: DISP_H }}>
          <Image
            source={
              view === 'front'
                ? require('../../assets/body_front.png')
                : require('../../assets/body_back.png')
            }
            style={{ width: DISP_W, height: DISP_H }}
            resizeMode="stretch"
          />
        </View>

        <Svg width={DISP_W} height={DISP_H} style={StyleSheet.absoluteFill}>
          {muscles.map(({ m, paths }) => {
            const c = getCol(m);
            if (!c) return null;
            return paths.map((d, i) => (
              <Path
                key={`${m}-${i}`}
                d={d}
                fill={c.fill}
                stroke={c.stroke}
                strokeWidth={c.sw}
                strokeLinejoin="round"
              />
            ));
          })}
        </Svg>
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
  container:  { alignItems: 'center', paddingVertical: 10 },
  toggle:     { flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  toggleBtn:  { paddingHorizontal: 24, paddingVertical: 7 },
  legend:     { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
});
