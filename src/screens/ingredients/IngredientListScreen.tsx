import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { FAB, Searchbar, List, IconButton, Text, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IngredientsStackParamList } from '@/navigation/types';
import { useIngredients } from '@/hooks/useIngredients';
import { Ingredient } from '@/db/schema';
import { calcKcal, roundMacro } from '@/utils/macroCalculations';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useDatabase } from '@/context/DatabaseContext';

type Props = NativeStackScreenProps<IngredientsStackParamList, 'IngredientList'>;

export default function IngredientListScreen({ navigation }: Props) {
  const { isReady } = useDatabase();
  const { ingredients, loading, load, remove } = useIngredients();
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (isReady) load();
    });
    return unsub;
  }, [navigation, isReady, load]);

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setDeleteError(null);
      await remove(deleteTarget.id);
    } catch (e) {
      const msg = String(e);
      if (msg.includes('FOREIGN KEY') || msg.includes('RESTRICT')) {
        setDeleteError(`"${deleteTarget.name}" is used in one or more recipes and cannot be deleted.`);
      } else {
        setDeleteError(msg);
      }
    }
  }, [deleteTarget, remove]);

  const kcalPer100g = (item: Ingredient) =>
    roundMacro(calcKcal({ ...item, carbs_total: item.carbs_total }), 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Searchbar
        placeholder="Search ingredients..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      {deleteError ? (
        <Text style={styles.errorBanner}>{deleteError}</Text>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <EmptyState
            icon="nutrition-outline"
            title="No ingredients yet"
            subtitle='Tap "+" to add your first ingredient'
          />
        }
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={`${kcalPer100g(item)} kcal · P: ${item.protein}g · C: ${item.carbs_total}g · F: ${item.fat_total}g (per 100g)`}
            right={() => (
              <View style={styles.actions}>
                <IconButton icon="pencil" size={20} onPress={() => navigation.navigate('IngredientForm', { ingredientId: item.id })} />
                <IconButton icon="delete" size={20} onPress={() => { setDeleteError(null); setDeleteTarget(item); }} />
              </View>
            )}
            onPress={() => navigation.navigate('IngredientForm', { ingredientId: item.id })}
          />
        )}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('IngredientForm', {})} />
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Ingredient"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onDismiss={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { margin: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  errorBanner: { color: '#E63946', paddingHorizontal: 16, paddingBottom: 8, fontSize: 13 },
});
