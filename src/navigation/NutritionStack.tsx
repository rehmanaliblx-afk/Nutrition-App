import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NutritionStackParamList } from './types';
import { MICRONUTRIENTS } from '@/constants/micronutrients';

import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import DailyLogScreen from '@/screens/tracking/DailyLogScreen';
import AddMealEntryScreen from '@/screens/tracking/AddMealEntryScreen';
import IngredientListScreen from '@/screens/ingredients/IngredientListScreen';
import IngredientFormScreen from '@/screens/ingredients/IngredientFormScreen';
import RecipeListScreen from '@/screens/recipes/RecipeListScreen';
import RecipeDetailScreen from '@/screens/recipes/RecipeDetailScreen';
import RecipeFormScreen from '@/screens/recipes/RecipeFormScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import HistoryScreen from '@/screens/history/HistoryScreen';
import BackupScreen from '@/screens/settings/BackupScreen';
import ManageMealsScreen from '@/screens/settings/ManageMealsScreen';
import MicronutrientsScreen from '@/screens/info/MicronutrientsScreen';
import MicronutrientDetailScreen from '@/screens/info/MicronutrientDetailScreen';
import SupplementsScreen from '@/screens/supplements/SupplementsScreen';
import SupplementFormScreen from '@/screens/supplements/SupplementFormScreen';
import SupplementDetailScreen from '@/screens/supplements/SupplementDetailScreen';

const Stack = createNativeStackNavigator<NutritionStackParamList>();

export default function NutritionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard', headerShown: false }} />
      <Stack.Screen name="DailyLog" component={DailyLogScreen} options={{ title: "Today's Log" }} />
      <Stack.Screen name="AddMealEntry" component={AddMealEntryScreen} options={{ title: 'Add Food' }} />
      <Stack.Screen name="IngredientList" component={IngredientListScreen} options={{ title: 'Ingredients' }} />
      <Stack.Screen name="IngredientForm" component={IngredientFormScreen} options={({ route }) => ({ title: route.params?.ingredientId ? 'Edit Ingredient' : 'New Ingredient' })} />
      <Stack.Screen name="RecipeList" component={RecipeListScreen} options={{ title: 'Recipes' }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Recipe Detail' }} />
      <Stack.Screen name="RecipeForm" component={RecipeFormScreen} options={({ route }) => ({ title: route.params?.recipeId ? 'Edit Recipe' : 'New Recipe' })} />
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'More' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History & Charts' }} />
      <Stack.Screen name="Backup" component={BackupScreen} options={{ title: 'Backup & Restore' }} />
      <Stack.Screen name="ManageMeals" component={ManageMealsScreen} options={{ title: 'Manage Meal Types' }} />
      <Stack.Screen name="Micronutrients" component={MicronutrientsScreen} options={{ title: 'Micronutrients' }} />
      <Stack.Screen
        name="MicronutrientDetail"
        component={MicronutrientDetailScreen}
        options={({ route }) => {
          const nutrient = MICRONUTRIENTS.find((n) => n.id === route.params.id);
          return { title: nutrient?.name ?? 'Detail' };
        }}
      />
      <Stack.Screen name="Supplements" component={SupplementsScreen} options={{ title: 'My Supplements' }} />
      <Stack.Screen
        name="SupplementForm"
        component={SupplementFormScreen}
        options={({ route }) => ({
          title: route.params?.supplementId !== undefined ? 'Edit Supplement' : 'Add Supplement',
        })}
      />
      <Stack.Screen name="SupplementDetail" component={SupplementDetailScreen} options={{ title: 'Supplement Detail' }} />
    </Stack.Navigator>
  );
}
