import 'react-native-gesture-handler';
import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { lightTheme, darkTheme } from '@/constants/theme';
import { RootTabParamList } from './types';
import IngredientsStack from './IngredientsStack';
import RecipesStack from './RecipesStack';
import TrackingStack from './TrackingStack';
import MoreStack from './MoreStack';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof RootTabParamList, { focused: IoniconsName; unfocused: IoniconsName }> = {
  Dashboard: { focused: 'home', unfocused: 'home-outline' },
  Log: { focused: 'journal', unfocused: 'journal-outline' },
  Ingredients: { focused: 'nutrition', unfocused: 'nutrition-outline' },
  Recipes: { focused: 'restaurant', unfocused: 'restaurant-outline' },
  More: { focused: 'ellipsis-horizontal-circle', unfocused: 'ellipsis-horizontal-circle-outline' },
};

export default function RootNavigator() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              const icons = TAB_ICONS[route.name as keyof RootTabParamList];
              const name = focused ? icons.focused : icons.unfocused;
              return <Ionicons name={name} size={size} color={color} />;
            },
            tabBarActiveTintColor: theme.colors.primary,
            headerShown: false,
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
          <Tab.Screen name="Log" component={TrackingStack} options={{ title: 'Log' }} />
          <Tab.Screen name="Ingredients" component={IngredientsStack} options={{ title: 'Ingredients' }} />
          <Tab.Screen name="Recipes" component={RecipesStack} options={{ title: 'Recipes' }} />
          <Tab.Screen name="More" component={MoreStack} options={{ title: 'More' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
