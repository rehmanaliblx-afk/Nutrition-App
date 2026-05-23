import React, { useEffect, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { FAB, Text, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@/navigation/types';
import { useSupplements } from '@/hooks/useSupplements';
import { useDatabase } from '@/context/DatabaseContext';
import EmptyState from '@/components/common/EmptyState';

type Props = NativeStackScreenProps<MoreStackParamList, 'Supplements'>;

export default function SupplementsScreen({ navigation }: Props) {
  const { isReady } = useDatabase();
  const { supplements, loading, load } = useSupplements();

  const refresh = useCallback(() => {
    if (isReady) load();
  }, [isReady, load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', refresh);
    return unsub;
  }, [navigation, refresh]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Supplement Guide Banner */}
        <TouchableOpacity onPress={() => navigation.navigate('SupplementGuide')} activeOpacity={0.8}>
          <Surface style={styles.guideBanner} elevation={2}>
            <Ionicons name="book-outline" size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={styles.guideBannerTitle}>Supplement Guide</Text>
              <Text variant="bodySmall" style={styles.guideBannerSubtitle}>
                31 supplements · categories · dosage & timing
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Surface>
        </TouchableOpacity>

        {supplements.length === 0 && !loading ? (
          <EmptyState
            icon="medkit-outline"
            title="No supplements yet"
            subtitle='Tap "+" to add your first supplement'
          />
        ) : (
          supplements.map((supplement) => (
            <Surface
              key={supplement.id}
              style={styles.card}
              elevation={1}
              onTouchEnd={() =>
                navigation.navigate('SupplementDetail', {
                  supplementId: supplement.id,
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.cardName}>
                  💊 {supplement.name}
                </Text>
                {supplement.is_daily ? (
                  <Chip compact style={styles.dailyChip} textStyle={styles.chipText}>
                    Daily
                  </Chip>
                ) : (
                  <Chip compact style={styles.cycleChip} textStyle={styles.chipText}>
                    Cycling
                  </Chip>
                )}
              </View>
              {supplement.dose ? (
                <Text variant="bodySmall" style={styles.meta}>
                  Dose: {supplement.dose}
                </Text>
              ) : null}
              {supplement.timing ? (
                <Text variant="bodySmall" style={styles.meta}>
                  Timing: {supplement.timing}
                </Text>
              ) : null}
              {!supplement.is_daily && supplement.cycling_info ? (
                <Text variant="bodySmall" style={styles.meta}>
                  Cycling: {supplement.cycling_info}
                </Text>
              ) : null}
            </Surface>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('SupplementForm', {})}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12, gap: 10, paddingBottom: 80 },
  card: { borderRadius: 12, padding: 14 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: { fontWeight: '700', flex: 1, marginRight: 8 },
  meta: { opacity: 0.6, marginTop: 2 },
  dailyChip: { backgroundColor: 'rgba(78,205,196,0.18)' },
  cycleChip: { backgroundColor: 'rgba(255,180,100,0.2)' },
  chipText: { fontSize: 11 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  guideBanner: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4ECDC4',
  },
  guideBannerTitle: { color: '#fff', fontWeight: '700' },
  guideBannerSubtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 1 },
});
