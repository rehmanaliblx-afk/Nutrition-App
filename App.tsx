import 'react-native-gesture-handler';
import React from 'react';
import { DatabaseProvider } from '@/context/DatabaseContext';
import RootNavigator from '@/navigation/RootNavigator';

export default function App() {
  return (
    <DatabaseProvider>
      <RootNavigator />
    </DatabaseProvider>
  );
}
