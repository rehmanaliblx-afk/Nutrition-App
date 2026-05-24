import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Text, Searchbar, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { WorkoutStackParamList } from '@/navigation/types';
import { EXERCISES, Exercise } from '@/constants/exercises';
import BodyDiagram, { MuscleGroup, MUSCLE_LABELS } from '@/components/workout/BodyDiagram';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExerciseLibrary'>;

const DIFFICULTY_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

// ──────────────────────────────────────────────
// Muscle → exercise filter
// ──────────────────────────────────────────────
function filterByMuscle(exercises: Exercise[], muscle: MuscleGroup): Exercise[] {
  const has = (arr: string[], term: string) =>
    arr.some((m) => m.toLowerCase().includes(term.toLowerCase()));

  switch (muscle) {
    case 'chest':
      return exercises.filter((e) => e.category === 'chest');
    case 'shoulders':
      return exercises.filter((e) => e.category === 'shoulders');
    case 'biceps':
      return exercises.filter(
        (e) => e.category === 'biceps' || (e.category !== 'back' && has(e.primaryMuscles, 'bicep'))
      );
    case 'triceps':
      return exercises.filter((e) => e.category === 'triceps');
    case 'forearms':
      return exercises.filter((e) =>
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'forearm') ||
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'brachioradialis')
      );
    case 'core':
      return exercises.filter((e) => e.category === 'core');
    case 'back':
      return exercises.filter((e) => e.category === 'back');
    case 'traps':
      return exercises.filter((e) =>
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'trapezius') ||
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'trap')
      );
    case 'glutes':
      return exercises.filter(
        (e) =>
          e.category === 'glutes' ||
          has(e.primaryMuscles, 'glute')
      );
    case 'quads':
      return exercises.filter((e) =>
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'quad') ||
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'quadricep')
      );
    case 'hamstrings':
      return exercises.filter((e) =>
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'hamstring')
      );
    case 'calves':
      return exercises.filter((e) =>
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'calf') ||
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'calves') ||
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'gastrocnemius') ||
        has([...e.primaryMuscles, ...e.secondaryMuscles], 'soleus')
      );
    default:
      return exercises;
  }
}

// Sub-muscles per muscle group
const SUB_MUSCLES: Partial<Record<MuscleGroup, string[]>> = {
  shoulders: ['Anterior Deltoid', 'Medial Deltoid', 'Lateral Deltoid', 'Posterior Deltoid', 'Rear Deltoid'],
  chest: ['Pectoralis Major', 'Pectoralis Major (Upper)', 'Pectoralis Major (Lower)', 'Upper Pectoralis'],
  back: ['Latissimus Dorsi', 'Rhomboids', 'Teres Major', 'Erector Spinae'],
  biceps: ['Biceps Brachii', 'Biceps Brachii (Long Head)', 'Biceps Brachii (Short Head)', 'Brachialis'],
  triceps: ['Triceps Brachii', 'Triceps Brachii (Long Head)', 'Triceps Brachii (Lateral Head)', 'Triceps Brachii (Medial Head)'],
  core: ['Rectus Abdominis', 'Obliques', 'Transverse Abdominis', 'Hip Flexors'],
  quads: ['Quadriceps', 'Rectus Femoris', 'Adductors'],
  glutes: ['Gluteus Maximus', 'Gluteus Medius'],
  hamstrings: ['Hamstrings', 'Biceps Femoris'],
  calves: ['Gastrocnemius', 'Soleus'],
  traps: ['Trapezius', 'Upper Trapezius'],
};

function filterBySubMuscle(exercises: Exercise[], subMuscle: string): Exercise[] {
  const q = subMuscle.toLowerCase();
  return exercises.filter(
    (e) =>
      e.primaryMuscles.some((m) => m.toLowerCase().includes(q) || q.includes(m.toLowerCase())) ||
      e.secondaryMuscles.some((m) => m.toLowerCase().includes(q) || q.includes(m.toLowerCase()))
  );
}

type ListItem =
  | { t: 'header'; label: string; count: number }
  | { t: 'exercise'; data: Exercise };

// ──────────────────────────────────────────────
// Exercise card
// ──────────────────────────────────────────────
const ExerciseCard = React.memo(
  ({
    exercise,
    onPress,
  }: {
    exercise: Exercise;
    onPress: () => void;
  }) => {
    const theme = useTheme();
    const diffColor = DIFFICULTY_COLORS[exercise.difficulty];
    const isCompound = (exercise as any).type === 'compound';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text
            variant="titleSmall"
            style={[styles.exerciseName, { color: theme.colors.onSurface }]}
          >
            {exercise.name}
          </Text>
          <View style={styles.cardBadges}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: isCompound
                    ? theme.colors.primary + '22'
                    : theme.colors.secondary + '22',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: isCompound ? theme.colors.primary : theme.colors.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                {isCompound ? 'Compound' : 'Isolation'}
              </Text>
            </View>
            <View
              style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}
            >
              <Text
                style={{ fontSize: 10, fontWeight: '700', color: diffColor, textTransform: 'capitalize' }}
              >
                {exercise.difficulty}
              </Text>
            </View>
          </View>
        </View>

        <Text
          variant="bodySmall"
          style={{ color: theme.colors.primary, marginTop: 3, fontWeight: '600' }}
        >
          {exercise.primaryMuscles.join(' · ')}
        </Text>
        {exercise.secondaryMuscles.length > 0 && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}
            numberOfLines={1}
          >
            + {exercise.secondaryMuscles.join(', ')}
          </Text>
        )}

        <View style={styles.cardBottom}>
          <View style={styles.equipRow}>
            <Ionicons
              name="barbell-outline"
              size={12}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}
            >
              {exercise.equipment}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.onSurfaceVariant} />
        </View>
      </TouchableOpacity>
    );
  }
);

// ──────────────────────────────────────────────
// Main screen
// ──────────────────────────────────────────────
export default function ExerciseLibraryScreen({ navigation }: Props) {
  const theme = useTheme();
  const drawerNav = useNavigation();
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedSubMuscle, setSelectedSubMuscle] = useState<string | null>(null);

  const handleSelectMuscle = useCallback((muscle: MuscleGroup | null) => {
    setSelectedMuscle(muscle);
    setSelectedSubMuscle(null);
  }, []);

  const subMuscles = selectedMuscle ? (SUB_MUSCLES[selectedMuscle] ?? null) : null;

  const filtered = useMemo(() => {
    let list = selectedMuscle ? filterByMuscle(EXERCISES, selectedMuscle) : EXERCISES;
    if (selectedSubMuscle) {
      list = filterBySubMuscle(list, selectedSubMuscle);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.primaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
          e.secondaryMuscles.some((m) => m.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedMuscle, selectedSubMuscle, search]);

  const compound = useMemo(
    () => filtered.filter((e) => (e as any).type === 'compound'),
    [filtered]
  );
  const isolation = useMemo(
    () => filtered.filter((e) => (e as any).type === 'isolation'),
    [filtered]
  );

  const flatData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    if (compound.length > 0) {
      items.push({ t: 'header', label: '💪 Compound', count: compound.length });
      compound.forEach((e) => items.push({ t: 'exercise', data: e }));
    }
    if (isolation.length > 0) {
      items.push({ t: 'header', label: '🎯 Isolation', count: isolation.length });
      isolation.forEach((e) => items.push({ t: 'exercise', data: e }));
    }
    return items;
  }, [compound, isolation]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.t === 'header') {
        return (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700', flex: 1 }}
            >
              {item.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: theme.colors.primary + '22' },
              ]}
            >
              <Text
                style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}
              >
                {item.count}
              </Text>
            </View>
          </View>
        );
      }
      return (
        <ExerciseCard
          exercise={item.data}
          onPress={() =>
            navigation.navigate('ExerciseDetail', { exerciseId: item.data.id })
          }
        />
      );
    },
    [navigation, theme]
  );

  const ListHeader = useCallback(
    () => (
      <View>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Searchbar
            placeholder="Search exercises or muscles…"
            value={search}
            onChangeText={setSearch}
            style={[
              styles.searchbar,
              { backgroundColor: theme.colors.surfaceVariant, elevation: 0 },
            ]}
            inputStyle={{ fontSize: 14 }}
          />
        </View>

        {/* Body diagram */}
        <Surface
          style={[styles.diagramCard, { backgroundColor: theme.colors.surface }]}
          elevation={1}
        >
          <BodyDiagram selected={selectedMuscle} onSelect={handleSelectMuscle} />
        </Surface>

        {/* Sub-muscle filter chips */}
        {subMuscles && subMuscles.length > 0 && (
          <View style={styles.subMuscleSection}>
            <Text variant="labelSmall" style={[styles.subMuscleLabel, { color: theme.colors.onSurfaceVariant }]}>
              {MUSCLE_LABELS[selectedMuscle!]} — filter by muscle:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subMuscleChips}>
              {subMuscles.map((sm) => {
                const active = selectedSubMuscle === sm;
                return (
                  <TouchableOpacity
                    key={sm}
                    style={[
                      styles.subChip,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.surfaceVariant,
                        borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                      },
                    ]}
                    onPress={() => setSelectedSubMuscle(active ? null : sm)}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: active ? '#fff' : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {sm}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Results summary */}
        <View style={styles.resultsRow}>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
            {selectedSubMuscle
              ? ` for ${selectedSubMuscle}`
              : selectedMuscle
              ? ` for ${MUSCLE_LABELS[selectedMuscle]}`
              : ' total'}
          </Text>
          {selectedMuscle && (
            <TouchableOpacity
              onPress={() => handleSelectMuscle(null)}
              style={[
                styles.clearBtn,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.colors.onErrorContainer,
                }}
              >
                Clear filter
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [search, selectedMuscle, selectedSubMuscle, subMuscles, filtered.length, theme, handleSelectMuscle]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      <SafeAreaView
        edges={['top']}
        style={{ backgroundColor: theme.colors.primary }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => drawerNav.dispatch(DrawerActions.openDrawer())}
            style={styles.menuBtn}
          >
            <Ionicons name="menu" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              variant="titleLarge"
              style={{ color: '#fff', fontWeight: '700' }}
            >
              Exercise Library
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              {EXERCISES.length} exercises
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={flatData}
        keyExtractor={(item, idx) =>
          item.t === 'header' ? `h-${idx}` : `e-${item.data.id}`
        }
        renderItem={renderItem}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="search"
              size={48}
              color={theme.colors.outlineVariant}
            />
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
            >
              No exercises found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuBtn: { padding: 4 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10, elevation: 2 },
  searchbar: { borderRadius: 12 },
  diagramCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  subMuscleSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  subMuscleLabel: {
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subMuscleChips: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  listContent: { paddingBottom: 40 },
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  exerciseName: { flex: 1, fontWeight: '700', marginRight: 8 },
  cardBadges: { flexDirection: 'row', gap: 4, flexShrink: 0 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  equipRow: { flexDirection: 'row', alignItems: 'center' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
});
