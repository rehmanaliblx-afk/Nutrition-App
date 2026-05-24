import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, Path, G, Line, Ellipse } from 'react-native-svg';
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

type BodyView = 'front' | 'back';
interface Props { primaryMuscles: string[]; secondaryMuscles: string[]; stabilizerMuscles: string[]; }

export default function ExerciseMuscleMap({ primaryMuscles, secondaryMuscles, stabilizerMuscles }: Props) {
  const theme = useTheme();
  const [view, setView] = useState<BodyView>('front');

  const primaryRegions = toRegions(primaryMuscles);
  const secondaryRegions = toRegions(secondaryMuscles);
  const stabRegions = toRegions(stabilizerMuscles);

  const bodyFill = theme.dark ? '#3d3535' : '#eddccc';
  const lineColor = theme.dark ? '#5c4f4f' : '#b89878';
  const outlineColor = theme.dark ? '#6e6060' : '#9a7858';

  const mf = (m: MuscleGroup) => {
    if (primaryRegions.has(m)) return '#E53935cc';
    if (secondaryRegions.has(m)) return '#FB8C00aa';
    if (stabRegions.has(m)) return '#43A04788';
    return bodyFill;
  };
  const ms = (m: MuscleGroup) => {
    if (primaryRegions.has(m)) return '#C62828';
    if (secondaryRegions.has(m)) return '#E65100';
    if (stabRegions.has(m)) return '#2E7D32';
    return lineColor;
  };
  const mw = (m: MuscleGroup) => {
    if (primaryRegions.has(m) || secondaryRegions.has(m)) return 1.8;
    if (stabRegions.has(m)) return 1.4;
    return 0.7;
  };

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

      <Svg viewBox="0 0 200 420" width={155} height={325}>

        {/* HEAD */}
        <Circle cx={100} cy={22} r={18} fill={bodyFill} stroke={outlineColor} strokeWidth={1} />
        <Ellipse cx={82} cy={22} rx={3} ry={5} fill={bodyFill} stroke={outlineColor} strokeWidth={0.7} />
        <Ellipse cx={118} cy={22} rx={3} ry={5} fill={bodyFill} stroke={outlineColor} strokeWidth={0.7} />

        {/* NECK */}
        <Path d="M 91,40 C 90,46 89,52 88,58 L 112,58 C 111,52 110,46 109,40 Z"
          fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />

        {/* ── FRONT VIEW ── */}
        {view === 'front' && (
          <G>
            {/* Clavicle lines */}
            <Path d="M 88,58 C 76,61 62,64 50,68" stroke={lineColor} strokeWidth={0.8} fill="none" />
            <Path d="M 112,58 C 124,61 138,64 150,68" stroke={lineColor} strokeWidth={0.8} fill="none" />

            {/* CHEST LEFT */}
            <Path d="M 54,68 C 52,62 72,58 100,63 L 100,108 C 84,115 66,112 54,104 C 46,96 48,80 54,68 Z"
              fill={mf('chest')} stroke={ms('chest')} strokeWidth={mw('chest')} />
            {/* CHEST RIGHT */}
            <Path d="M 146,68 C 148,62 128,58 100,63 L 100,108 C 116,115 134,112 146,104 C 154,96 152,80 146,68 Z"
              fill={mf('chest')} stroke={ms('chest')} strokeWidth={mw('chest')} />
            <Line x1={100} y1={60} x2={100} y2={108} stroke={lineColor} strokeWidth={0.8} />
            {/* Pec lower arc */}
            <Path d="M 54,104 C 70,114 86,116 100,113 C 114,116 130,114 146,104"
              stroke={lineColor} strokeWidth={0.7} fill="none" />

            {/* ANTERIOR DELTOID LEFT */}
            <Path d="M 40,70 C 27,68 19,80 20,94 C 21,108 31,118 42,118 C 52,118 57,107 57,96 C 57,82 50,72 40,70 Z"
              fill={mf('shoulders')} stroke={ms('shoulders')} strokeWidth={mw('shoulders')} />
            {/* ANTERIOR DELTOID RIGHT */}
            <Path d="M 160,70 C 173,68 181,80 180,94 C 179,108 169,118 158,118 C 148,118 143,107 143,96 C 143,82 150,72 160,70 Z"
              fill={mf('shoulders')} stroke={ms('shoulders')} strokeWidth={mw('shoulders')} />
            {/* Delt-pec groove */}
            <Path d="M 42,118 C 47,112 52,106 54,100" stroke={lineColor} strokeWidth={0.7} fill="none" />
            <Path d="M 158,118 C 153,112 148,106 146,100" stroke={lineColor} strokeWidth={0.7} fill="none" />

            {/* BICEPS LEFT */}
            <Path d="M 19,107 C 12,126 11,148 15,166 C 19,178 29,183 39,178 C 48,173 50,156 48,138 C 46,120 34,107 19,107 Z"
              fill={mf('biceps')} stroke={ms('biceps')} strokeWidth={mw('biceps')} />
            <Path d="M 12,140 C 22,134 38,134 48,140" stroke={lineColor} strokeWidth={0.6} fill="none" />
            {/* BICEPS RIGHT */}
            <Path d="M 181,107 C 188,126 189,148 185,166 C 181,178 171,183 161,178 C 152,173 150,156 152,138 C 154,120 166,107 181,107 Z"
              fill={mf('biceps')} stroke={ms('biceps')} strokeWidth={mw('biceps')} />
            <Path d="M 188,140 C 178,134 162,134 152,140" stroke={lineColor} strokeWidth={0.6} fill="none" />

            {/* FOREARM LEFT */}
            <Path d="M 13,170 C 8,188 8,208 13,225 C 17,237 27,242 37,237 C 45,231 47,213 45,195 C 43,177 31,167 13,170 Z"
              fill={mf('forearms')} stroke={ms('forearms')} strokeWidth={mw('forearms')} />
            {/* FOREARM RIGHT */}
            <Path d="M 187,170 C 192,188 192,208 187,225 C 183,237 173,242 163,237 C 155,231 153,213 155,195 C 157,177 169,167 187,170 Z"
              fill={mf('forearms')} stroke={ms('forearms')} strokeWidth={mw('forearms')} />

            {/* RECTUS ABDOMINIS */}
            <Path d="M 83,108 C 78,110 76,120 76,130 L 76,180 C 79,186 88,190 100,190 C 112,190 121,186 124,180 L 124,130 C 124,120 122,110 117,108 Z"
              fill={mf('core')} stroke={ms('core')} strokeWidth={mw('core')} />
            <Line x1={77} y1={130} x2={123} y2={130} stroke={lineColor} strokeWidth={0.8} />
            <Line x1={77} y1={150} x2={123} y2={150} stroke={lineColor} strokeWidth={0.8} />
            <Line x1={77} y1={170} x2={123} y2={170} stroke={lineColor} strokeWidth={0.8} />
            <Line x1={100} y1={108} x2={100} y2={190} stroke={lineColor} strokeWidth={0.8} />

            {/* OBLIQUES LEFT */}
            <Path d="M 53,107 C 46,125 44,148 48,170 C 51,184 60,191 70,191 L 76,191 L 76,130 C 76,120 71,111 62,107 Z"
              fill={mf('core')} stroke={ms('core')} strokeWidth={mw('core')} />
            <Path d="M 52,108 C 57,118 59,130 57,142" stroke={lineColor} strokeWidth={0.6} fill="none" />
            <Path d="M 49,126 C 54,135 56,147 54,158" stroke={lineColor} strokeWidth={0.6} fill="none" />

            {/* OBLIQUES RIGHT */}
            <Path d="M 147,107 C 154,125 156,148 152,170 C 149,184 140,191 130,191 L 124,191 L 124,130 C 124,120 129,111 138,107 Z"
              fill={mf('core')} stroke={ms('core')} strokeWidth={mw('core')} />
            <Path d="M 148,108 C 143,118 141,130 143,142" stroke={lineColor} strokeWidth={0.6} fill="none" />
            <Path d="M 151,126 C 146,135 144,147 146,158" stroke={lineColor} strokeWidth={0.6} fill="none" />

            {/* HIP / PELVIS */}
            <Path d="M 50,180 C 52,192 62,200 78,202 L 100,204 L 122,202 C 138,200 148,192 150,180 L 124,192 L 100,194 L 76,192 Z"
              fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />

            {/* LEFT QUADS — vastus lateralis */}
            <Path d="M 50,204 C 44,225 42,254 47,278 C 51,292 61,298 69,294 C 67,278 65,257 66,234 C 67,214 58,202 50,204 Z"
              fill={mf('quads')} stroke={ms('quads')} strokeWidth={mw('quads')} />
            {/* rectus femoris */}
            <Path d="M 66,202 C 61,222 59,250 63,276 C 67,291 77,297 85,293 C 87,278 87,256 85,234 C 83,214 76,202 66,202 Z"
              fill={mf('quads')} stroke={ms('quads')} strokeWidth={mw('quads')} />
            {/* vastus medialis */}
            <Path d="M 83,205 C 87,225 88,252 86,276 C 86,287 92,295 99,291 C 101,277 100,255 97,233 C 93,214 88,204 83,205 Z"
              fill={mf('quads')} stroke={ms('quads')} strokeWidth={mw('quads')} />
            <Line x1={66} y1={242} x2={74} y2={242} stroke={lineColor} strokeWidth={0.6} />
            <Line x1={74} y1={242} x2={86} y2={242} stroke={lineColor} strokeWidth={0.6} />

            {/* RIGHT QUADS — vastus lateralis */}
            <Path d="M 150,204 C 156,225 158,254 153,278 C 149,292 139,298 131,294 C 133,278 135,257 134,234 C 133,214 142,202 150,204 Z"
              fill={mf('quads')} stroke={ms('quads')} strokeWidth={mw('quads')} />
            {/* rectus femoris */}
            <Path d="M 134,202 C 139,222 141,250 137,276 C 133,291 123,297 115,293 C 113,278 113,256 115,234 C 117,214 124,202 134,202 Z"
              fill={mf('quads')} stroke={ms('quads')} strokeWidth={mw('quads')} />
            {/* vastus medialis */}
            <Path d="M 117,205 C 113,225 112,252 114,276 C 114,287 108,295 101,291 C 99,277 100,255 103,233 C 107,214 112,204 117,205 Z"
              fill={mf('quads')} stroke={ms('quads')} strokeWidth={mw('quads')} />
            <Line x1={134} y1={242} x2={126} y2={242} stroke={lineColor} strokeWidth={0.6} />
            <Line x1={126} y1={242} x2={114} y2={242} stroke={lineColor} strokeWidth={0.6} />

            {/* KNEECAPS */}
            <Ellipse cx={70} cy={297} rx={16} ry={10} fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />
            <Ellipse cx={130} cy={297} rx={16} ry={10} fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />

            {/* LEFT CALVES — gastrocnemius outer head */}
            <Path d="M 47,308 C 41,330 39,357 44,379 C 48,392 59,397 67,393 C 65,377 65,352 66,328 C 67,308 56,300 47,308 Z"
              fill={mf('calves')} stroke={ms('calves')} strokeWidth={mw('calves')} />
            {/* inner head */}
            <Path d="M 83,306 C 89,328 91,355 88,378 C 85,392 75,398 67,394 C 66,378 66,353 66,328 C 67,308 74,299 83,306 Z"
              fill={mf('calves')} stroke={ms('calves')} strokeWidth={mw('calves')} />
            <Line x1={66} y1={308} x2={66} y2={378} stroke={lineColor} strokeWidth={0.7} />

            {/* RIGHT CALVES */}
            <Path d="M 153,308 C 159,330 161,357 156,379 C 152,392 141,397 133,393 C 135,377 135,352 134,328 C 133,308 144,300 153,308 Z"
              fill={mf('calves')} stroke={ms('calves')} strokeWidth={mw('calves')} />
            <Path d="M 117,306 C 111,328 109,355 112,378 C 115,392 125,398 133,394 C 134,378 134,353 134,328 C 133,308 126,299 117,306 Z"
              fill={mf('calves')} stroke={ms('calves')} strokeWidth={mw('calves')} />
            <Line x1={134} y1={308} x2={134} y2={378} stroke={lineColor} strokeWidth={0.7} />

            {/* FEET */}
            <Ellipse cx={63} cy={400} rx={19} ry={8} fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />
            <Ellipse cx={137} cy={400} rx={19} ry={8} fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />
          </G>
        )}

        {/* ── BACK VIEW ── */}
        {view === 'back' && (
          <G>
            {/* UPPER TRAPEZIUS LEFT */}
            <Path d="M 91,40 C 88,50 84,58 80,62 C 68,68 52,75 40,83 C 32,89 30,101 36,109 C 52,97 70,83 84,75 C 97,68 100,54 100,46 Z"
              fill={mf('traps')} stroke={ms('traps')} strokeWidth={mw('traps')} />
            {/* UPPER TRAPEZIUS RIGHT */}
            <Path d="M 109,40 C 112,50 116,58 120,62 C 132,68 148,75 160,83 C 168,89 170,101 164,109 C 148,97 130,83 116,75 C 103,68 100,54 100,46 Z"
              fill={mf('traps')} stroke={ms('traps')} strokeWidth={mw('traps')} />
            {/* MID TRAP / RHOMBOIDS */}
            <Path d="M 58,102 C 58,116 64,130 72,135 L 100,140 L 128,135 C 136,130 142,116 142,102 C 128,94 114,91 100,91 C 86,91 72,94 58,102 Z"
              fill={mf('traps')} stroke={ms('traps')} strokeWidth={mw('traps')} />
            <Line x1={100} y1={62} x2={100} y2={218} stroke={lineColor} strokeWidth={0.8} />

            {/* REAR DELTOID LEFT */}
            <Path d="M 38,70 C 25,75 18,90 22,106 C 26,118 37,124 47,119 C 56,114 57,101 55,89 C 53,79 46,70 38,70 Z"
              fill={mf('shoulders')} stroke={ms('shoulders')} strokeWidth={mw('shoulders')} />
            {/* REAR DELTOID RIGHT */}
            <Path d="M 162,70 C 175,75 182,90 178,106 C 174,118 163,124 153,119 C 144,114 143,101 145,89 C 147,79 154,70 162,70 Z"
              fill={mf('shoulders')} stroke={ms('shoulders')} strokeWidth={mw('shoulders')} />

            {/* LATISSIMUS DORSI LEFT */}
            <Path d="M 46,119 C 39,142 37,168 41,190 C 45,206 57,214 69,211 C 77,207 81,195 81,178 C 81,160 75,140 65,128 C 56,118 50,117 46,119 Z"
              fill={mf('back')} stroke={ms('back')} strokeWidth={mw('back')} />
            {/* LATISSIMUS DORSI RIGHT */}
            <Path d="M 154,119 C 161,142 163,168 159,190 C 155,206 143,214 131,211 C 123,207 119,195 119,178 C 119,160 125,140 135,128 C 144,118 150,117 154,119 Z"
              fill={mf('back')} stroke={ms('back')} strokeWidth={mw('back')} />

            {/* LOWER BACK / ERECTOR SPINAE */}
            <Path d="M 80,142 C 77,164 77,188 82,210 C 88,218 96,220 100,220 C 104,220 112,218 118,210 C 123,188 123,164 120,142 C 113,134 108,131 100,131 C 92,131 87,134 80,142 Z"
              fill={mf('back')} stroke={ms('back')} strokeWidth={mw('back')} />

            {/* TRICEPS LEFT */}
            <Path d="M 22,104 C 15,124 13,146 17,165 C 21,177 31,183 41,178 C 50,172 51,155 49,137 C 47,119 36,104 22,104 Z"
              fill={mf('triceps')} stroke={ms('triceps')} strokeWidth={mw('triceps')} />
            <Path d="M 13,142 C 23,136 40,136 50,142" stroke={lineColor} strokeWidth={0.6} fill="none" />
            {/* TRICEPS RIGHT */}
            <Path d="M 178,104 C 185,124 187,146 183,165 C 179,177 169,183 159,178 C 150,172 149,155 151,137 C 153,119 164,104 178,104 Z"
              fill={mf('triceps')} stroke={ms('triceps')} strokeWidth={mw('triceps')} />
            <Path d="M 187,142 C 177,136 160,136 150,142" stroke={lineColor} strokeWidth={0.6} fill="none" />

            {/* FOREARMS BACK LEFT */}
            <Path d="M 13,170 C 8,188 8,208 13,225 C 17,237 27,242 37,237 C 45,231 47,213 45,195 C 43,177 31,167 13,170 Z"
              fill={mf('forearms')} stroke={ms('forearms')} strokeWidth={mw('forearms')} />
            {/* FOREARMS BACK RIGHT */}
            <Path d="M 187,170 C 192,188 192,208 187,225 C 183,237 173,242 163,237 C 155,231 153,213 155,195 C 157,177 169,167 187,170 Z"
              fill={mf('forearms')} stroke={ms('forearms')} strokeWidth={mw('forearms')} />

            {/* GLUTES LEFT */}
            <Path d="M 56,216 C 48,238 47,264 55,286 C 62,300 74,307 86,302 C 91,292 91,273 87,252 C 83,232 72,216 56,216 Z"
              fill={mf('glutes')} stroke={ms('glutes')} strokeWidth={mw('glutes')} />
            {/* GLUTES RIGHT */}
            <Path d="M 144,216 C 152,238 153,264 145,286 C 138,300 126,307 114,302 C 109,292 109,273 113,252 C 117,232 128,216 144,216 Z"
              fill={mf('glutes')} stroke={ms('glutes')} strokeWidth={mw('glutes')} />
            <Path d="M 86,220 C 94,226 100,228 100,228 C 100,228 106,226 114,220"
              stroke={lineColor} strokeWidth={0.8} fill="none" />

            {/* KNEE backs */}
            <Ellipse cx={70} cy={308} rx={16} ry={9} fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />
            <Ellipse cx={130} cy={308} rx={16} ry={9} fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />

            {/* HAMSTRINGS LEFT — biceps femoris outer */}
            <Path d="M 50,310 C 44,333 43,360 48,382 C 52,395 63,401 71,396 C 70,379 69,354 70,331 C 71,311 60,303 50,310 Z"
              fill={mf('hamstrings')} stroke={ms('hamstrings')} strokeWidth={mw('hamstrings')} />
            {/* semimembranosus inner */}
            <Path d="M 84,308 C 90,330 92,357 89,380 C 87,394 78,402 70,398 C 69,381 69,355 70,331 C 71,311 77,302 84,308 Z"
              fill={mf('hamstrings')} stroke={ms('hamstrings')} strokeWidth={mw('hamstrings')} />
            <Line x1={70} y1={310} x2={70} y2={382} stroke={lineColor} strokeWidth={0.7} />

            {/* HAMSTRINGS RIGHT */}
            <Path d="M 150,310 C 156,333 157,360 152,382 C 148,395 137,401 129,396 C 130,379 131,354 130,331 C 129,311 140,303 150,310 Z"
              fill={mf('hamstrings')} stroke={ms('hamstrings')} strokeWidth={mw('hamstrings')} />
            <Path d="M 116,308 C 110,330 108,357 111,380 C 113,394 122,402 130,398 C 131,381 131,355 130,331 C 129,311 123,302 116,308 Z"
              fill={mf('hamstrings')} stroke={ms('hamstrings')} strokeWidth={mw('hamstrings')} />
            <Line x1={130} y1={310} x2={130} y2={382} stroke={lineColor} strokeWidth={0.7} />

            {/* CALVES BACK LEFT */}
            <Path d="M 47,400 C 42,410 42,418 47,416 C 54,414 63,411 68,409 L 68,400 C 61,398 54,397 47,400 Z"
              fill={mf('calves')} stroke={ms('calves')} strokeWidth={mw('calves')} />
            <Path d="M 83,400 C 88,410 88,418 83,416 C 76,414 70,411 68,409 L 68,400 C 74,398 80,397 83,400 Z"
              fill={mf('calves')} stroke={ms('calves')} strokeWidth={mw('calves')} />

            {/* CALVES BACK RIGHT */}
            <Path d="M 153,400 C 158,410 158,418 153,416 C 146,414 137,411 132,409 L 132,400 C 139,398 146,397 153,400 Z"
              fill={mf('calves')} stroke={ms('calves')} strokeWidth={mw('calves')} />
            <Path d="M 117,400 C 112,410 112,418 117,416 C 124,414 130,411 132,409 L 132,400 C 126,398 120,397 117,400 Z"
              fill={mf('calves')} stroke={ms('calves')} strokeWidth={mw('calves')} />

            {/* FEET back */}
            <Ellipse cx={63} cy={410} rx={18} ry={7} fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />
            <Ellipse cx={137} cy={410} rx={18} ry={7} fill={bodyFill} stroke={outlineColor} strokeWidth={0.8} />
          </G>
        )}
      </Svg>

      <View style={styles.legend}>
        {[{ label: 'Primary', color: '#E53935' }, { label: 'Secondary', color: '#FB8C00' }, { label: 'Stabilizer', color: '#43A047' }].map((item) => (
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
    flexDirection: 'row', borderRadius: 20, borderWidth: 1,
    overflow: 'hidden', marginBottom: 10,
  },
  toggleBtn: { paddingHorizontal: 24, paddingVertical: 7 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});
