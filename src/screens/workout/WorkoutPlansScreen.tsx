import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { WorkoutStackParamList } from '@/navigation/types';
import { useWorkoutPlans } from '@/hooks/useWorkoutPlans';
import { WorkoutPlan } from '@/db/workoutDao';
import { useDatabase } from '@/context/DatabaseContext';
import { EXERCISES } from '@/constants/exercises';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutPlans'>;

export default function WorkoutPlansScreen({ navigation }: Props) {
  const theme = useTheme();
  const drawerNav = useNavigation();
  const { isReady } = useDatabase();
  const { plans, loading, load, remove } = useWorkoutPlans();

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (isReady) load();
    });
    return unsub;
  }, [navigation, isReady, load]);

  const handleDelete = useCallback(
    (plan: WorkoutPlan) => {
      Alert.alert('Delete Plan', `Delete "${plan.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(plan.id) },
      ]);
    },
    [remove]
  );

  const renderPlan = useCallback(
    ({ item }: { item: WorkoutPlan }) => (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
        onPress={() => navigation.navigate('WorkoutPlanDetail', { planId: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.cardContent}>
          <View style={[styles.planIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="list" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.planInfo}>
            <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
              {item.name}
            </Text>
            {item.description ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('WorkoutPlanForm', { planId: item.id })}
              style={styles.actionBtn}
            >
              <Ionicons name="pencil" size={18} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color="#E53935" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation, theme, handleDelete]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => drawerNav.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={{ color: '#fff', fontWeight: '700' }}>Workout Plans</Text>
            <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={plans}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={renderPlan}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="list" size={56} color={theme.colors.outlineVariant} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No workout plans yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              Tap + to create your first plan
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('WorkoutPlanForm', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  menuBtn: { padding: 4 },
  listContent: { padding: 16, paddingBottom: 100, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  planIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planInfo: { flex: 1 },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 32 },
  fab: { position: 'absolute', right: 20, bottom: 28, borderRadius: 16 },
});
