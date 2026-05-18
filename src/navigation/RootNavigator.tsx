import 'react-native-gesture-handler';
import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { PaperProvider } from 'react-native-paper';

import { lightTheme, darkTheme } from '@/constants/theme';
import { RootDrawerParamList } from './types';
import NutritionStack from './NutritionStack';
import WorkoutStack from './WorkoutStack';
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator<RootDrawerParamList>();

export default function RootNavigator() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerType: 'slide',
            drawerStyle: { width: 280 },
            overlayColor: 'rgba(0,0,0,0.4)',
            swipeEdgeWidth: 50,
          }}
        >
          <Drawer.Screen name="Nutrition" component={NutritionStack} />
          <Drawer.Screen name="Workout" component={WorkoutStack} />
        </Drawer.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
