import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '@/context/DatabaseContext';
import RootNavigator from '@/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider>
        <RootNavigator />
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
