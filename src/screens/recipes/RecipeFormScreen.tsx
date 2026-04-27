import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Divider, IconButton, List, Searchbar, Modal, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecipesStackParamList } from '@/navigation/types';
import { useRecipes } from '@/hooks/useRecipes';
import { getRecipeById } from '@/db/recipesDao';
import { getAllIngredients, searchIngredients } from '@/db/ingredientsDao';
import { Ingredient } from '@/db/schema';
import { calcRecipeMacros, calcKcal, roundMacro } from '@/utils/macroCalculations';

type Props = NativeStackScreenProps<RecipesStackParamList, 'RecipeForm'>;

interface RowItem {
  ingredient: Ingredient;
  gramsStr: string;
}

export default function RecipeFormScreen({ route, navigation }: Props) {
  const { recipeId } = route.params ?? {};
  const { create, update, loadIngredients } = useRecipes();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<RowItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerResults, setPickerResults] = useState<Ingredient[]>([]);

  useEffect(() => {
    if (!recipeId) return;
    Promise.all([getRecipeById(recipeId), loadIngredients(recipeId)]).then(([r, riRows]) => {
      if (!r) return;
      setName(r.name);
      setDescription(r.description ?? '');
      getAllIngredients().then((allIngs) => {
        const rowItems: RowItem[] = riRows.map((ri) => {
          const ingredient = allIngs.find((i) => i.id === ri.ingredient_id)!;
          return { ingredient, gramsStr: String(ri.grams) };
        });
        setRows(rowItems);
      });
    });
  }, [recipeId, loadIngredients]);

  const openPicker = useCallback(async () => {
    setPickerQuery('');
    const all = await getAllIngredients();
    setPickerResults(all);
    setPickerVisible(true);
  }, []);

  const handlePickerSearch = useCallback(async (q: string) => {
    setPickerQuery(q);
    const results = q ? await searchIngredients(q) : await getAllIngredients();
    setPickerResults(results);
  }, []);

  const addIngredient = (ingredient: Ingredient) => {
    if (rows.find((r) => r.ingredient.id === ingredient.id)) {
      setPickerVisible(false);
      return;
    }
    setRows((prev) => [...prev, { ingredient, gramsStr: '' }]);
    setPickerVisible(false);
  };

  const updateGrams = (idx: number, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, gramsStr: value } : r)));
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Recipe name is required.');
      return;
    }
    if (rows.length === 0) {
      Alert.alert('Validation', 'Add at least one ingredient.');
      return;
    }
    const ingredients = rows.map((r) => {
      const grams = parseFloat(r.gramsStr);
      return { ingredient_id: r.ingredient.id, grams: isNaN(grams) || grams <= 0 ? 0 : grams };
    });
    if (ingredients.some((i) => i.grams === 0)) {
      Alert.alert('Validation', 'All ingredients must have a valid grams value greater than 0.');
      return;
    }
    setSaving(true);
    try {
      const input = { name: name.trim(), description: description.trim() || null };
      if (recipeId) {
        await update(recipeId, input, ingredients);
      } else {
        await create(input, ingredients);
      }
      navigation.goBack();
    } catch (e) {
      const msg = String(e);
      if (msg.includes('UNIQUE')) {
        Alert.alert('Error', `A recipe named "${name.trim()}" already exists.`);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const totalMacros = calcRecipeMacros(
    rows
      .filter((r) => parseFloat(r.gramsStr) > 0)
      .map((r) => ({
        grams: parseFloat(r.gramsStr),
        ingredient_macros: { ...r.ingredient },
      }))
  );
  const totalKcal = roundMacro(calcKcal(totalMacros), 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput label="Recipe Name" value={name} onChangeText={setName} mode="outlined" />
        <TextInput label="Description (optional)" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={2} />

        <Divider style={styles.divider} />
        <View style={styles.row}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Ingredients</Text>
          <Button icon="plus" mode="text" onPress={openPicker}>Add</Button>
        </View>

        {rows.map((row, idx) => (
          <View key={row.ingredient.id} style={styles.ingredientRow}>
            <Text style={styles.ingName} numberOfLines={1}>{row.ingredient.name}</Text>
            <TextInput
              label="grams"
              value={row.gramsStr}
              onChangeText={(v) => updateGrams(idx, v)}
              keyboardType="decimal-pad"
              mode="outlined"
              dense
              style={styles.gramsInput}
            />
            <IconButton icon="close" size={18} onPress={() => removeRow(idx)} />
          </View>
        ))}

        {rows.length > 0 && (
          <View style={styles.previewRow}>
            <Text variant="bodyMedium" style={styles.previewText}>
              Recipe total: <Text style={styles.previewKcal}>{totalKcal} kcal</Text>
              {' '}· P: {roundMacro(totalMacros.protein)}g · C: {roundMacro(totalMacros.carbs_total)}g · F: {roundMacro(totalMacros.fat_total)}g
            </Text>
          </View>
        )}

        <Button mode="contained" onPress={handleSave} loading={saving} style={styles.saveBtn} icon="content-save">
          {recipeId ? 'Update Recipe' : 'Save Recipe'}
        </Button>
      </ScrollView>

      <Portal>
        <Modal visible={pickerVisible} onDismiss={() => setPickerVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium" style={styles.modalTitle}>Pick an Ingredient</Text>
          <Searchbar
            placeholder="Search..."
            value={pickerQuery}
            onChangeText={handlePickerSearch}
            style={styles.modalSearch}
            autoFocus
          />
          <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
            {pickerResults.map((ing) => (
              <List.Item
                key={ing.id}
                title={ing.name}
                description={`P: ${ing.protein}g · C: ${ing.carbs_total}g · F: ${ing.fat_total}g (per 100g)`}
                onPress={() => addIngredient(ing)}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  divider: { marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: '600' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ingName: { flex: 1, fontSize: 14 },
  gramsInput: { width: 90 },
  previewRow: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: 10 },
  previewText: { opacity: 0.8 },
  previewKcal: { fontWeight: 'bold' },
  saveBtn: { marginTop: 16 },
  modal: { backgroundColor: 'white', margin: 20, borderRadius: 12, maxHeight: '75%', overflow: 'hidden' },
  modalTitle: { padding: 16, fontWeight: 'bold' },
  modalSearch: { marginHorizontal: 12, marginBottom: 8 },
  modalList: { flex: 1 },
});
