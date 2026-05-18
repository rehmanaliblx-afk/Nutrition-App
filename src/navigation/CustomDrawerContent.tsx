import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Divider, useTheme } from 'react-native-paper';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';

type NavItem = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  stack: 'Nutrition' | 'Workout';
  screen: string;
};

const NUTRITION_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'home', stack: 'Nutrition', screen: 'Dashboard' },
  { label: 'Daily Log', icon: 'journal', stack: 'Nutrition', screen: 'DailyLog' },
  { label: 'Ingredients', icon: 'nutrition', stack: 'Nutrition', screen: 'IngredientList' },
  { label: 'Recipes', icon: 'restaurant', stack: 'Nutrition', screen: 'RecipeList' },
  { label: 'History & Charts', icon: 'bar-chart', stack: 'Nutrition', screen: 'History' },
  { label: 'Micronutrients', icon: 'flask', stack: 'Nutrition', screen: 'Micronutrients' },
  { label: 'My Supplements', icon: 'medkit', stack: 'Nutrition', screen: 'Supplements' },
  { label: 'Settings', icon: 'settings', stack: 'Nutrition', screen: 'SettingsHome' },
];

const WORKOUT_ITEMS: NavItem[] = [
  { label: 'Exercise Library', icon: 'barbell', stack: 'Workout', screen: 'ExerciseLibrary' },
  { label: 'Workout Plans', icon: 'list', stack: 'Workout', screen: 'WorkoutPlans' },
  { label: 'Weight Log', icon: 'scale', stack: 'Workout', screen: 'WeightLog' },
];

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { navigation } = props;

  const state = useNavigationState((s) => s);
  const activeRoute = state?.routes?.[state.index];

  const navigateTo = (item: NavItem) => {
    navigation.navigate(item.stack, { screen: item.screen });
    navigation.closeDrawer();
  };

  const isActive = (item: NavItem) => {
    if (!activeRoute) return false;
    if (activeRoute.name !== item.stack) return false;
    const stackState = (activeRoute as any).state;
    if (!stackState) return item.screen === (item.stack === 'Nutrition' ? 'Dashboard' : 'ExerciseLibrary');
    const current = stackState.routes?.[stackState.index];
    return current?.name === item.screen;
  };

  const renderSection = (title: string, icon: React.ComponentProps<typeof Ionicons>['name'], items: NavItem[]) => (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
        <Text variant="labelMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {title}
        </Text>
      </View>
      {items.map((item) => {
        const active = isActive(item);
        return (
          <TouchableOpacity
            key={item.screen}
            style={[
              styles.navItem,
              active && { backgroundColor: theme.colors.primaryContainer },
            ]}
            onPress={() => navigateTo(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
              style={styles.navIcon}
            />
            <Text
              variant="bodyMedium"
              style={[
                styles.navLabel,
                { color: active ? theme.colors.primary : theme.colors.onSurface },
                active && styles.navLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* App Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Ionicons name="fitness" size={32} color="#fff" />
        <View style={styles.headerText}>
          <Text variant="titleLarge" style={styles.appName}>FitTrack</Text>
          <Text variant="bodySmall" style={styles.appSub}>Nutrition & Workout</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.navList}>
        {renderSection('NUTRITION', 'nutrition', NUTRITION_ITEMS)}
        <Divider style={styles.divider} />
        {renderSection('WORKOUT', 'barbell', WORKOUT_ITEMS)}
      </ScrollView>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 14,
  },
  headerText: { flex: 1 },
  appName: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  appSub: { color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  navList: { flex: 1 },
  section: { paddingVertical: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 2,
  },
  sectionTitle: { fontWeight: '700', letterSpacing: 1 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 1,
    borderRadius: 12,
  },
  navIcon: { marginRight: 14 },
  navLabel: { flex: 1 },
  navLabelActive: { fontWeight: '600' },
  divider: { marginVertical: 8, marginHorizontal: 16 },
});
