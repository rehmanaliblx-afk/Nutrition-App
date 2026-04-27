import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface Props {
  label: string;
  current: number;
  goal: number | null;
  color: string;
  unit?: string;
}

export default function MacroBar({ label, current, goal, color, unit = 'g' }: Props) {
  const progress = goal && goal > 0 ? Math.min(current / goal, 1) : 0;
  const overGoal = goal != null && current > goal;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text variant="labelMedium" style={styles.label}>{label}</Text>
        <Text variant="labelSmall" style={styles.value}>
          {Math.round(current)}{unit}
          {goal != null ? ` / ${Math.round(goal)}${unit}` : ''}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: overGoal ? '#E63946' : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  label: { fontWeight: '600' },
  value: { opacity: 0.6 },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
