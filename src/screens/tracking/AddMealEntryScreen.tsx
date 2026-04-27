import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, Searchbar, List, Modal, Portal, Divider, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrackingStackParamList } from '@/navigation/types';
import { useDailyLog } from '@/hooks/useDailyLog';
import { getAllIngredients, searchIngredients } from '@/db/ingredientsDao';
import { getAllRecipes, searchRecipes } from '@/db/recipesDao';
import { Ingredient, Recipe } from '@/db/schema';
import { MealType, MEAL_TYPES, MEAL_LABELS, FoodType } from '@/constants/macros';
import { roundMacro } from '@/utils/macroCalculations';

type Props = NativeStackScreenProps<TrackingStackParamList, 'AddMealEntry'>;

type FoodItem = { type: FoodType; item: Ingredient | Recipe };

export default function AddMealEntryScreen({ route, navigation }: Props) {
  const { date, mealType: initialMealType } = route.params;
  const { addEntry } = useDailyLog();

  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [gramsStr, setGramsStr] = useState('');
  const [saving, setSaving] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const loadPicker = useCallback(async (q: string) => {
    const [ings, recs] = await Promise.all([
      q ? searchIngredients(q) : getAllIngredients(),
      q ? searchRecipes(q) : getAllRecipes(),
    ]);
    setIngredients(ings);
    setRecipes(recs);
  }, []);

  const openPicker = useCallback(async () => {
    setPickerQuery('');
    await loadPicker('');
    setPickerVisible(true);
  }, [loadPicker]);

  const handleSave = async () => {
    if (!selectedFood) {
      Alert.alert('Required', 'Please select a food item.');
      return;
    }
    const grams = parseFloat(gramsStr);
    if (isNaN(grams) || grams <= 0) {
      Alert.alert('Required', 'Please enter a valid amount in grams.');
      return;
    }
    setSaving(true);
    try {
      await addEntry(
        { date, meal_type: mealType, food_type: selectedFood.type, food_id: selectedFood.item.id, grams },
        date
      );
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="titleMedium" style={styles.label}>Meal</Text>
        <View style={styles.chipRow}>
          {MEAL_TYPES.map((mt) => (
            <Chip
              key={mt}
              selected={mealType === mt}
              onPress={() => setMealType(mt)}
              mode="outlined"
              style={styles.chip}
            >
              {MEAL_LABELS[mt]}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />
        <Text variant="titleMedium" style={styles.label}>Food</Text>
        <Button mode="outlined" icon="magnify" onPress={openPicker} style={styles.pickBtn}>
          {selectedFood ? selectedFood.item.name : 'Pick Ingredient or Recipe'}
        </Button>

        {selectedFood && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.label}>Amount</Text>
            <TextInput
              label="Grams consumed"
              value={gramsStr}
              onChangeText={setGramsStr}
              keyboardType="decimal-pad"
              mode="outlined"
              autoFocus
              right={<TextInput.Affix text="g" />}
            />
          </>
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
          icon="plus-circle"
          disabled={!selectedFood}
        >
          Add to Log
        </Button>
      </ScrollView>

      <Portal>
        <Modal visible={pickerVisible} onDismiss={() => setPickerVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium" style={styles.modalTitle}>Select Food</Text>
          <Searchbar
            placeholder="Search..."
            value={pickerQuery}
            onChangeText={(q) => { setPickerQuery(q); loadPicker(q); }}
            style={styles.modalSearch}
            autoFocus
          />
          <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
            {ingredients.length > 0 && (
              <>
                <List.Subheader>Ingredients</List.Subheader>
                {ingredients.map((ing) => (
                  <List.Item
                    key={`ing-${ing.id}`}
                    title={ing.name}
                    description={`P: ${roundMacro(ing.protein * 100)}g · C: ${roundMacro(ing.carbs_total * 100)}g · F: ${roundMacro(ing.fat_total * 100)}g (per 100g)`}
                    left={(p) => <List.Icon {...p} icon="nutrition" />}
                    onPress={() => { setSelectedFood({ type: 'ingredient', item: ing }); setPickerVisible(false); }}
                  />
                ))}
              </>
            )}
            {recipes.length > 0 && (
              <>
                <List.Subheader>Recipes</List.Subheader>
                {recipes.map((rec) => (
                  <List.Item
                    key={`rec-${rec.id}`}
                    title={rec.name}
                    description={rec.description ?? undefined}
                    left={(p) => <List.Icon {...p} icon="restaurant" />}
                    onPress={() => { setSelectedFood({ type: 'recipe', item: rec }); setPickerVisible(false); }}
                  />
                ))}
              </>
            )}
            {ingredients.length === 0 && recipes.length === 0 && (
              <Text style={styles.noResults}>No results found</Text>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  label: { fontWeight: '600', marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {},
  divider: { marginVertical: 8 },
  pickBtn: { marginBottom: 4 },
  saveBtn: { marginTop: 16 },
  modal: { backgroundColor: 'white', margin: 20, borderRadius: 12, maxHeight: '80%', overflow: 'hidden' },
  modalTitle: { padding: 16, fontWeight: 'bold' },
  modalSearch: { marginHorizontal: 12, marginBottom: 4 },
  modalList: { flex: 1 },
  noResults: { textAlign: 'center', padding: 24, opacity: 0.5 },
});
