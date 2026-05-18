import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, TextInput, List, IconButton, Divider, Modal, Portal, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMealSlots } from '@/hooks/useMealSlots';
import { useDatabase } from '@/context/DatabaseContext';
import { MealSlot } from '@/db/schema';

const DEFAULT_SLOT_NAMES = ['breakfast', 'lunch', 'dinner', 'snack'];
const EMOJI_PRESETS = ['🌅','☀️','🌙','☕','🥗','🍎','💪','🏋️','⚡','🌿','🍽️','🥤','🌮','🍱','🥞','🍳'];

export default function ManageMealsScreen() {
  const { isReady } = useDatabase();
  const { slots, loading, load, add, update, remove } = useMealSlots();
  const [modalVisible, setModalVisible] = useState(false);
  const [editSlot, setEditSlot] = useState<MealSlot | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputEmoji, setInputEmoji] = useState('🍽️');

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  const openAdd = () => {
    setEditSlot(null);
    setInputName('');
    setInputEmoji('🍽️');
    setModalVisible(true);
  };

  const openEdit = (slot: MealSlot) => {
    setEditSlot(slot);
    setInputName(slot.display_name);
    setInputEmoji(slot.emoji);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!inputName.trim()) return;
    try {
      if (editSlot) {
        await update(editSlot.id, inputName, inputEmoji);
      } else {
        await add(inputName, inputEmoji);
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  const handleDelete = (slot: MealSlot) => {
    if (DEFAULT_SLOT_NAMES.includes(slot.name)) {
      Alert.alert('Cannot Delete', 'Default meal types cannot be deleted, but you can rename them.');
      return;
    }
    Alert.alert('Delete Meal Type', `Delete "${slot.display_name}"? Existing log entries won't be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(slot.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodySmall" style={styles.hint}>
          Add custom meal types (e.g. Sehri, Iftar, Pre-workout). Rename or reorder as you like.
        </Text>

        <View style={styles.listCard}>
          {slots.map((slot, idx) => (
            <View key={slot.id}>
              <View style={styles.row}>
                <Text style={styles.emoji}>{slot.emoji}</Text>
                <View style={styles.info}>
                  <Text variant="bodyLarge" style={styles.slotName}>{slot.display_name}</Text>
                  {DEFAULT_SLOT_NAMES.includes(slot.name) && (
                    <Text variant="labelSmall" style={styles.defaultBadge}>Default</Text>
                  )}
                </View>
                <IconButton icon="pencil" size={18} onPress={() => openEdit(slot)} />
                <IconButton
                  icon="delete-outline"
                  size={18}
                  onPress={() => handleDelete(slot)}
                  iconColor={DEFAULT_SLOT_NAMES.includes(slot.name) ? '#ccc' : '#E63946'}
                />
              </View>
              {idx < slots.length - 1 && <Divider />}
            </View>
          ))}
        </View>

        <Button mode="outlined" icon="plus" onPress={openAdd} style={styles.addBtn}>
          Add Custom Meal Type
        </Button>
      </ScrollView>

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium" style={styles.modalTitle}>
            {editSlot ? 'Edit Meal Type' : 'New Meal Type'}
          </Text>

          <TextInput
            label="Name (e.g. Sehri, Pre-workout)"
            value={inputName}
            onChangeText={setInputName}
            mode="outlined"
          />

          <Text variant="labelMedium" style={styles.emojiLabel}>Choose Emoji</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_PRESETS.map((e) => (
              <Text
                key={e}
                style={[styles.emojiOption, inputEmoji === e && styles.emojiSelected]}
                onPress={() => setInputEmoji(e)}
              >
                {e}
              </Text>
            ))}
          </View>
          <TextInput
            label="Or type any emoji"
            value={inputEmoji}
            onChangeText={setInputEmoji}
            mode="outlined"
            style={{ marginTop: 8 }}
          />

          <View style={styles.modalBtns}>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} disabled={!inputName.trim()}>
              {editSlot ? 'Update' : 'Add'}
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  hint: { opacity: 0.6, lineHeight: 18 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  emoji: { fontSize: 22, marginRight: 10 },
  info: { flex: 1 },
  slotName: { fontWeight: '600' },
  defaultBadge: { opacity: 0.4, fontSize: 10 },
  addBtn: { borderRadius: 10 },
  modal: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 20 },
  modalTitle: { fontWeight: 'bold', marginBottom: 14 },
  emojiLabel: { marginTop: 12, marginBottom: 6, opacity: 0.6 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: { fontSize: 26, padding: 4, borderRadius: 8 },
  emojiSelected: { backgroundColor: 'rgba(78,205,196,0.2)' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
