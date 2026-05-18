import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Searchbar, Chip, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '@/navigation/types';
import { EXERCISES, CATEGORY_LABELS, ExerciseCategory, Exercise } from '@/constants/exercises';
import { useNavigation, DrawerActions } from '@react-navigation/native';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExerciseLibrary'>;

const CATEGORY_ORDER: ExerciseCategory[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'cardio', 'full_body',
];

const CATEGORY_ICONS: Record<ExerciseCategory, React.ComponentProps<typeof Ionicons>['name']> = {
  chest: 'body',
  back: 'body',
  shoulders: 'body',
  biceps: 'body',
  triceps: 'body',
  legs: 'walk',
  glutes: 'body',
  core: 'body',
  cardio: 'heart',
  full_body: 'fitness',
};

const DIFFICULTY_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

export default function ExerciseLibraryScreen({ navigation }: Props) {
  const theme = useTheme();
  const drawerNav = useNavigation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | null>(null);

  const filtered = useMemo(() => {
    let list = EXERCISES;
    if (activeCategory) list = list.filter((e) => e.category === activeCategory);
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
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, Exercise[]> = {};
    filtered.forEach((ex) => {
      if (!map[ex.category]) map[ex.category] = [];
      map[ex.category].push(ex);
    });
    return CATEGORY_ORDER.filter((c) => map[c]?.length > 0).map((c) => ({
      category: c,
      exercises: map[c],
    }));
  }, [filtered]);

  const renderExercise = useCallback(
    ({ item }: { item: Exercise }) => (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text variant="titleSmall" style={[styles.exerciseName, { color: theme.colors.onSurface }]}>
            {item.name}
          </Text>
          <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[item.difficulty] + '22' }]}>
            <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[item.difficulty] }]}>
              {item.difficulty}
            </Text>
          </View>
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 2 }}>
          {item.primaryMuscles.join(' · ')}
        </Text>
        {item.secondaryMuscles.length > 0 && (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}>
            Secondary: {item.secondaryMuscles.join(', ')}
          </Text>
        )}
        <View style={styles.cardBottom}>
          <View style={styles.equipmentRow}>
            <Ionicons name="barbell-outline" size={12} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
              {item.equipment}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.onSurfaceVariant} />
        </View>
      </TouchableOpacity>
    ),
    [navigation, theme]
  );

  type ListItem =
    | { type: 'header'; category: ExerciseCategory }
    | { type: 'exercise'; data: Exercise };

  const flatData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    grouped.forEach((g) => {
      items.push({ type: 'header', category: g.category });
      g.exercises.forEach((ex) => items.push({ type: 'exercise', data: ex }));
    });
    return items;
  }, [grouped]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => drawerNav.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text variant="titleLarge" style={styles.headerText}>Exercise Library</Text>
            <Text variant="bodySmall" style={styles.headerSub}>{EXERCISES.length} exercises</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder="Search exercises or muscles..."
          value={search}
          onChangeText={setSearch}
          style={[styles.searchbar, { elevation: 0, backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={{ fontSize: 14 }}
        />
      </View>

      {/* Category filter pills */}
      <View style={{ backgroundColor: theme.colors.surface }}>
        <FlatList
          horizontal
          data={[null, ...CATEGORY_ORDER] as (ExerciseCategory | null)[]}
          keyExtractor={(item) => item ?? 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <Chip
              selected={activeCategory === item}
              onPress={() => setActiveCategory(item === activeCategory ? null : item)}
              style={[styles.categoryChip, activeCategory === item && { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={{ fontSize: 12 }}
            >
              {item ? CATEGORY_LABELS[item] : 'All'}
            </Chip>
          )}
        />
      </View>

      <FlatList
        data={flatData}
        keyExtractor={(item) => (item.type === 'header' ? `h-${item.category}` : `e-${item.data.id}`)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.categoryHeader}>
                <Ionicons name={CATEGORY_ICONS[item.category]} size={18} color={theme.colors.primary} />
                <Text variant="titleSmall" style={[styles.categoryTitle, { color: theme.colors.primary }]}>
                  {CATEGORY_LABELS[item.category].toUpperCase()}
                </Text>
              </View>
            );
          }
          return renderExercise({ item: item.data });
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color={theme.colors.outlineVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  menuBtn: { padding: 4 },
  headerTitle: { flex: 1 },
  headerText: { color: '#fff', fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10, elevation: 2 },
  searchbar: { borderRadius: 12 },
  categoryList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  categoryChip: { borderRadius: 20 },
  listContent: { padding: 16, paddingTop: 8, gap: 8 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingTop: 16,
  },
  categoryTitle: { fontWeight: '700', letterSpacing: 0.8 },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  exerciseName: { flex: 1, fontWeight: '600', marginRight: 8 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  diffText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  equipmentRow: { flexDirection: 'row', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
});
