import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Alert, View } from 'react-native';
import { TextInput, Button, Text, Divider, HelperText, List, Modal, Portal, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoals } from '@/hooks/useGoals';
import { todayString } from '@/utils/dateUtils';
import { DailyGoalInput, GoalTemplate } from '@/db/schema';
import { getAllGoalTemplates, upsertGoalTemplate, deleteGoalTemplate } from '@/db/trackingDao';
import { useDatabase } from '@/context/DatabaseContext';

interface Props {
  onSaved?: () => void;
}

function parseGoal(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) || n <= 0 ? null : n;
}

export default function GoalsScreen({ onSaved }: Props) {
  const today = todayString();
  const { isReady } = useDatabase();
  const { goal, loading, load, save } = useGoals();

  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [water, setWater] = useState('2000');
  const [saving, setSaving] = useState(false);

  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateModalVisible, setTemplateModalVisible] = useState(false);

  useEffect(() => { load(today); }, [load, today]);

  useEffect(() => {
    if (goal) {
      setKcal(goal.kcal_goal != null ? String(goal.kcal_goal) : '');
      setProtein(goal.protein_goal != null ? String(goal.protein_goal) : '');
      setCarbs(goal.carbs_goal != null ? String(goal.carbs_goal) : '');
      setFat(goal.fat_goal != null ? String(goal.fat_goal) : '');
      setFiber(goal.fiber_goal != null ? String(goal.fiber_goal) : '');
      setWater(goal.water_goal_ml != null ? String(goal.water_goal_ml) : '2000');
    }
  }, [goal]);

  const loadTemplates = useCallback(async () => {
    if (!isReady) return;
    const t = await getAllGoalTemplates();
    setTemplates(t);
  }, [isReady]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const applyTemplate = (t: GoalTemplate) => {
    if (t.kcal_goal) setKcal(String(t.kcal_goal));
    if (t.protein_goal) setProtein(String(t.protein_goal));
    if (t.carbs_goal) setCarbs(String(t.carbs_goal));
    if (t.fat_goal) setFat(String(t.fat_goal));
    if (t.fiber_goal) setFiber(String(t.fiber_goal));
    if (t.water_goal_ml) setWater(String(t.water_goal_ml));
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      Alert.alert('Required', 'Enter a template name.');
      return;
    }
    try {
      await upsertGoalTemplate({
        name: templateName.trim(),
        kcal_goal: parseGoal(kcal),
        protein_goal: parseGoal(protein),
        carbs_goal: parseGoal(carbs),
        fat_goal: parseGoal(fat),
        fiber_goal: parseGoal(fiber),
        water_goal_ml: parseFloat(water) || 2000,
      });
      setTemplateName('');
      setTemplateModalVisible(false);
      await loadTemplates();
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  const handleDeleteTemplate = (t: GoalTemplate) => {
    Alert.alert('Delete Template', `Delete "${t.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteGoalTemplate(t.id);
          await loadTemplates();
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!kcal.trim()) {
      Alert.alert('Required', 'Please set a daily calorie goal.');
      return;
    }
    setSaving(true);
    try {
      const input: DailyGoalInput = {
        date: today,
        kcal_goal: parseGoal(kcal),
        protein_goal: parseGoal(protein),
        carbs_goal: parseGoal(carbs),
        fat_goal: parseGoal(fat),
        fiber_goal: parseGoal(fiber),
        water_goal_ml: parseFloat(water) || 2000,
      };
      await save(input);
      onSaved?.();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>Daily Goals</Text>
        <HelperText type="info" visible>
          Goals apply from today onwards until you change them.
        </HelperText>
        <Divider style={styles.divider} />

        {/* Templates */}
        {templates.length > 0 && (
          <>
            <Text variant="titleSmall" style={styles.sectionLabel}>Quick Load Template</Text>
            <View style={styles.templateRow}>
              {templates.map((t) => (
                <View key={t.id} style={styles.templateItem}>
                  <Button mode="outlined" compact onPress={() => applyTemplate(t)} style={styles.templateBtn}>
                    {t.name}
                  </Button>
                  <IconButton icon="close" size={14} onPress={() => handleDeleteTemplate(t)} style={styles.templateDel} />
                </View>
              ))}
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        <TextInput label="Calorie Goal (kcal) *" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" mode="outlined" />
        <TextInput label="Protein Goal (g)" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" mode="outlined" />
        <TextInput label="Carbs Goal (g)" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" mode="outlined" />
        <TextInput label="Fiber Goal (g)" value={fiber} onChangeText={setFiber} keyboardType="decimal-pad" mode="outlined" />
        <TextInput label="Fat Goal (g)" value={fat} onChangeText={setFat} keyboardType="decimal-pad" mode="outlined" />
        <TextInput
          label="Water Goal (ml)"
          value={water}
          onChangeText={setWater}
          keyboardType="decimal-pad"
          mode="outlined"
          right={<TextInput.Affix text="ml" />}
        />

        <Button mode="contained" onPress={handleSave} loading={saving || loading} icon="flag-checkered" style={styles.btn}>
          Save Goals
        </Button>

        <Button mode="outlined" icon="bookmark-plus" onPress={() => setTemplateModalVisible(true)} style={styles.saveTemplateBtn}>
          Save as Template
        </Button>
      </ScrollView>

      <Portal>
        <Modal
          visible={templateModalVisible}
          onDismiss={() => setTemplateModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>Save as Template</Text>
          <TextInput
            label="Template Name (e.g. Training Day)"
            value={templateName}
            onChangeText={setTemplateName}
            mode="outlined"
            style={styles.templateInput}
          />
          <View style={styles.modalBtns}>
            <Button onPress={() => setTemplateModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSaveTemplate}>Save</Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  title: { fontWeight: 'bold' },
  divider: { marginVertical: 8 },
  sectionLabel: { fontWeight: '600', opacity: 0.7, marginBottom: 4 },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  templateItem: { flexDirection: 'row', alignItems: 'center' },
  templateBtn: { borderRadius: 20 },
  templateDel: { margin: 0 },
  btn: { marginTop: 8 },
  saveTemplateBtn: { marginTop: 4 },
  modal: { backgroundColor: 'white', margin: 24, borderRadius: 12, padding: 16 },
  modalTitle: { fontWeight: 'bold', marginBottom: 12 },
  templateInput: {},
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
