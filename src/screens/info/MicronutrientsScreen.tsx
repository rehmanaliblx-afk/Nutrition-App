import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Searchbar, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@/navigation/types';
import {
  MICRONUTRIENTS,
  CATEGORY_LABELS,
  NutrientCategory,
  Micronutrient,
} from '@/constants/micronutrients';

type Props = NativeStackScreenProps<MoreStackParamList, 'Micronutrients'>;

const CATEGORY_ORDER: NutrientCategory[] = [
  'fat_vitamin',
  'water_vitamin',
  'macromineral',
  'trace_mineral',
];

export default function MicronutrientsScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');

  const filtered = MICRONUTRIENTS.filter((n) => {
    const q = query.toLowerCase();
    return (
      n.name.toLowerCase().includes(q) ||
      (n.altName?.toLowerCase().includes(q) ?? false)
    );
  });

  const renderItem = (item: Micronutrient) => (
    <List.Item
      key={item.id}
      title={item.name}
      description={item.altName}
      left={() => (
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
      )}
      right={(p) => <List.Icon {...p} icon="chevron-right" />}
      onPress={() => navigation.navigate('MicronutrientDetail', { id: item.id })}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Searchbar
        placeholder="Search vitamins & minerals..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {query.trim()
          ? filtered.map(renderItem)
          : CATEGORY_ORDER.map((cat) => {
              const items = MICRONUTRIENTS.filter((n) => n.category === cat);
              return (
                <View key={cat}>
                  <List.Subheader style={styles.subheader}>
                    {CATEGORY_LABELS[cat]}
                  </List.Subheader>
                  {items.map(renderItem)}
                </View>
              );
            })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { margin: 8 },
  content: { paddingBottom: 32 },
  subheader: { fontWeight: '700' },
  emojiContainer: { justifyContent: 'center', paddingLeft: 8, paddingRight: 4 },
  emoji: { fontSize: 24 },
});
