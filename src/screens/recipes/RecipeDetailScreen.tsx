import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider, List, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecipesStackParamList } from '@/navigation/types';
import { useRecipes } from '@/hooks/useRecipes';
import { getRecipeById } from '@/db/recipesDao';
import { RecipeIngredientWithDetails, Recipe } from '@/db/schema';
import MacroGrid from '@/components/common/MacroGrid';
import { calcRecipeMacros, scaleIngredientMacros, roundMacro, calcKcal } from '@/utils/macroCalculations';

type Props = NativeStackScreenProps<RecipesStackParamList, 'RecipeDetail'>;

export default function RecipeDetailScreen({ route, navigation }: Props) {
  const { recipeId } = route.params;
  const { loadIngredients } = useRecipes();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [riRows, setRiRows] = useState<RecipeIngredientWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, rows] = await Promise.all([getRecipeById(recipeId), loadIngredients(recipeId)]);
    setRecipe(r);
    setRiRows(rows);
    setLoading(false);
  }, [recipeId, loadIngredients]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  if (loading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  const macroInputList = riRows.map((ri) => ({
    grams: ri.grams,
    ingredient_macros: {
      carbs_total: ri.carbs_total, carbs_sugar: ri.carbs_sugar,
      carbs_complex: ri.carbs_complex, carbs_fiber: ri.carbs_fiber,
      protein: ri.protein, fat_total: ri.fat_total,
      fat_unsaturated: ri.fat_unsaturated, fat_mono_poly: ri.fat_mono_poly, fat_trans: ri.fat_trans,
    },
  }));
  const totalMacros = calcRecipeMacros(macroInputList);
  const totalGrams = riRows.reduce((s, r) => s + r.grams, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>{recipe?.name}</Text>
        {recipe?.description ? (
          <Text variant="bodyMedium" style={styles.desc}>{recipe.description}</Text>
        ) : null}

        <MacroGrid macros={totalMacros} label={`Totals for ${roundMacro(totalGrams, 0)}g recipe`} />

        <Divider style={styles.divider} />
        <Text variant="titleMedium" style={styles.sectionTitle}>Ingredients</Text>
        {riRows.map((ri) => {
          const ingMacros = scaleIngredientMacros({
            carbs_total: ri.carbs_total, carbs_sugar: ri.carbs_sugar,
            carbs_complex: ri.carbs_complex, carbs_fiber: ri.carbs_fiber,
            protein: ri.protein, fat_total: ri.fat_total,
            fat_unsaturated: ri.fat_unsaturated, fat_mono_poly: ri.fat_mono_poly, fat_trans: ri.fat_trans,
          }, ri.grams);
          return (
            <List.Item
              key={ri.id}
              title={`${ri.ingredient_name} — ${ri.grams}g`}
              description={`${roundMacro(calcKcal(ingMacros), 0)} kcal · P: ${roundMacro(ingMacros.protein)}g · C: ${roundMacro(ingMacros.carbs_total)}g · F: ${roundMacro(ingMacros.fat_total)}g`}
            />
          );
        })}

        <View style={styles.btnRow}>
          <Button mode="outlined" icon="pencil" onPress={() => navigation.navigate('RecipeForm', { recipeId })}>
            Edit Recipe
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  loading: { flex: 1 },
  title: { fontWeight: 'bold' },
  desc: { opacity: 0.6, marginBottom: 8 },
  divider: { marginVertical: 12 },
  sectionTitle: { fontWeight: '600', marginBottom: 4 },
  btnRow: { marginTop: 16, gap: 8 },
});
