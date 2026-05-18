import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  FAB,
  TextInput,
  useTheme,
  IconButton,
  ActivityIndicator,
  Chip,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { useMealTemplates } from '@/hooks/useMealTemplates';
import { MealTemplate, MealTemplateEntry, MealTemplateWithEntries } from '@/db/mealTemplatesDao';
import { addMealEntry } from '@/db/trackingDao';
import { todayString } from '@/utils/dateUtils';
import { MEAL_TYPES, MEAL_LABELS } from '@/constants/macros';

type Props = NativeStackScreenProps<NutritionStackParamList, 'MealTemplates'>;

const MEAL_TYPE_OPTIONS = MEAL_TYPES.length > 0 ? MEAL_TYPES : ['breakfast', 'lunch', 'dinner', 'snack'];

interface EntryDraft {
  mealType: string;
  foodName: string;
  grams: string;
}

function emptyDraft(): EntryDraft {
  return { mealType: 'breakfast', foodName: '', grams: '' };
}

export default function MealTemplatesScreen({ navigation }: Props) {
  const theme = useTheme();
  const { templates, loading, load, getById, create, remove } = useMealTemplates();

  // Create modal state
  const [createVisible, setCreateVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [entries, setEntries] = useState<EntryDraft[]>([emptyDraft()]);
  const [saving, setSaving] = useState(false);

  // Apply state
  const [applyingId, setApplyingId] = useState<number | null>(null);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setTemplateName('');
    setTemplateDesc('');
    setEntries([emptyDraft()]);
    setCreateVisible(true);
  };

  const addEntry = () => setEntries((prev) => [...prev, emptyDraft()]);
  const removeEntry = (idx: number) =>
    setEntries((prev) => prev.filter((_, i) => i !== idx));

  const updateEntry = (idx: number, key: keyof EntryDraft, val: string) =>
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [key]: val } : e)));

  const handleCreate = async () => {
    if (!templateName.trim()) {
      Alert.alert('Required', 'Please enter a template name.');
      return;
    }
    const validEntries = entries.filter((e) => e.foodName.trim() && parseFloat(e.grams) > 0);
    if (validEntries.length === 0) {
      Alert.alert('Required', 'Add at least one meal entry with a food name and grams.');
      return;
    }
    setSaving(true);
    try {
      await create(
        templateName.trim(),
        templateDesc.trim() || null,
        validEntries.map((e) => ({
          mealType: e.mealType,
          foodType: 'ingredient',
          foodId: 0,
          foodName: e.foodName.trim(),
          grams: parseFloat(e.grams),
        }))
      );
      setCreateVisible(false);
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToday = async (template: MealTemplate) => {
    Alert.alert(
      'Apply Template',
      `Apply "${template.name}" to today's log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setApplyingId(template.id);
            try {
              const full: MealTemplateWithEntries | null = await getById(template.id);
              if (!full || full.entries.length === 0) {
                Alert.alert('Empty template', 'This template has no entries.');
                return;
              }
              const today = todayString();
              for (const entry of full.entries) {
                await addMealEntry({
                  date: today,
                  meal_type: entry.mealType,
                  food_type: 'ingredient',
                  food_id: entry.foodId,
                  grams: entry.grams,
                });
              }
              Alert.alert('Applied', `${full.entries.length} entries added to today's log.`);
            } catch (err) {
              Alert.alert('Error', String(err));
            } finally {
              setApplyingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (template: MealTemplate) => {
    Alert.alert('Delete Template', `Delete "${template.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(template.id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* App Bar */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.appBar}>
          <IconButton
            icon="arrow-left"
            iconColor="#fff"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          />
          <Text variant="titleLarge" style={styles.appBarTitle}>Meal Templates</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator style={{ marginTop: 24 }} />}

        {!loading && templates.length === 0 && (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text style={styles.emptyText}>No templates yet</Text>
            <Text style={styles.emptySubText}>
              Save full-day meal plans and apply them to any day with one tap.
            </Text>
            <Button icon="plus" mode="contained" onPress={openCreate} style={{ marginTop: 16 }}>
              Create First Template
            </Button>
          </Surface>
        )}

        {templates.map((template) => (
          <Surface key={template.id} style={styles.templateCard} elevation={2}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={styles.templateName}>{template.name}</Text>
                {template.description ? (
                  <Text variant="bodySmall" style={styles.templateDesc}>{template.description}</Text>
                ) : null}
              </View>
              <IconButton
                icon="delete-outline"
                size={20}
                onPress={() => handleDelete(template)}
              />
            </View>
            <View style={styles.cardFooter}>
              <Button
                mode="contained"
                compact
                icon={applyingId === template.id ? 'loading' : 'calendar-check'}
                loading={applyingId === template.id}
                onPress={() => handleApplyToday(template)}
                style={styles.applyBtn}
              >
                Apply Today
              </Button>
            </View>
          </Surface>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={openCreate} />

      {/* Create Template Modal */}
      <Modal
        visible={createVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={styles.modalTitle}>New Template</Text>
              <IconButton icon="close" size={20} onPress={() => setCreateVisible(false)} />
            </View>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <TextInput
                label="Template Name *"
                value={templateName}
                onChangeText={setTemplateName}
                mode="outlined"
                dense
              />
              <TextInput
                label="Description (optional)"
                value={templateDesc}
                onChangeText={setTemplateDesc}
                mode="outlined"
                dense
              />

              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.sectionLabel}>Meal Entries</Text>

              {entries.map((entry, idx) => (
                <View key={idx} style={styles.entryBlock}>
                  <View style={styles.entryHeader}>
                    <Text variant="labelMedium" style={styles.entryIdx}>Entry {idx + 1}</Text>
                    {entries.length > 1 && (
                      <IconButton icon="minus-circle" size={18} onPress={() => removeEntry(idx)} style={{ margin: 0 }} />
                    )}
                  </View>
                  {/* Meal Type chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {MEAL_TYPE_OPTIONS.map((mt) => (
                      <Chip
                        key={mt}
                        selected={entry.mealType === mt}
                        onPress={() => updateEntry(idx, 'mealType', mt)}
                        compact
                        style={styles.chip}
                      >
                        {MEAL_LABELS[mt] ?? mt}
                      </Chip>
                    ))}
                  </ScrollView>
                  <TextInput
                    label="Food Name"
                    value={entry.foodName}
                    onChangeText={(v) => updateEntry(idx, 'foodName', v)}
                    mode="outlined"
                    dense
                  />
                  <TextInput
                    label="Grams"
                    value={entry.grams}
                    onChangeText={(v) => updateEntry(idx, 'grams', v)}
                    keyboardType="decimal-pad"
                    mode="outlined"
                    dense
                  />
                </View>
              ))}

              <Button icon="plus" mode="outlined" compact onPress={addEntry} style={styles.addEntryBtn}>
                Add Entry
              </Button>

              <Button
                mode="contained"
                onPress={handleCreate}
                loading={saving}
                style={styles.saveBtn}
                icon="content-save"
              >
                Save Template
              </Button>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, paddingVertical: 4 },
  backBtn: { margin: 0 },
  appBarTitle: { color: '#fff', fontWeight: '700', flex: 1 },

  content: { padding: 12, gap: 12, paddingBottom: 24 },

  emptyCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginTop: 24 },
  emptyText: { fontSize: 16, fontWeight: '700', opacity: 0.5 },
  emptySubText: { opacity: 0.4, fontSize: 13, textAlign: 'center', marginTop: 6 },

  templateCard: { borderRadius: 12, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  templateName: { fontWeight: '700' },
  templateDesc: { opacity: 0.6, marginTop: 2 },
  cardFooter: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  applyBtn: { flex: 1 },

  fab: { position: 'absolute', right: 16, bottom: 24 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 4, paddingTop: 12 },
  modalTitle: { fontWeight: '700' },
  modalContent: { padding: 16, gap: 8, paddingBottom: 40 },

  divider: { marginVertical: 8 },
  sectionLabel: { fontWeight: '600', opacity: 0.7, marginBottom: 4 },

  entryBlock: { borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)', borderRadius: 8, padding: 10, gap: 6 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryIdx: { fontWeight: '600' },
  chipRow: { marginBottom: 4 },
  chip: { marginRight: 6 },

  addEntryBtn: { marginTop: 4 },
  saveBtn: { marginTop: 8 },
});
