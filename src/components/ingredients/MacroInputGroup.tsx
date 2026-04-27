import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text, HelperText } from 'react-native-paper';
import { MacroSet } from '@/utils/macroCalculations';

interface Props {
  values: MacroSet;
  onChange: (field: keyof MacroSet, value: string) => void;
  errors?: Partial<Record<keyof MacroSet, string>>;
}

function MacroField({
  label,
  field,
  values,
  onChange,
  errors,
}: Props & { label: string; field: keyof MacroSet }) {
  return (
    <View style={styles.fieldWrap}>
      <TextInput
        label={`${label} (g/100g)`}
        value={String(values[field] === 0 ? '' : values[field])}
        onChangeText={(v) => onChange(field, v)}
        keyboardType="decimal-pad"
        mode="outlined"
        dense
        style={styles.input}
        error={!!errors?.[field]}
      />
      {errors?.[field] ? <HelperText type="error">{errors[field]}</HelperText> : null}
    </View>
  );
}

export default function MacroInputGroup({ values, onChange, errors }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="titleSmall" style={styles.sectionHeader}>Carbohydrates</Text>
      <MacroField label="Total Carbs" field="carbs_total" values={values} onChange={onChange} errors={errors} />
      <View style={styles.subGroup}>
        <MacroField label="Sugar" field="carbs_sugar" values={values} onChange={onChange} errors={errors} />
        <MacroField label="Complex Carb" field="carbs_complex" values={values} onChange={onChange} errors={errors} />
        <MacroField label="Fiber" field="carbs_fiber" values={values} onChange={onChange} errors={errors} />
      </View>

      <Text variant="titleSmall" style={styles.sectionHeader}>Protein</Text>
      <MacroField label="Protein" field="protein" values={values} onChange={onChange} errors={errors} />

      <Text variant="titleSmall" style={styles.sectionHeader}>Fat</Text>
      <MacroField label="Total Fat" field="fat_total" values={values} onChange={onChange} errors={errors} />
      <View style={styles.subGroup}>
        <MacroField label="Unsaturated Fat" field="fat_unsaturated" values={values} onChange={onChange} errors={errors} />
        <MacroField label="Mono/Poly Saturated" field="fat_mono_poly" values={values} onChange={onChange} errors={errors} />
        <MacroField label="Trans Fat" field="fat_trans" values={values} onChange={onChange} errors={errors} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  sectionHeader: { marginTop: 12, marginBottom: 4, fontWeight: '600', opacity: 0.7 },
  subGroup: { paddingLeft: 12, gap: 4 },
  fieldWrap: {},
  input: { marginBottom: 2 },
});
