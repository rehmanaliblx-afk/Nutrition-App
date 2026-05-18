import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './types';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import HistoryScreen from '@/screens/history/HistoryScreen';
import WeightLogScreen from '@/screens/tracking/WeightLogScreen';
import BackupScreen from '@/screens/settings/BackupScreen';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'More' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History & Charts' }} />
      <Stack.Screen name="WeightLog" component={WeightLogScreen} options={{ title: 'Weight Log' }} />
      <Stack.Screen name="Backup" component={BackupScreen} options={{ title: 'Backup & Restore' }} />
    </Stack.Navigator>
  );
}
