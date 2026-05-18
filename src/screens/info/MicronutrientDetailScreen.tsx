import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@/navigation/types';
import { MICRONUTRIENTS, CATEGORY_LABELS } from '@/constants/micronutrients';

type Props = NativeStackScreenProps<MoreStackParamList, 'MicronutrientDetail'>;

export default function MicronutrientDetailScreen({ route }: Props) {
  const nutrient = MICRONUTRIENTS.find((n) => n.id === route.params.id);

  if (!nutrient) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={styles.notFound}>Nutrient not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header card */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.bigEmoji}>{nutrient.emoji}</Text>
          <Text variant="headlineSmall" style={styles.name}>{nutrient.name}</Text>
          {nutrient.altName ? (
            <Text variant="bodyMedium" style={styles.altName}>{nutrient.altName}</Text>
          ) : null}
          <Chip compact style={styles.categoryChip} textStyle={styles.chipText}>
            {CATEGORY_LABELS[nutrient.category]}
          </Chip>
        </Surface>

        {/* Role card */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>🔬 Role & Function</Text>
          <Text variant="bodyMedium" style={styles.bodyText}>{nutrient.role}</Text>
        </Surface>

        {/* Deficiency card */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>⚠️ Deficiency Symptoms</Text>
          {nutrient.deficiency.map((symptom, idx) => (
            <Text key={idx} variant="bodyMedium" style={styles.bullet}>
              · {symptom}
            </Text>
          ))}
        </Surface>

        {/* Food sources card */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>🍽️ Food Sources</Text>
          <View style={styles.chipRow}>
            {nutrient.sources.map((source, idx) => (
              <Chip key={idx} compact style={styles.sourceChip} textStyle={styles.chipText}>
                {source}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Daily requirements card */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>📊 Daily Requirements</Text>
          <View style={styles.rdaRow}>
            <Text variant="labelMedium" style={styles.rdaLabel}>RDA</Text>
            <Text variant="bodyMedium" style={styles.rdaValue}>{nutrient.rda}</Text>
          </View>
          {nutrient.upperLimit ? (
            <View style={[styles.rdaRow, styles.rdaRowBorder]}>
              <Text variant="labelMedium" style={styles.rdaLabel}>Upper Limit</Text>
              <Text variant="bodyMedium" style={styles.rdaValue}>{nutrient.upperLimit}</Text>
            </View>
          ) : null}
        </Surface>

        {/* Pro tip card */}
        {nutrient.tip ? (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.cardTitle}>💡 Pro Tip</Text>
            <Text variant="bodyMedium" style={styles.tipText}>{nutrient.tip}</Text>
          </Surface>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12, gap: 12, paddingBottom: 32 },
  notFound: { padding: 24, textAlign: 'center', opacity: 0.5 },
  card: { borderRadius: 12, padding: 16 },
  bigEmoji: { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  name: { fontWeight: 'bold', textAlign: 'center' },
  altName: { textAlign: 'center', opacity: 0.6, marginTop: 4 },
  categoryChip: { alignSelf: 'center', marginTop: 10 },
  chipText: { fontSize: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 10 },
  bodyText: { lineHeight: 22, opacity: 0.85 },
  bullet: { lineHeight: 24, paddingLeft: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  sourceChip: { backgroundColor: 'rgba(78,205,196,0.12)' },
  rdaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6 },
  rdaRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)' },
  rdaLabel: { opacity: 0.55, flex: 1 },
  rdaValue: { flex: 3, textAlign: 'right', opacity: 0.9 },
  tipText: { lineHeight: 22, fontStyle: 'italic', opacity: 0.85 },
});
