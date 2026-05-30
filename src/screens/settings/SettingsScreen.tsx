import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Divider, List, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@/navigation/types';
import { deleteAllData } from '@/db/trackingDao';

type Props = NativeStackScreenProps<MoreStackParamList, 'SettingsHome'>;

export default function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const [resetting, setResetting] = useState(false);

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all ingredients, recipes, and daily logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await deleteAllData();
              Alert.alert('Done', 'All data has been deleted.');
            } catch (e) {
              Alert.alert('Error', String(e));
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>More</Text>
        <Divider />

        <List.Section>
          <List.Subheader>Tools</List.Subheader>
          <List.Item
            title="🧬 Micronutrients"
            description="Vitamins & minerals reference guide"
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('Micronutrients')}
          />
          <List.Item
            title="💊 My Supplements"
            description="Track your supplement stack"
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('Supplements')}
          />
          <List.Item
            title="Manage Meal Types"
            description="Add custom meal types like Sehri, Iftar, Pre-workout"
            left={(p) => <List.Icon {...p} icon="silverware-fork-knife" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('ManageMeals')}
          />
          <List.Item
            title="History & Charts"
            description="Weekly kcal, macros, water, and weight trends"
            left={(p) => <List.Icon {...p} icon="chart-bar" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('History')}
          />
          <List.Item
            title="Backup & Restore"
            description="Export data to Google Drive or import a backup"
            left={(p) => <List.Icon {...p} icon="cloud-upload" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('Backup')}
          />
          <List.Item
            title="🧮 Macro Calculator"
            description="Calculate personalised macro targets"
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('MacroRecommendations')}
          />
          <List.Item
            title="📏 Body Measurements"
            description="Track body measurements over time"
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('BodyMeasurements')}
          />
          <List.Item
            title="📋 Meal Templates"
            description="Save and reuse common meals"
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('MealTemplates')}
          />
          <List.Item
            title="📊 Weekly Report"
            description="View your weekly nutrition summary"
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate('WeeklyReport')}
          />
        </List.Section>

        <Divider />
        <List.Section>
          <List.Subheader>App Info</List.Subheader>
          <List.Item title="Version" description="1.1.0" left={(p) => <List.Icon {...p} icon="information" />} />
          <List.Item title="Storage" description="Local SQLite database" left={(p) => <List.Icon {...p} icon="database" />} />
        </List.Section>

        <Divider />
        <List.Section>
          <List.Subheader>Danger Zone</List.Subheader>
          <View style={styles.dangerBtn}>
            <Button mode="outlined" textColor="#E63946" onPress={handleReset} loading={resetting} icon="delete-forever">
              Reset All Data
            </Button>
          </View>
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  title:        { padding: 16, fontWeight: 'bold' },
  dangerBtn:    { paddingHorizontal: 16, paddingTop: 8 },
});
