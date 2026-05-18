import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert, Modal } from 'react-native';
import { TextInput, Button, Text, HelperText, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IngredientsStackParamList } from '@/navigation/types';
import { useIngredients } from '@/hooks/useIngredients';
import { getIngredientById } from '@/db/ingredientsDao';
import MacroInputGroup from '@/components/ingredients/MacroInputGroup';
import { MacroSet, EMPTY_MACROS, calcKcal, roundMacro } from '@/utils/macroCalculations';
import { IngredientInput } from '@/db/schema';

type Props = NativeStackScreenProps<IngredientsStackParamList, 'IngredientForm'>;

function parseMacro(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) || n < 0 ? 0 : n;
}

export default function IngredientFormScreen({ route, navigation }: Props) {
  const { ingredientId } = route.params ?? {};
  const { create, update } = useIngredients();

  const [name, setName] = useState('');
  const [macros, setMacros] = useState<MacroSet>({ ...EMPTY_MACROS });
  const [macroStrings, setMacroStrings] = useState<Record<keyof MacroSet, string>>(
    Object.fromEntries(Object.keys(EMPTY_MACROS).map((k) => [k, ''])) as Record<keyof MacroSet, string>
  );
  const [errors, setErrors] = useState<Partial<Record<keyof MacroSet | 'name', string>>>({});
  const [saving, setSaving] = useState(false);

  // Barcode scanner
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);

  useEffect(() => {
    if (!ingredientId) return;
    getIngredientById(ingredientId).then((ing) => {
      if (!ing) return;
      setName(ing.name);
      const keys = Object.keys(EMPTY_MACROS) as (keyof MacroSet)[];
      const strs = Object.fromEntries(keys.map((k) => [k, String(ing[k])])) as Record<keyof MacroSet, string>;
      setMacroStrings(strs);
      setMacros({ ...ing });
    });
  }, [ingredientId]);

  const handleMacroChange = (field: keyof MacroSet, value: string) => {
    setMacroStrings((prev) => ({ ...prev, [field]: value }));
    setMacros((prev) => ({ ...prev, [field]: parseMacro(value) }));
  };

  const applyMacros = (m: MacroSet, productName: string) => {
    if (productName && !name) setName(productName);
    setMacros(m);
    const strs = Object.fromEntries(
      Object.entries(m).map(([k, v]) => [k, (v as number) > 0 ? String(parseFloat((v as number).toFixed(6))) : ''])
    ) as Record<keyof MacroSet, string>;
    setMacroStrings(strs);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is needed to scan barcodes.');
        return;
      }
    }
    setScanning(true);
    setScannerVisible(true);
  };

  const handleBarcode = async ({ data: barcode }: { data: string }) => {
    if (!scanning || fetchingProduct) return;
    setScanning(false);
    setFetchingProduct(true);
    setScannerVisible(false);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const json = await res.json() as { status: number; product?: Record<string, unknown> };
      if (json.status !== 1 || !json.product) {
        Alert.alert('Not Found', 'Product not found in Open Food Facts database. Enter macros manually.');
        return;
      }
      const p = json.product;
      const n = (p.nutriments ?? {}) as Record<string, number>;
      const productName = String(p.product_name ?? '');
      applyMacros(
        {
          protein: (n.proteins_100g ?? 0) / 100,
          carbs_total: (n.carbohydrates_100g ?? 0) / 100,
          carbs_sugar: (n.sugars_100g ?? 0) / 100,
          carbs_complex: 0,
          carbs_fiber: (n.fiber_100g ?? 0) / 100,
          fat_total: (n.fat_100g ?? 0) / 100,
          fat_unsaturated: 0,
          fat_mono_poly: 0,
          fat_trans: (n['trans-fat_100g'] ?? 0) / 100,
        },
        productName
      );
      Alert.alert('Product Loaded', `"${productName || barcode}" macros filled in. Please verify the values.`);
    } catch {
      Alert.alert('Error', 'Failed to fetch product data. Check your internet connection.');
    } finally {
      setFetchingProduct(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (macros.carbs_sugar + macros.carbs_complex + macros.carbs_fiber > macros.carbs_total + 0.01)
      newErrors.carbs_total = 'Sub-macros exceed total carbs';
    if (macros.fat_unsaturated + macros.fat_mono_poly + macros.fat_trans > macros.fat_total + 0.01)
      newErrors.fat_total = 'Sub-macros exceed total fat';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const input: IngredientInput = { name: name.trim(), ...macros };
      if (ingredientId) {
        await update(ingredientId, input);
      } else {
        await create(input);
      }
      navigation.goBack();
    } catch (e) {
      const msg = String(e);
      if (msg.includes('UNIQUE')) {
        Alert.alert('Error', `An ingredient named "${name.trim()}" already exists.`);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const kcalPreview = roundMacro(calcKcal(macros), 1);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.nameRow}>
          <TextInput
            label="Ingredient Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            error={!!errors.name}
            style={styles.nameInput}
          />
          <Button
            mode="outlined"
            icon={fetchingProduct ? undefined : 'barcode-scan'}
            onPress={openScanner}
            style={styles.scanBtn}
            disabled={fetchingProduct}
          >
            {fetchingProduct ? <ActivityIndicator size={16} /> : 'Scan'}
          </Button>
        </View>
        {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}

        <View style={styles.kcalRow}>
          <Text variant="bodyLarge" style={styles.kcalText}>
            Preview: <Text style={styles.kcalValue}>{kcalPreview} kcal</Text> per gram
          </Text>
        </View>

        <Divider style={styles.divider} />
        <Text variant="titleMedium" style={styles.macroTitle}>Macros (per gram)</Text>

        <MacroInputGroup
          values={macroStrings as unknown as MacroSet}
          onChange={handleMacroChange}
          errors={errors as Partial<Record<keyof MacroSet, string>>}
        />

        <Button mode="contained" onPress={handleSave} loading={saving} style={styles.saveBtn} icon="content-save">
          {ingredientId ? 'Update Ingredient' : 'Save Ingredient'}
        </Button>
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => { setScannerVisible(false); setScanning(false); }}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanning ? handleBarcode : undefined}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Point camera at barcode</Text>
            <Button
              mode="contained"
              onPress={() => { setScannerVisible(false); setScanning(false); }}
              style={styles.closeScanBtn}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 4, paddingBottom: 32 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: { flex: 1 },
  scanBtn: { marginTop: 6 },
  kcalRow: { paddingVertical: 8 },
  kcalText: { opacity: 0.7 },
  kcalValue: { fontWeight: 'bold', opacity: 1 },
  divider: { marginVertical: 8 },
  macroTitle: { fontWeight: '600', marginBottom: 4 },
  saveBtn: { marginTop: 24 },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scannerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  scanFrame: {
    width: 250, height: 150, borderWidth: 3, borderColor: '#4ECDC4',
    borderRadius: 12, backgroundColor: 'transparent',
  },
  scanHint: { color: '#fff', marginTop: 16, fontSize: 16, textShadowColor: '#000', textShadowRadius: 4 },
  closeScanBtn: { marginTop: 32 },
});
