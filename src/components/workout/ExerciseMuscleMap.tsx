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

// Two separate clean anatomical images, no labels.
// body_front.png: 613×1168 crop centred at 59.4% of width → figure at x=92/155.
// body_back.png:  629×1198 crop centred at 47.7% of width → figure at x=74/155.
// Both render at 155×295 with uniform scale ~0.253, keeping SVG paths calibrated.
const DISP_W = 155;
const FULL_W  = DISP_W * 2;   // kept for layout only
const DISP_H  = 295;

type BodyView = 'front' | 'back';

interface MEntry { m: Region; paths: string[] }

// ─── FRONT paths (155×295 SVG viewport, figure centre x≈77) ─────────────────
// Calibrated for body_front.png (613×1168 → 155×295, scale 0.253×0.253).
// Body boundary bands (display px): shoulders y=51-53 x=54-100; bicep peak y=88
// x=29-127; waist y=172+ x=46-108; quads y=183-242 x=49-105; calves y=243-273.
const FRONT: MEntry[] = [
  { m: 'chest', paths: [
    'M77,63 L64,64 L50,68 L44,76 L44,88 L50,98 L64,102 L77,102 Z',
    'M77,63 L77,102 L90,102 L104,98 L110,88 L110,76 L104,68 L90,64 Z',
  ]},
  { m: 'front_shoulders', paths: [
    'M59,52 L46,56 L38,63 L37,73 L40,81 L47,85 L56,81 L62,72 L62,62 Z',
    'M95,52 L92,62 L92,72 L98,81 L107,85 L114,81 L117,73 L116,63 L108,56 Z',
  ]},
  { m: 'serratus', paths: [
    'M58,92 L51,96 L47,105 L49,117 L55,122 L61,117 L63,106 Z',
    'M96,92 L91,106 L93,117 L99,122 L105,117 L107,105 L103,96 Z',
  ]},
  { m: 'biceps', paths: [
    'M48,67 L39,74 L32,84 L29,97 L30,111 L36,119 L44,120 L50,113 L52,100 L51,83 Z',
    'M106,67 L103,83 L102,100 L104,113 L110,120 L118,119 L124,111 L125,97 L122,84 L115,74 Z',
  ]},
  { m: 'forearms', paths: [
    'M46,121 L38,126 L28,133 L22,144 L22,157 L26,165 L34,167 L41,161 L45,149 L47,134 Z',
    'M108,121 L107,134 L109,149 L113,161 L120,167 L128,165 L132,157 L132,144 L126,133 L116,126 Z',
  ]},
  { m: 'core', paths: [
    'M65,101 L62,114 L61,131 L62,148 L65,161 L69,166 L77,168 L85,166 L89,161 L92,148 L93,131 L92,114 L89,101 Z',
  ]},
  { m: 'quads', paths: [
    'M53,183 L50,197 L49,211 L50,223 L53,234 L59,242 L66,243 L72,241 L75,231 L75,218 L73,205 L70,193 L66,183 Z',
    'M88,183 L84,193 L81,205 L79,218 L79,231 L82,241 L88,243 L95,242 L101,234 L104,223 L105,211 L104,197 L101,183 Z',
  ]},
  { m: 'calves', paths: [
    'M56,243 L53,255 L53,266 L57,273 L63,275 L70,273 L73,266 L73,255 L71,243 Z',
    'M83,243 L82,255 L81,266 L84,273 L90,275 L97,273 L101,266 L101,255 L98,243 Z',
  ]},
];

// ─── BACK paths (155×295 SVG viewport, figure centre x≈76) ───────────────────
// Calibrated for body_back.png (629×1198 → 155×295, scale 0.246×0.246).
// Body boundary bands: shoulders y=62 x=31-123; arms end y=175 x=46-106;
// hips y=175-207 x=45-106; hamstrings y=205-244; calves y=244-284.
const BACK: MEntry[] = [
  { m: 'traps', paths: [
    'M76,48 L60,55 L50,63 L48,72 L50,81 L57,86 L67,85 L76,82 L85,85 L95,86 L102,81 L104,72 L102,63 L92,55 Z',
  ]},
  { m: 'shoulders', paths: [
    'M52,61 L41,64 L34,71 L33,80 L37,86 L46,88 L55,84 L60,75 L61,65 Z',
    'M100,61 L93,65 L94,75 L99,84 L108,88 L117,86 L121,80 L120,71 L113,64 Z',
  ]},
  { m: 'back', paths: [
    'M52,75 L41,85 L34,98 L32,116 L35,135 L42,152 L49,163 L61,166 L65,155 L61,133 L58,113 L57,95 Z',
    'M100,75 L97,95 L95,113 L92,133 L88,155 L92,166 L103,163 L110,152 L117,135 L120,116 L118,98 L111,85 Z',
    'M62,69 L62,87 L70,93 L76,94 L82,93 L90,87 L90,69 Z',
    'M65,129 L63,151 L65,164 L70,169 L76,171 L82,169 L87,164 L89,151 L87,129 Z',
  ]},
  { m: 'triceps', paths: [
    'M50,68 L40,78 L33,92 L30,108 L33,121 L40,125 L48,121 L52,109 L53,93 Z',
    'M102,68 L101,93 L102,109 L106,121 L114,125 L121,121 L124,108 L121,92 L114,78 Z',
  ]},
  { m: 'forearms', paths: [
    'M48,123 L40,129 L29,136 L21,147 L18,158 L21,168 L29,171 L38,168 L44,156 L47,141 L48,129 Z',
    'M105,123 L106,129 L107,141 L110,156 L116,168 L125,171 L133,168 L136,158 L133,147 L124,136 L113,129 Z',
  ]},
  { m: 'glutes', paths: [
    'M52,176 L47,187 L46,199 L50,208 L58,212 L67,209 L73,200 L75,187 L72,176 Z',
    'M79,176 L80,187 L81,200 L87,209 L96,212 L104,208 L108,199 L107,187 L102,176 Z',
  ]},
  { m: 'hamstrings', paths: [
    'M52,206 L49,218 L49,230 L53,241 L59,246 L66,246 L72,243 L75,234 L75,221 L72,209 L66,206 Z',
    'M79,206 L82,209 L79,221 L79,234 L82,243 L88,246 L95,246 L101,241 L105,230 L105,218 L102,206 Z',
  ]},
  { m: 'calves', paths: [
    'M53,246 L50,258 L51,271 L55,281 L62,285 L69,284 L74,276 L75,263 L74,250 L70,246 Z',
    'M80,246 L80,250 L79,263 L80,276 L85,284 L92,285 L99,281 L103,271 L104,258 L101,246 Z',
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
          <Image
            source={view === 'front'
              ? require('../../assets/body_front.png')
              : require('../../assets/body_back.png')}
            style={{ width: DISP_W, height: DISP_H }}
            resizeMode="stretch"
          />

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
