import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, Searchbar, List, Modal, Portal, Divider, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrackingStackParamList } from '@/navigation/types';
import { useDailyLog } from '@/hooks/useDailyLog';
import { getAllIngredients } from '@/db/ingredientsDao';
import { getAllRecipes } from '@/db/recipesDao';
import { Ingredient, Recipe } from '@/db/schema';
import { MealType, MEAL_TYPES, MEAL_LABELS, FoodType } from '@/constants/macros';
import { roundMacro } from '@/utils/macroCalculations';
import { useDatabase } from '@/context/DatabaseContext';

type Props = NativeStackScreenProps<TrackingStackParamList, 'AddMealEntry'>;

type FoodItem = { type: FoodType; item: Ingredient | Recipe };

export default function AddMealEntryScreen({ route, navigation }: Props) {
  const { date, mealType: initialMealType } = route.params;
  const { addEntry } = useDailyLog();
  const { isReady } = useDatabase();

  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [gramsStr, setGramsStr] = useState('');
  const [saving, setSaving] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  // Load all food items on mount
  useEffect(() => {
    if (!isReady) return;
    Promise.all([getAllIngredients(), getAllRecipes()])
      .then(([ings, recs]) => {
        setAllIngredients(ings);
        setAllRecipes(recs);
        setFilteredIngredients(ings);
        setFilteredRecipes(recs);
      })
      .catch((e) => console.warn('Failed to load food items:', e));
  }, [isReady]);

  const openPicker = useCallback(() => {
    setPickerQuery('');
    setFilteredIngredients(allIngredients);
    setFilteredRecipes(allRecipes);
    setPickerVisible(true);
  }, [allIngredients, allRecipes]);

  const handleSearch = useCallback((q: string) => {
    setPickerQuery(q);
    if (!q.trim()) {
      setFilteredIngredients(allIngredients);
      setFilteredRecipes(allRecipes);
    } else {
      const lower = q.toLowerCase();
      setFilteredIngredients(allIngredients.filter((i) => i.name.toLowerCase().includes(lower)));
      setFilteredRecipes(allRecipes.filter((r) => r.name.toLowerCase().includes(lower)));
    }
  }, [allIngredients, allRecipes]);

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
            onChangeText={handleSearch}
            style={styles.modalSearch}
          />
          <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
            {filteredIngredients.length > 0 && (
              <>
                <List.Subheader>Ingredients</List.Subheader>
                {filteredIngredients.map((ing) => (
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
            {filteredRecipes.length > 0 && (
              <>
                <List.Subheader>Recipes</List.Subheader>
                {filteredRecipes.map((rec) => (
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
            {filteredIngredients.length === 0 && filteredRecipes.length === 0 && (
              <Text style={styles.noResults}>
                {allIngredients.length === 0 && allRecipes.length === 0
                  ? 'No ingredients or recipes saved yet'
                  : 'No results found'}
              </Text>
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
