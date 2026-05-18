import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Divider,
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@/navigation/types';
import { useSupplements } from '@/hooks/useSupplements';
import { SupplementInput } from '@/db/schema';

type Props = NativeStackScreenProps<MoreStackParamList, 'SupplementForm'>;

const EMPTY: SupplementInput = {
  name: '',
  role: null,
  timing: null,
  is_daily: 1,
  cycling_info: null,
  dose: null,
  brand_notes: null,
  price_info: null,
  purchase_url: null,
  personal_notes: null,
};

export default function SupplementFormScreen({ route, navigation }: Props) {
  const { supplementId } = route.params ?? {};
  const isEditing = supplementId !== undefined;
  const { getById, add, update, remove } = useSupplements();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [dose, setDose] = useState('');
  const [timing, setTiming] = useState('');
  const [isDaily, setIsDaily] = useState<'1' | '0'>('1');
  const [cyclingInfo, setCyclingInfo] = useState('');
  const [brandNotes, setBrandNotes] = useState('');
  const [priceInfo, setPriceInfo] = useState('');
  const [purchaseUrl, setPurchaseUrl] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    getById(supplementId).then((s) => {
      if (!s) return;
      setName(s.name);
      setRole(s.role ?? '');
      setDose(s.dose ?? '');
      setTiming(s.timing ?? '');
      setIsDaily(s.is_daily ? '1' : '0');
      setCyclingInfo(s.cycling_info ?? '');
      setBrandNotes(s.brand_notes ?? '');
      setPriceInfo(s.price_info ?? '');
      setPurchaseUrl(s.purchase_url ?? '');
      setPersonalNotes(s.personal_notes ?? '');
    });
  }, [isEditing, supplementId, getById]);

  const buildInput = (): SupplementInput => ({
    name: name.trim(),
    role: role.trim() || null,
    timing: timing.trim() || null,
    is_daily: isDaily === '1' ? 1 : 0,
    cycling_info: isDaily === '0' ? cyclingInfo.trim() || null : null,
    dose: dose.trim() || null,
    brand_notes: brandNotes.trim() || null,
    price_info: priceInfo.trim() || null,
    purchase_url: purchaseUrl.trim() || null,
    personal_notes: personalNotes.trim() || null,
  });

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      const input = buildInput();
      if (isEditing) {
        await update(supplementId, input);
      } else {
        await add(input);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;
    Alert.alert(
      'Delete Supplement',
      `Delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(supplementId);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', String(e));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Basic Info ── */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Basic Info</Text>
        <TextInput
          label="Name *"
          value={name}
          onChangeText={(v) => { setName(v); setNameError(''); }}
          mode="outlined"
          error={!!nameError}
        />
        {nameError ? (
          <Text style={styles.errorText}>{nameError}</Text>
        ) : null}
        <TextInput
          label="Role / Purpose (e.g. Sleep support, Joint health)"
          value={role}
          onChangeText={setRole}
          mode="outlined"
          style={styles.field}
        />
        <TextInput
          label="Dose (e.g. 5g, 2000 IU, 2 capsules)"
          value={dose}
          onChangeText={setDose}
          mode="outlined"
          style={styles.field}
        />
        <TextInput
          label="Timing (e.g. Morning with food, Before bed)"
          value={timing}
          onChangeText={setTiming}
          mode="outlined"
          style={styles.field}
        />

        <Divider style={styles.divider} />

        {/* ── Schedule ── */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Schedule</Text>
        <RadioButton.Group
          onValueChange={(val) => setIsDaily(val as '1' | '0')}
          value={isDaily}
        >
          <View style={styles.radioRow}>
            <RadioButton value="1" />
            <Text variant="bodyMedium" style={styles.radioLabel}>Daily</Text>
          </View>
          <View style={styles.radioRow}>
            <RadioButton value="0" />
            <Text variant="bodyMedium" style={styles.radioLabel}>Cycling</Text>
          </View>
        </RadioButton.Group>
        {isDaily === '0' ? (
          <TextInput
            label="Cycling details (e.g. 8 weeks on, 4 weeks off)"
            value={cyclingInfo}
            onChangeText={setCyclingInfo}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.field}
          />
        ) : null}

        <Divider style={styles.divider} />

        {/* ── Product Info ── */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Product Info</Text>
        <TextInput
          label="Brand / Product notes"
          value={brandNotes}
          onChangeText={setBrandNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.field}
        />
        <TextInput
          label="Price info (e.g. £25 / 60 servings)"
          value={priceInfo}
          onChangeText={setPriceInfo}
          mode="outlined"
          style={styles.field}
        />
        <TextInput
          label="Purchase URL"
          value={purchaseUrl}
          onChangeText={setPurchaseUrl}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="url"
          style={styles.field}
        />

        <Divider style={styles.divider} />

        {/* ── Notes ── */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Notes</Text>
        <TextInput
          label="Personal notes"
          value={personalNotes}
          onChangeText={setPersonalNotes}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.field}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          icon="content-save"
          style={styles.saveBtn}
        >
          {isEditing ? 'Update Supplement' : 'Save Supplement'}
        </Button>

        {isEditing ? (
          <Button
            mode="outlined"
            onPress={handleDelete}
            icon="delete-outline"
            textColor="#E63946"
            style={styles.deleteBtn}
          >
            Delete Supplement
          </Button>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 4, paddingBottom: 32 },
  sectionTitle: { fontWeight: '700', opacity: 0.6, marginBottom: 6, marginTop: 4 },
  field: { marginTop: 10 },
  divider: { marginVertical: 14 },
  errorText: { color: '#E63946', fontSize: 12, marginTop: 2 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  radioLabel: { marginLeft: 4 },
  saveBtn: { marginTop: 20 },
  deleteBtn: { marginTop: 10, borderColor: '#E63946' },
});
