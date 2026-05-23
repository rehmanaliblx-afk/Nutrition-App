import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  Text,
  Button,
  Surface,
  FAB,
  TextInput,
  useTheme,
  IconButton,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { NutritionStackParamList } from '@/navigation/types';
import { useBodyMeasurements } from '@/hooks/useBodyMeasurements';
import { BodyMeasurement } from '@/db/bodyMeasurementsDao';
import { todayString, formatDateDisplay } from '@/utils/dateUtils';

type Props = NativeStackScreenProps<NutritionStackParamList, 'BodyMeasurements'>;

const CHART_W = 140;
const CHART_H = 100;
const PAD = 8;

interface ChartProps {
  data: number[];
  color: string;
  label: string;
  unit: string;
}

function MiniLineChart({ data, color, label, unit }: ChartProps) {
  if (data.length < 2) {
    return (
      <View style={[chartStyles.container, { width: CHART_W + PAD * 2 }]}>
        <Text style={chartStyles.label}>{label}</Text>
        <View style={chartStyles.noData}>
          <Text style={chartStyles.noDataText}>Not enough data</Text>
        </View>
      </View>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const toX = (i: number) => PAD + (i / (data.length - 1)) * (CHART_W - PAD * 2);
  const toY = (v: number) => PAD + ((max - v) / range) * (CHART_H - PAD * 2);

  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  return (
    <View style={[chartStyles.container, { width: CHART_W + PAD * 2 }]}>
      <Text style={chartStyles.label}>{label}</Text>
      <Svg width={CHART_W + PAD * 2} height={CHART_H + PAD}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((v, i) => (
          <Circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill={color} />
        ))}
        <SvgText x={PAD} y={CHART_H + PAD - 1} fontSize={9} fill="#888">
          {min.toFixed(1)}{unit}
        </SvgText>
        <SvgText x={CHART_W - 18} y={PAD + 8} fontSize={9} fill="#888">
          {max.toFixed(1)}{unit}
        </SvgText>
      </Svg>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { alignItems: 'center', marginHorizontal: 4 },
  label: { fontSize: 11, fontWeight: '600', opacity: 0.7, marginBottom: 4 },
  noData: { width: CHART_W, height: CHART_H, justifyContent: 'center', alignItems: 'center' },
  noDataText: { fontSize: 10, opacity: 0.4, fontStyle: 'italic' },
});

function parseNum(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

interface FormState {
  date: string;
  weightKg: string;
  chestCm: string;
  waistCm: string;
  hipsCm: string;
  bicepsCm: string;
  thighsCm: string;
  calvesCm: string;
  shouldersCm: string;
  bodyFatPct: string;
  notes: string;
  photoUri: string | null;
}

const emptyForm = (): FormState => ({
  date: todayString(),
  weightKg: '',
  chestCm: '',
  waistCm: '',
  hipsCm: '',
  bicepsCm: '',
  thighsCm: '',
  calvesCm: '',
  shouldersCm: '',
  bodyFatPct: '',
  notes: '',
  photoUri: null,
});

function measurementToForm(m: BodyMeasurement): FormState {
  return {
    date: m.date,
    weightKg: m.weightKg != null ? String(m.weightKg) : '',
    chestCm: m.chestCm != null ? String(m.chestCm) : '',
    waistCm: m.waistCm != null ? String(m.waistCm) : '',
    hipsCm: m.hipsCm != null ? String(m.hipsCm) : '',
    bicepsCm: m.bicepsCm != null ? String(m.bicepsCm) : '',
    thighsCm: m.thighsCm != null ? String(m.thighsCm) : '',
    calvesCm: m.calvesCm != null ? String(m.calvesCm) : '',
    shouldersCm: m.shouldersCm != null ? String(m.shouldersCm) : '',
    bodyFatPct: m.bodyFatPct != null ? String(m.bodyFatPct) : '',
    notes: m.notes ?? '',
    photoUri: m.photoPath ?? null,
  };
}

export default function BodyMeasurementsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { measurements, loading, load, save, latest, remove } = useBodyMeasurements();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewPhotoUri, setViewPhotoUri] = useState<string | null>(null);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(emptyForm());
    setEditId(null);
    setModalVisible(true);
  };

  const openEdit = (m: BodyMeasurement) => {
    setForm(measurementToForm(m));
    setEditId(m.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({
        date: form.date || todayString(),
        weightKg: parseNum(form.weightKg),
        chestCm: parseNum(form.chestCm),
        waistCm: parseNum(form.waistCm),
        hipsCm: parseNum(form.hipsCm),
        bicepsCm: parseNum(form.bicepsCm),
        thighsCm: parseNum(form.thighsCm),
        calvesCm: parseNum(form.calvesCm),
        shouldersCm: parseNum(form.shouldersCm),
        bodyFatPct: parseNum(form.bodyFatPct),
        photoPath: form.photoUri ?? null,
        notes: form.notes.trim() || null,
      });
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (m: BodyMeasurement) => {
    Alert.alert('Delete Measurement', `Delete measurement for ${formatDateDisplay(m.date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(m.id) },
    ]);
  };

  const weightData = measurements
    .slice()
    .reverse()
    .slice(0, 20)
    .filter((m) => m.weightKg != null)
    .map((m) => m.weightKg as number);

  const waistData = measurements
    .slice()
    .reverse()
    .slice(0, 20)
    .filter((m) => m.waistCm != null)
    .map((m) => m.waistCm as number);

  const setField = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handlePickPhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setForm((prev) => ({ ...prev, photoUri: result.assets[0].uri }));
      }
    } catch (e) {
      Alert.alert('Error', 'Could not pick photo: ' + String(e));
    }
  };

  const renderItem = useCallback(({ item }: { item: BodyMeasurement }) => (
    <Surface style={styles.historyCard} elevation={1}>
      <View style={styles.historyRow}>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={styles.historyDate}>{formatDateDisplay(item.date)}</Text>
          <View style={styles.historyFields}>
            {item.weightKg != null && <Text style={styles.historyChip}>Weight: {item.weightKg}kg</Text>}
            {item.waistCm != null && <Text style={styles.historyChip}>Waist: {item.waistCm}cm</Text>}
            {item.chestCm != null && <Text style={styles.historyChip}>Chest: {item.chestCm}cm</Text>}
            {item.bodyFatPct != null && <Text style={styles.historyChip}>BF: {item.bodyFatPct}%</Text>}
          </View>
        </View>
        <View style={styles.historyActions}>
          <IconButton icon="pencil" size={18} onPress={() => openEdit(item)} />
          <IconButton icon="delete-outline" size={18} onPress={() => handleDelete(item)} />
        </View>
      </View>
    </Surface>
  ), []);

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
          <Text variant="titleLarge" style={styles.appBarTitle}>Body Measurements</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator style={{ marginTop: 24 }} />}

        {/* Latest Measurement Card */}
        {latest && (
          <Surface style={styles.latestCard} elevation={2}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Latest Measurements</Text>
            <Text variant="labelSmall" style={styles.latestDate}>{formatDateDisplay(latest.date)}</Text>
            <View style={styles.latestGrid}>
              {latest.weightKg != null && <LatestField label="Weight" value={`${latest.weightKg} kg`} />}
              {latest.chestCm != null && <LatestField label="Chest" value={`${latest.chestCm} cm`} />}
              {latest.waistCm != null && <LatestField label="Waist" value={`${latest.waistCm} cm`} />}
              {latest.hipsCm != null && <LatestField label="Hips" value={`${latest.hipsCm} cm`} />}
              {latest.bicepsCm != null && <LatestField label="Biceps" value={`${latest.bicepsCm} cm`} />}
              {latest.thighsCm != null && <LatestField label="Thighs" value={`${latest.thighsCm} cm`} />}
              {latest.calvesCm != null && <LatestField label="Calves" value={`${latest.calvesCm} cm`} />}
              {latest.shouldersCm != null && <LatestField label="Shoulders" value={`${latest.shouldersCm} cm`} />}
              {latest.bodyFatPct != null && <LatestField label="Body Fat" value={`${latest.bodyFatPct}%`} />}
            </View>
            {latest.notes && (
              <Text variant="bodySmall" style={styles.latestNotes}>{latest.notes}</Text>
            )}
          </Surface>
        )}

        {/* Trend Charts */}
        {(weightData.length >= 2 || waistData.length >= 2) && (
          <Surface style={styles.chartsCard} elevation={1}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Trends (last 20)</Text>
            <View style={styles.chartsRow}>
              <MiniLineChart data={weightData} color="#4ECDC4" label="Weight" unit="kg" />
              <MiniLineChart data={waistData} color="#FF6B6B" label="Waist" unit="cm" />
            </View>
          </Surface>
        )}

        {/* History List */}
        <Text variant="titleSmall" style={[styles.sectionTitle, { paddingHorizontal: 4, marginTop: 4 }]}>
          History ({measurements.length})
        </Text>
        {measurements.length === 0 && !loading && (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text style={styles.emptyText}>No measurements yet.</Text>
            <Text style={styles.emptySubText}>Tap + to add your first entry.</Text>
          </Surface>
        )}
        {measurements.map((m) => (
          <Surface key={m.id} style={styles.historyCard} elevation={1}>
            <View style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall" style={styles.historyDate}>{formatDateDisplay(m.date)}</Text>
                <View style={styles.historyFields}>
                  {m.weightKg != null && <Text style={styles.historyChip}>Weight: {m.weightKg}kg</Text>}
                  {m.waistCm != null && <Text style={styles.historyChip}>Waist: {m.waistCm}cm</Text>}
                  {m.chestCm != null && <Text style={styles.historyChip}>Chest: {m.chestCm}cm</Text>}
                  {m.bodyFatPct != null && <Text style={styles.historyChip}>BF: {m.bodyFatPct}%</Text>}
                  {m.hipsCm != null && <Text style={styles.historyChip}>Hips: {m.hipsCm}cm</Text>}
                </View>
                {m.notes && <Text style={styles.historyNotes}>{m.notes}</Text>}
              </View>
              <View style={styles.historyActions}>
                {m.photoPath && (
                  <IconButton
                    icon="camera"
                    size={18}
                    onPress={() => setViewPhotoUri(m.photoPath!)}
                  />
                )}
                <IconButton icon="pencil" size={18} onPress={() => openEdit(m)} />
                <IconButton icon="delete-outline" size={18} onPress={() => handleDelete(m)} />
              </View>
            </View>
          </Surface>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={openAdd} />

      {/* Full-screen Photo Viewer */}
      <Modal
        visible={viewPhotoUri !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setViewPhotoUri(null)}
      >
        <TouchableOpacity
          style={styles.photoViewerOverlay}
          activeOpacity={1}
          onPress={() => setViewPhotoUri(null)}
        >
          {viewPhotoUri && (
            <Image
              source={{ uri: viewPhotoUri }}
              style={styles.photoViewerImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.photoViewerClose}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={styles.modalTitle}>
                {editId ? 'Edit Measurement' : 'Add Measurement'}
              </Text>
              <IconButton icon="close" size={20} onPress={() => setModalVisible(false)} />
            </View>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <TextInput
                label="Date (YYYY-MM-DD)"
                value={form.date}
                onChangeText={setField('date')}
                mode="outlined"
                dense
              />
              <TextInput
                label="Weight (kg)"
                value={form.weightKg}
                onChangeText={setField('weightKg')}
                keyboardType="decimal-pad"
                mode="outlined"
                dense
              />
              <View style={styles.twoCol}>
                <TextInput
                  label="Chest (cm)"
                  value={form.chestCm}
                  onChangeText={setField('chestCm')}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.halfInput}
                />
                <TextInput
                  label="Waist (cm)"
                  value={form.waistCm}
                  onChangeText={setField('waistCm')}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.halfInput}
                />
              </View>
              <View style={styles.twoCol}>
                <TextInput
                  label="Hips (cm)"
                  value={form.hipsCm}
                  onChangeText={setField('hipsCm')}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.halfInput}
                />
                <TextInput
                  label="Biceps (cm)"
                  value={form.bicepsCm}
                  onChangeText={setField('bicepsCm')}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.halfInput}
                />
              </View>
              <View style={styles.twoCol}>
                <TextInput
                  label="Thighs (cm)"
                  value={form.thighsCm}
                  onChangeText={setField('thighsCm')}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.halfInput}
                />
                <TextInput
                  label="Calves (cm)"
                  value={form.calvesCm}
                  onChangeText={setField('calvesCm')}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.halfInput}
                />
              </View>
              <View style={styles.twoCol}>
                <TextInput
                  label="Shoulders (cm)"
                  value={form.shouldersCm}
                  onChangeText={setField('shouldersCm')}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.halfInput}
                />
                <TextInput
                  label="Body Fat %"
                  value={form.bodyFatPct}
                  onChangeText={setField('bodyFatPct')}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.halfInput}
                />
              </View>
              <TextInput
                label="Notes"
                value={form.notes}
                onChangeText={setField('notes')}
                mode="outlined"
                multiline
                numberOfLines={2}
              />
              {/* Photo picker */}
              <Button
                mode="outlined"
                onPress={handlePickPhoto}
                icon="camera"
                style={styles.photoBtn}
              >
                {form.photoUri ? 'Change Photo' : 'Add Photo'}
              </Button>
              {form.photoUri && (
                <Image
                  source={{ uri: form.photoUri }}
                  style={styles.photoThumb}
                  resizeMode="cover"
                />
              )}
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                style={styles.saveBtn}
                icon="content-save"
              >
                Save
              </Button>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function LatestField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.latestField}>
      <Text variant="titleSmall" style={styles.latestValue}>{value}</Text>
      <Text variant="labelSmall" style={styles.latestLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, paddingVertical: 4 },
  backBtn: { margin: 0 },
  appBarTitle: { color: '#fff', fontWeight: '700', flex: 1 },
  content: { padding: 12, gap: 12, paddingBottom: 24 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },

  // Latest card
  latestCard: { borderRadius: 12, padding: 16 },
  latestDate: { opacity: 0.5, marginBottom: 12 },
  latestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  latestField: { alignItems: 'center', minWidth: 72, marginBottom: 4 },
  latestValue: { fontWeight: '700' },
  latestLabel: { opacity: 0.5 },
  latestNotes: { marginTop: 8, opacity: 0.6, fontStyle: 'italic' },

  // Charts
  chartsCard: { borderRadius: 12, padding: 16 },
  chartsRow: { flexDirection: 'row', justifyContent: 'space-around' },

  // History
  historyCard: { borderRadius: 10, padding: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start' },
  historyDate: { fontWeight: '600', marginBottom: 4 },
  historyFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  historyChip: { fontSize: 12, opacity: 0.7, backgroundColor: 'rgba(128,128,128,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  historyNotes: { fontSize: 11, opacity: 0.5, fontStyle: 'italic', marginTop: 4 },
  historyActions: { flexDirection: 'row', alignItems: 'center' },

  emptyCard: { borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { opacity: 0.5, fontSize: 15, fontWeight: '600' },
  emptySubText: { opacity: 0.4, fontSize: 13, marginTop: 4 },

  fab: { position: 'absolute', right: 16, bottom: 24 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 4, paddingTop: 12 },
  modalTitle: { fontWeight: '700' },
  modalContent: { padding: 16, gap: 8, paddingBottom: 40 },
  twoCol: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  saveBtn: { marginTop: 8 },
  photoBtn: { marginTop: 4 },
  photoThumb: { width: '100%', height: 180, borderRadius: 8, marginTop: 8 },
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerImage: { width: '100%', height: '80%' },
  photoViewerClose: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 16,
  },
});
