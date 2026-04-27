import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RecipesStackParamList } from './types';
import RecipeListScreen from '@/screens/recipes/RecipeListScreen';
import RecipeDetailScreen from '@/screens/recipes/RecipeDetailScreen';
import RecipeFormScreen from '@/screens/recipes/RecipeFormScreen';

const Stack = createNativeStackNavigator<RecipesStackParamList>();

export default function RecipesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="RecipeList" component={RecipeListScreen} options={{ title: 'Recipes' }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Recipe Detail' }} />
      <Stack.Screen name="RecipeForm" component={RecipeFormScreen} options={({ route }) => ({ title: route.params?.recipeId ? 'Edit Recipe' : 'New Recipe' })} />
    </Stack.Navigator>
  );
}
