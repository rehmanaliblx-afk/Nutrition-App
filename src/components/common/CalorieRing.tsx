import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  current: number;
  goal: number | null;
  size?: number;
}

export default function CalorieRing({ current, goal, size = 160 }: Props) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal && goal > 0 ? Math.min(current / goal, 1) : 0;
  const dashOffset = circumference * (1 - progress);
  const color = goal != null && current > goal ? '#E63946' : '#FF6B6B';
  const remaining = goal != null ? Math.max(goal - current, 0) : null;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text variant="headlineMedium" style={[styles.kcalNum, { color }]}>
          {Math.round(current)}
        </Text>
        <Text variant="labelSmall" style={styles.kcalLabel}>kcal</Text>
        {goal != null && (
          <Text variant="labelSmall" style={styles.remaining}>
            {remaining != null && remaining > 0
              ? `${Math.round(remaining)} left`
              : current > goal
              ? `${Math.round(current - goal)} over`
              : 'goal met!'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  kcalNum: { fontWeight: 'bold' },
  kcalLabel: { opacity: 0.5, marginTop: -4 },
  remaining: { opacity: 0.6, marginTop: 2 },
});
