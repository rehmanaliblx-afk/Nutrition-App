import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { SUPPLEMENT_GUIDE, SUPPLEMENT_CATEGORIES, SupplementGuideEntry } from '@/constants/supplementGuide';

type Props = NativeStackScreenProps<NutritionStackParamList, 'SupplementGuide'>;

function SupplementCard({ entry }: { entry: SupplementGuideEntry }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{entry.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={[styles.cardName, { color: theme.colors.onSurface }]}>
              {entry.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {entry.shortDesc}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          <Divider style={{ marginVertical: 10 }} />

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
              <Text variant="labelMedium" style={[styles.detailLabel, { color: '#4CAF50' }]}>Benefits</Text>
            </View>
            {entry.benefits.map((b, i) => (
              <Text key={i} variant="bodySmall" style={[styles.bullet, { color: theme.colors.onSurface }]}>
                • {b}
              </Text>
            ))}
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Ionicons name="scale-outline" size={16} color={theme.colors.primary} />
              <Text variant="labelMedium" style={[styles.detailLabel, { color: theme.colors.primary }]}>
                Dosage
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurface, marginLeft: 22 }}>
              {entry.dosage}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color="#FF9800" />
              <Text variant="labelMedium" style={[styles.detailLabel, { color: '#FF9800' }]}>Timing</Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurface, marginLeft: 22 }}>
              {entry.timing}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Ionicons name="warning-outline" size={16} color="#FF5722" />
              <Text variant="labelMedium" style={[styles.detailLabel, { color: '#FF5722' }]}>
                Side Effects / Notes
              </Text>
            </View>
            {entry.sideEffects.map((s, i) => (
              <Text key={i} variant="bodySmall" style={[styles.bullet, { color: theme.colors.onSurfaceVariant }]}>
                • {s}
              </Text>
            ))}
          </View>

          <View style={[styles.tipBox, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="bulb-outline" size={14} color={theme.colors.primary} />
            <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 6 }}>
              {entry.tip}
            </Text>
          </View>
        </>
      )}
    </Surface>
  );
}

export default function SupplementGuideScreen({ navigation }: Props) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = selectedCategory
    ? SUPPLEMENT_GUIDE.filter((s) => s.category === selectedCategory)
    : SUPPLEMENT_GUIDE;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text variant="titleMedium" style={styles.headerTitle}>Supplement Guide</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Chip
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={styles.catChip}
            textStyle={styles.catChipText}
          >
            All
          </Chip>
          {SUPPLEMENT_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
              style={styles.catChip}
              textStyle={styles.catChipText}
            >
              {cat}
            </Chip>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodySmall" style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
          For informational purposes only. Consult a healthcare professional before starting any supplement.
        </Text>

        {filtered.map((entry) => (
          <SupplementCard key={entry.id} entry={entry} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontWeight: '700', flex: 1 },
  categoryRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  catChip: { backgroundColor: 'rgba(255,255,255,0.2)' },
  catChipText: { color: '#fff', fontSize: 12 },
  content: { padding: 14, gap: 10, paddingBottom: 40 },
  disclaimer: { textAlign: 'center', fontStyle: 'italic', marginBottom: 4 },
  card: { borderRadius: 14, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 26 },
  cardName: { fontWeight: '700' },
  detailSection: { marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailLabel: { fontWeight: '700' },
  bullet: { marginLeft: 22, lineHeight: 20 },
  tipBox: { flexDirection: 'row', borderRadius: 10, padding: 10, marginTop: 4, alignItems: 'flex-start' },
});
