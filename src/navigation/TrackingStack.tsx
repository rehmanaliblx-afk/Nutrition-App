import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TrackingStackParamList } from './types';
import DailyLogScreen from '@/screens/tracking/DailyLogScreen';
import AddMealEntryScreen from '@/screens/tracking/AddMealEntryScreen';
import WeightLogScreen from '@/screens/tracking/WeightLogScreen';

const Stack = createNativeStackNavigator<TrackingStackParamList>();

export default function TrackingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DailyLog" component={DailyLogScreen} options={{ title: "Today's Log" }} />
      <Stack.Screen name="AddMealEntry" component={AddMealEntryScreen} options={{ title: 'Add Food' }} />
      <Stack.Screen name="WeightLog" component={WeightLogScreen} options={{ title: 'Weight Log' }} />
    </Stack.Navigator>
  );
}
