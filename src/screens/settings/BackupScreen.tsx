import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Divider, List, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportAllData, importAllData, BackupData } from '@/db/backupDao';

export default function BackupScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const filename = `nutrition-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const uri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Save Backup' });
      } else {
        Alert.alert('Saved', `Backup saved to:\n${uri}`);
      }
    } catch (e) {
      Alert.alert('Export Failed', String(e));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });

      let data: BackupData;
      try {
        data = JSON.parse(content) as BackupData;
      } catch {
        Alert.alert('Invalid File', 'The selected file is not a valid backup.');
        return;
      }

      if (!data.ingredients || !data.recipes || !data.meal_entries) {
        Alert.alert('Invalid File', 'Backup file is missing required data.');
        return;
      }

      Alert.alert(
        'Restore Backup',
        `This will replace ALL current data with the backup from ${data.exported_at?.slice(0, 10) ?? 'unknown date'}.\n\nThis cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              setImporting(true);
              try {
                await importAllData(data);
                Alert.alert('Success', 'Data restored successfully! Please restart the app.');
              } catch (e) {
                Alert.alert('Import Failed', String(e));
              } finally {
                setImporting(false);
              }
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text variant="headlineSmall" style={styles.title}>Backup & Restore</Text>
      <Divider />

      <List.Section>
        <List.Subheader>Google Drive / Cloud Backup</List.Subheader>
        <View style={styles.infoBox}>
          <Text variant="bodySmall" style={styles.infoText}>
            Export your data as a JSON file and save it to Google Drive (or any cloud storage). To restore, download the file and use Import below.
          </Text>
        </View>
      </List.Section>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="export"
          onPress={handleExport}
          loading={exporting}
          disabled={importing}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          Export / Backup Data
        </Button>

        <Button
          mode="outlined"
          icon="import"
          onPress={handleImport}
          loading={importing}
          disabled={exporting}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          Import / Restore Data
        </Button>
      </View>

      {(exporting || importing) && (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text variant="bodySmall" style={{ marginLeft: 8 }}>
            {exporting ? 'Preparing backup...' : 'Restoring data...'}
          </Text>
        </View>
      )}

      <List.Section>
        <List.Subheader>How it works</List.Subheader>
        <List.Item
          title="Export"
          description="Creates a .json file with all your data. Share it to Google Drive, email, or any storage app."
          left={(p) => <List.Icon {...p} icon="export" />}
        />
        <List.Item
          title="Import"
          description="Pick a previously exported .json backup file to restore your data."
          left={(p) => <List.Icon {...p} icon="import" />}
        />
      </List.Section>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { padding: 16, fontWeight: 'bold' },
  infoBox: { marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: 'rgba(78,205,196,0.1)', borderRadius: 8 },
  infoText: { opacity: 0.8, lineHeight: 18 },
  actions: { paddingHorizontal: 16, gap: 12 },
  btn: { borderRadius: 8 },
  btnContent: { paddingVertical: 4 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16 },
});
