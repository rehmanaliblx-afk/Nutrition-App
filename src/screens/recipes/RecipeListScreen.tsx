import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { FAB, Searchbar, List, IconButton, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecipesStackParamList } from '@/navigation/types';
import { useRecipes } from '@/hooks/useRecipes';
import { Recipe } from '@/db/schema';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useDatabase } from '@/context/DatabaseContext';

type Props = NativeStackScreenProps<RecipesStackParamList, 'RecipeList'>;

export default function RecipeListScreen({ navigation }: Props) {
  const { isReady } = useDatabase();
  const { recipes, loading, load, remove } = useRecipes();
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (isReady) load();
    });
    return unsub;
  }, [navigation, isReady, load]);

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Searchbar
        placeholder="Search recipes..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      <FlatList
        data={filtered}
        keyExtractor={(r) => String(r.id)}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <EmptyState
            icon="restaurant-outline"
            title="No recipes yet"
            subtitle='Tap "+" to create your first recipe'
          />
        }
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={item.description ?? undefined}
            right={() => (
              <View style={styles.actions}>
                <IconButton icon="pencil" size={20} onPress={() => navigation.navigate('RecipeForm', { recipeId: item.id })} />
                <IconButton icon="delete" size={20} onPress={() => setDeleteTarget(item)} />
              </View>
            )}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
          />
        )}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('RecipeForm', {})} />
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Recipe"
        message={`Delete "${deleteTarget?.name}"?`}
        onConfirm={async () => { if (deleteTarget) await remove(deleteTarget.id); }}
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
});
