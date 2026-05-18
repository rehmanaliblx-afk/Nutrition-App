import React, { useEffect, useState, useLayoutEffect } from 'react';
import { ScrollView, View, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Surface, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@/navigation/types';
import { useSupplements } from '@/hooks/useSupplements';
import { Supplement } from '@/db/schema';

type Props = NativeStackScreenProps<MoreStackParamList, 'SupplementDetail'>;

export default function SupplementDetailScreen({ route, navigation }: Props) {
  const { supplementId } = route.params;
  const { getById } = useSupplements();
  const [supplement, setSupplement] = useState<Supplement | null>(null);

  useEffect(() => {
    getById(supplementId).then((s) => setSupplement(s));
  }, [supplementId, getById]);

  useLayoutEffect(() => {
    if (!supplement) return;
    navigation.setOptions({
      title: supplement.name,
      headerRight: () => (
        <Button
          compact
          mode="text"
          icon="pencil"
          onPress={() =>
            navigation.navigate('SupplementForm', { supplementId })
          }
        >
          Edit
        </Button>
      ),
    });
  }, [supplement, navigation, supplementId]);

  if (!supplement) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={styles.notFound}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const handleOpenUrl = async () => {
    if (!supplement.purchase_url) return;
    const url = supplement.purchase_url.startsWith('http')
      ? supplement.purchase_url
      : `https://${supplement.purchase_url}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot open URL', url);
      }
    } catch {
      Alert.alert('Error', 'Failed to open the URL.');
    }
  };

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | null | undefined;
  }) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Text variant="labelMedium" style={styles.infoLabel}>{label}</Text>
        <Text variant="bodyMedium" style={styles.infoValue}>{value}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.headerRow}>
            <Text variant="headlineSmall" style={styles.name}>
              💊 {supplement.name}
            </Text>
            <Chip
              compact
              style={supplement.is_daily ? styles.dailyChip : styles.cycleChip}
              textStyle={styles.chipText}
            >
              {supplement.is_daily ? 'Daily' : 'Cycling'}
            </Chip>
          </View>
          {supplement.role ? (
            <Text variant="bodyMedium" style={styles.roleText}>
              {supplement.role}
            </Text>
          ) : null}
        </Surface>

        {/* Dosing */}
        {(supplement.dose || supplement.timing) ? (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.cardTitle}>⏱️ Dosing</Text>
            <InfoRow label="Dose" value={supplement.dose} />
            <InfoRow label="Timing" value={supplement.timing} />
            {!supplement.is_daily && supplement.cycling_info ? (
              <InfoRow label="Cycling protocol" value={supplement.cycling_info} />
            ) : null}
          </Surface>
        ) : null}

        {/* Product Info */}
        {(supplement.brand_notes || supplement.price_info || supplement.purchase_url) ? (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.cardTitle}>🛒 Product Info</Text>
            <InfoRow label="Brand / Notes" value={supplement.brand_notes} />
            <InfoRow label="Price" value={supplement.price_info} />
            {supplement.purchase_url ? (
              <View style={styles.urlRow}>
                <Text variant="labelMedium" style={styles.infoLabel}>Purchase URL</Text>
                <Button
                  mode="outlined"
                  compact
                  icon="open-in-new"
                  onPress={handleOpenUrl}
                  style={styles.urlBtn}
                >
                  Open Link
                </Button>
              </View>
            ) : null}
          </Surface>
        ) : null}

        {/* Personal Notes */}
        {supplement.personal_notes ? (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.cardTitle}>📝 Personal Notes</Text>
            <Text variant="bodyMedium" style={styles.notesText}>
              {supplement.personal_notes}
            </Text>
          </Surface>
        ) : null}

        {/* Added date */}
        <Text variant="bodySmall" style={styles.addedDate}>
          Added: {new Date(supplement.created_at).toLocaleDateString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12, gap: 12, paddingBottom: 32 },
  notFound: { padding: 24, textAlign: 'center', opacity: 0.5 },
  card: { borderRadius: 12, padding: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { fontWeight: 'bold', flex: 1 },
  roleText: { opacity: 0.7, marginTop: 6, lineHeight: 20 },
  dailyChip: { backgroundColor: 'rgba(78,205,196,0.18)' },
  cycleChip: { backgroundColor: 'rgba(255,180,100,0.2)' },
  chipText: { fontSize: 11 },
  cardTitle: { fontWeight: '700', marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  infoLabel: { opacity: 0.5, flex: 1 },
  infoValue: { flex: 2, textAlign: 'right' },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  urlBtn: { borderRadius: 8 },
  notesText: { lineHeight: 22, opacity: 0.85 },
  addedDate: { textAlign: 'center', opacity: 0.35, paddingVertical: 4 },
});
