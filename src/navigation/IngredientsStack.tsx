import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IngredientsStackParamList } from './types';
import IngredientListScreen from '@/screens/ingredients/IngredientListScreen';
import IngredientFormScreen from '@/screens/ingredients/IngredientFormScreen';

const Stack = createNativeStackNavigator<IngredientsStackParamList>();

export default function IngredientsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="IngredientList" component={IngredientListScreen} options={{ title: 'Ingredients' }} />
      <Stack.Screen name="IngredientForm" component={IngredientFormScreen} options={({ route }) => ({ title: route.params?.ingredientId ? 'Edit Ingredient' : 'New Ingredient' })} />
    </Stack.Navigator>
  );
}
