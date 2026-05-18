import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from './types';

import ExerciseLibraryScreen from '@/screens/workout/ExerciseLibraryScreen';
import ExerciseDetailScreen from '@/screens/workout/ExerciseDetailScreen';
import WorkoutPlansScreen from '@/screens/workout/WorkoutPlansScreen';
import WorkoutPlanDetailScreen from '@/screens/workout/WorkoutPlanDetailScreen';
import WorkoutPlanFormScreen from '@/screens/workout/WorkoutPlanFormScreen';
import WeightLogScreen from '@/screens/tracking/WeightLogScreen';
import WorkoutSessionScreen from '@/screens/workout/WorkoutSessionScreen';
import WorkoutHistoryScreen from '@/screens/workout/WorkoutHistoryScreen';
import ExerciseProgressScreen from '@/screens/workout/ExerciseProgressScreen';
import WorkoutGeneratorScreen from '@/screens/workout/WorkoutGeneratorScreen';
import OneRMCalculatorScreen from '@/screens/workout/OneRMCalculatorScreen';
import RecoveryInsightsScreen from '@/screens/workout/RecoveryInsightsScreen';

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} options={{ title: 'Exercise Library', headerShown: false }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Exercise Detail' }} />
      <Stack.Screen name="WorkoutPlans" component={WorkoutPlansScreen} options={{ title: 'Workout Plans', headerShown: false }} />
      <Stack.Screen name="WorkoutPlanDetail" component={WorkoutPlanDetailScreen} options={{ title: 'Plan Detail' }} />
      <Stack.Screen name="WorkoutPlanForm" component={WorkoutPlanFormScreen} options={({ route }) => ({ title: route.params?.planId ? 'Edit Plan' : 'New Plan' })} />
      <Stack.Screen name="WeightLog" component={WeightLogScreen} options={{ title: 'Weight Log', headerShown: false }} />
      <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ title: 'Workout History' }} />
      <Stack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} options={({ route }) => ({ title: route.params.exerciseName })} />
      <Stack.Screen name="WorkoutGenerator" component={WorkoutGeneratorScreen} options={{ title: 'Workout Generator' }} />
      <Stack.Screen name="OneRMCalculator" component={OneRMCalculatorScreen} options={{ title: '1RM Calculator' }} />
      <Stack.Screen name="RecoveryInsights" component={RecoveryInsightsScreen} options={{ title: 'Recovery Insights' }} />
    </Stack.Navigator>
  );
}
