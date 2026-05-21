import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '@/context/DatabaseContext';
import RootNavigator from '@/navigation/RootNavigator';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message + '\n' + error.stack };
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
            App Crash — Error:
          </Text>
          <Text style={{ color: '#333', fontSize: 12, fontFamily: 'monospace' }}>
            {this.state.error}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DatabaseProvider>
          <RootNavigator />
        </DatabaseProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
