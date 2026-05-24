import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Divider, List, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@/navigation/types';
import { deleteAllData } from '@/db/trackingDao';
import { getAppSetting, setAppSetting } from '@/db/mealSlotsDao';
import { useDatabase } from '@/context/DatabaseContext';

type Props = NativeStackScreenProps<MoreStackParamList, 'SettingsHome'>;

export default function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isReady } = useDatabase();
  const [resetting, setResetting] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    getAppSetting('exercisedb_api_key').then((val) => setApiKeyConfigured(!!val));
  }, [isReady]);

  const openApiKeyModal = async () => {
    const existing = await getAppSetting('exercisedb_api_key');
    setApiKeyInput(existing ?? '');
    setApiKeyModalVisible(true);
  };

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    try {
      const trimmed = apiKeyInput.trim();
      if (trimmed) {
        await setAppSetting('exercisedb_api_key', trimmed);
        setApiKeyConfigured(true);
        Alert.alert('Saved', 'ExerciseDB API key saved. Exercise animations are now enabled.');
      } else {
        await setAppSetting('exercisedb_api_key', '');
        setApiKeyConfigured(false);
        Alert.alert('Cleared', 'ExerciseDB API key removed.');
      }
      setApiKeyModalVisible(false);
    } finally {
      setSavingKey(false);
    }
  };

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
        <List.Subheader>Integrations</List.Subheader>
        <List.Item
          title="ExerciseDB API Key"
          description={apiKeyConfigured ? '✅ Connected — exercise animations enabled' : 'Tap to add key and enable exercise GIFs'}
          left={(p) => <List.Icon {...p} icon="key" />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={openApiKeyModal}
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
      {/* ExerciseDB API Key Modal */}
      <Modal
        visible={apiKeyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setApiKeyModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 8 }}>
              ExerciseDB API Key
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16, lineHeight: 18 }}>
              Get a free key from RapidAPI → ExerciseDB. Paste it below to enable exercise animations in the Exercise Library.
            </Text>
            <TextInput
              style={[styles.apiInput, { borderColor: theme.colors.outline, color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant }]}
              placeholder="Paste your RapidAPI key here…"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={false}
            />
            <View style={styles.modalButtons}>
              <Button mode="text" onPress={() => setApiKeyModalVisible(false)}>Cancel</Button>
              {apiKeyConfigured && (
                <Button
                  mode="text"
                  textColor={theme.colors.error}
                  onPress={() => { setApiKeyInput(''); }}
                >
                  Clear
                </Button>
              )}
              <Button mode="contained" onPress={handleSaveApiKey} loading={savingKey}>
                Save
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { padding: 16, fontWeight: 'bold' },
  dangerBtn: { paddingHorizontal: 16, paddingTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
  },
  apiInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
