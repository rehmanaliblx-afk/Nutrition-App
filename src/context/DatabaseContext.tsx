import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { openDatabase } from '@/db/database';

interface DatabaseContextValue {
  isReady: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({ isReady: false, error: null });

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openDatabase()
      .then(() => setIsReady(true))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>DB Error: {error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}
