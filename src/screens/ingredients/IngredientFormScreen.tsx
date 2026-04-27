import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';

    if (macros.carbs_sugar + macros.carbs_complex + macros.carbs_fiber > macros.carbs_total + 0.01) {
      newErrors.carbs_total = 'Sub-macros exceed total carbs';
    }
    if (macros.fat_unsaturated + macros.fat_mono_poly + macros.fat_trans > macros.fat_total + 0.01) {
      newErrors.fat_total = 'Sub-macros exceed total fat';
    }

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
        <TextInput
          label="Ingredient Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          error={!!errors.name}
          style={styles.nameInput}
        />
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

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
          icon="content-save"
        >
          {ingredientId ? 'Update Ingredient' : 'Save Ingredient'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 4, paddingBottom: 32 },
  nameInput: { marginBottom: 4 },
  kcalRow: { paddingVertical: 8 },
  kcalText: { opacity: 0.7 },
  kcalValue: { fontWeight: 'bold', opacity: 1 },
  divider: { marginVertical: 8 },
  macroTitle: { fontWeight: '600', marginBottom: 4 },
  saveBtn: { marginTop: 24 },
});
