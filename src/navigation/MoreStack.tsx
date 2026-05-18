import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './types';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import HistoryScreen from '@/screens/history/HistoryScreen';
import WeightLogScreen from '@/screens/tracking/WeightLogScreen';
import BackupScreen from '@/screens/settings/BackupScreen';
import ManageMealsScreen from '@/screens/settings/ManageMealsScreen';
import MicronutrientsScreen from '@/screens/info/MicronutrientsScreen';
import MicronutrientDetailScreen from '@/screens/info/MicronutrientDetailScreen';
import SupplementsScreen from '@/screens/supplements/SupplementsScreen';
import SupplementFormScreen from '@/screens/supplements/SupplementFormScreen';
import SupplementDetailScreen from '@/screens/supplements/SupplementDetailScreen';
import { MICRONUTRIENTS } from '@/constants/micronutrients';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'More' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History & Charts' }} />
      <Stack.Screen name="WeightLog" component={WeightLogScreen} options={{ title: 'Weight Log' }} />
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
      <Stack.Screen
        name="SupplementDetail"
        component={SupplementDetailScreen}
        options={{ title: 'Supplement Detail' }}
      />
    </Stack.Navigator>
  );
}
