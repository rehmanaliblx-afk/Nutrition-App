import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, Searchbar, List, Modal, Portal, Divider, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrackingStackParamList } from '@/navigation/types';
import { useDailyLog } from '@/hooks/useDailyLog';
import { getAllIngredients, getIngredientById } from '@/db/ingredientsDao';
import { getAllRecipes, getRecipeById } from '@/db/recipesDao';
import { getRecentFoods, addMealEntry } from '@/db/trackingDao';
import { getAllTemplates, getTemplateById, MealTemplate } from '@/db/mealTemplatesDao';
import { Ingredient, Recipe } from '@/db/schema';
import { MealType, FoodType } from '@/constants/macros';
import { roundMacro } from '@/utils/macroCalculations';
import { useDatabase } from '@/context/DatabaseContext';
import { useMealSlots } from '@/hooks/useMealSlots';
import { todayString } from '@/utils/dateUtils';

type Props = NativeStackScreenProps<TrackingStackParamList, 'AddMealEntry'>;

type FoodItem = { type: FoodType; item: Ingredient | Recipe };
type PickerTab = 'recent' | 'all' | 'templates';

export default function AddMealEntryScreen({ route, navigation }: Props) {
  const { date, mealType: initialMealType } = route.params;
  const { addEntry } = useDailyLog();
  const { isReady } = useDatabase();
  const { slots, load: loadSlots } = useMealSlots();

  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [gramsStr, setGramsStr] = useState('');
  const [saving, setSaving] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerTab, setPickerTab] = useState<PickerTab>('recent');

  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    loadSlots();
    Promise.all([getAllIngredients(), getAllRecipes(), getAllTemplates()])
      .then(([ings, recs, tmps]) => {
        setAllIngredients(ings);
        setAllRecipes(recs);
        setFilteredIngredients(ings);
        setFilteredRecipes(recs);
        setTemplates(tmps);
      })
      .catch((e) => console.warn('Failed to load food items:', e));

    getRecentFoods(12).then(async (recent) => {
      const resolved = await Promise.all(
        recent.map(async ({ food_type, food_id }) => {
          if (food_type === 'ingredient') {
            const item = await getIngredientById(food_id);
            return item ? ({ type: 'ingredient' as FoodType, item } as FoodItem) : null;
          } else {
            const item = await getRecipeById(food_id);
            return item ? ({ type: 'recipe' as FoodType, item } as FoodItem) : null;
          }
        })
      );
      setRecentFoods(resolved.filter((x): x is FoodItem => x !== null));
    }).catch(() => {});
  }, [isReady]);

  const openPicker = useCallback(() => {
    setPickerQuery('');
    setFilteredIngredients(allIngredients);
    setFilteredRecipes(allRecipes);
    setPickerTab(recentFoods.length > 0 ? 'recent' : 'all');
    setPickerVisible(true);
  }, [allIngredients, allRecipes, recentFoods.length]);

  const handleSearch = useCallback((q: string) => {
    setPickerQuery(q);
    setPickerTab('all');
    if (!q.trim()) {
      setFilteredIngredients(allIngredients);
      setFilteredRecipes(allRecipes);
    } else {
      const lower = q.toLowerCase();
      setFilteredIngredients(allIngredients.filter((i) => i.name.toLowerCase().includes(lower)));
      setFilteredRecipes(allRecipes.filter((r) => r.name.toLowerCase().includes(lower)));
    }
  }, [allIngredients, allRecipes]);

  const selectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setPickerVisible(false);
  };

  const handleApplyTemplate = async (template: MealTemplate) => {
    setApplyingTemplate(true);
    setPickerVisible(false);
    try {
      const full = await getTemplateById(template.id);
      if (!full || full.entries.length === 0) {
        Alert.alert('Empty Template', 'This template has no entries.');
        return;
      }
      for (const entry of full.entries) {
        await addMealEntry({
          date,
          meal_type: entry.mealType,
          food_type: entry.foodType as FoodType,
          food_id: entry.foodId,
          grams: entry.grams,
        });
      }
      Alert.alert('Applied', `${full.entries.length} items added from template "${template.name}".`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setApplyingTemplate(false);
    }
  };

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
      {applyingTemplate && (
        <View style={styles.applyingOverlay}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12 }}>Applying template…</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="titleMedium" style={styles.label}>Meal</Text>
        <View style={styles.chipRow}>
          {slots.map((slot) => (
            <Chip key={slot.name} selected={mealType === slot.name} onPress={() => setMealType(slot.name)} mode="outlined" style={styles.chip}>
              {slot.emoji} {slot.display_name}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />
        <Text variant="titleMedium" style={styles.label}>Food</Text>
        <Button mode="outlined" icon="magnify" onPress={openPicker} style={styles.pickBtn}>
          {selectedFood ? selectedFood.item.name : 'Pick Ingredient, Recipe or Template'}
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

        <Button mode="contained" onPress={handleSave} loading={saving} style={styles.saveBtn} icon="plus-circle" disabled={!selectedFood}>
          Add to Log
        </Button>
      </ScrollView>

      <Portal>
        <Modal visible={pickerVisible} onDismiss={() => setPickerVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium" style={styles.modalTitle}>Select Food</Text>
          <Searchbar
            placeholder="Search ingredients or recipes..."
            value={pickerQuery}
            onChangeText={handleSearch}
            style={styles.modalSearch}
          />
          <View style={styles.tabRow}>
            {recentFoods.length > 0 && (
              <Chip selected={pickerTab === 'recent'} onPress={() => setPickerTab('recent')} compact style={styles.tabChip}>
                Recent
              </Chip>
            )}
            <Chip selected={pickerTab === 'all'} onPress={() => setPickerTab('all')} compact style={styles.tabChip}>
              All Foods
            </Chip>
            {templates.length > 0 && (
              <Chip selected={pickerTab === 'templates'} onPress={() => setPickerTab('templates')} compact style={styles.tabChip}>
                Templates
              </Chip>
            )}
          </View>

          <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
            {pickerTab === 'recent' && recentFoods.map((f) => (
              <List.Item
                key={`recent-${f.type}-${f.item.id}`}
                title={f.item.name}
                description={f.type === 'ingredient' ? 'Ingredient' : 'Recipe'}
                left={(p) => <List.Icon {...p} icon={f.type === 'ingredient' ? 'nutrition' : 'restaurant'} />}
                onPress={() => selectFood(f)}
              />
            ))}

            {pickerTab === 'all' && (
              <>
                {filteredIngredients.length > 0 && (
                  <>
                    <List.Subheader>Ingredients</List.Subheader>
                    {filteredIngredients.map((ing) => (
                      <List.Item
                        key={`ing-${ing.id}`}
                        title={ing.name}
                        description={`P: ${roundMacro(ing.protein * 100)}g · C: ${roundMacro(ing.carbs_total * 100)}g · F: ${roundMacro(ing.fat_total * 100)}g (per 100g)`}
                        left={(p) => <List.Icon {...p} icon="nutrition" />}
                        onPress={() => selectFood({ type: 'ingredient', item: ing })}
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
                        onPress={() => selectFood({ type: 'recipe', item: rec })}
                      />
                    ))}
                  </>
                )}
                {filteredIngredients.length === 0 && filteredRecipes.length === 0 && (
                  <Text style={styles.noResults}>
                    {allIngredients.length === 0 && allRecipes.length === 0 ? 'No ingredients or recipes saved yet' : 'No results found'}
                  </Text>
                )}
              </>
            )}

            {pickerTab === 'templates' && (
              <>
                <List.Subheader>Meal Templates (applies all entries)</List.Subheader>
                {templates.map((t) => (
                  <List.Item
                    key={`tmpl-${t.id}`}
                    title={t.name}
                    description={t.description ?? 'Tap to apply all entries to today\'s log'}
                    left={(p) => <List.Icon {...p} icon="calendar-check" />}
                    onPress={() => handleApplyTemplate(t)}
                  />
                ))}
                {templates.length === 0 && (
                  <Text style={styles.noResults}>No templates yet. Create one in Meal Templates.</Text>
                )}
              </>
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
  applyingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  modal: { backgroundColor: 'white', margin: 20, borderRadius: 12, maxHeight: '85%', overflow: 'hidden' },
  modalTitle: { padding: 16, fontWeight: 'bold' },
  modalSearch: { marginHorizontal: 12, marginBottom: 4 },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  tabChip: {},
  modalList: { flex: 1 },
  noResults: { textAlign: 'center', padding: 24, opacity: 0.5 },
});
