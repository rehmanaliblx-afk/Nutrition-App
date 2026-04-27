import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Divider, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoals } from '@/hooks/useGoals';
import { todayString } from '@/utils/dateUtils';
import { DailyGoalInput } from '@/db/schema';

interface Props {
  onSaved?: () => void;
}

function parseGoal(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) || n <= 0 ? null : n;
}

export default function GoalsScreen({ onSaved }: Props) {
  const today = todayString();
  const { goal, loading, load, save } = useGoals();

  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load(today);
  }, [load, today]);

  useEffect(() => {
    if (goal) {
      setKcal(goal.kcal_goal != null ? String(goal.kcal_goal) : '');
      setProtein(goal.protein_goal != null ? String(goal.protein_goal) : '');
      setCarbs(goal.carbs_goal != null ? String(goal.carbs_goal) : '');
      setFat(goal.fat_goal != null ? String(goal.fat_goal) : '');
    }
  }, [goal]);

  const handleSave = async () => {
    if (!kcal.trim()) {
      Alert.alert('Required', 'Please set a daily calorie goal.');
      return;
    }
    setSaving(true);
    try {
      const input: DailyGoalInput = {
        date: today,
        kcal_goal: parseGoal(kcal),
        protein_goal: parseGoal(protein),
        carbs_goal: parseGoal(carbs),
        fat_goal: parseGoal(fat),
      };
      await save(input);
      onSaved?.();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>Daily Goals</Text>
        <HelperText type="info" visible>
          Goals apply from today onwards until you change them.
        </HelperText>
        <Divider style={styles.divider} />

        <TextInput
          label="Calorie Goal (kcal) *"
          value={kcal}
          onChangeText={setKcal}
          keyboardType="decimal-pad"
          mode="outlined"
        />
        <TextInput
          label="Protein Goal (g)"
          value={protein}
          onChangeText={setProtein}
          keyboardType="decimal-pad"
          mode="outlined"
        />
        <TextInput
          label="Carbs Goal (g)"
          value={carbs}
          onChangeText={setCarbs}
          keyboardType="decimal-pad"
          mode="outlined"
        />
        <TextInput
          label="Fat Goal (g)"
          value={fat}
          onChangeText={setFat}
          keyboardType="decimal-pad"
          mode="outlined"
        />

        <Button mode="contained" onPress={handleSave} loading={saving || loading} icon="flag-checkered" style={styles.btn}>
          Save Goals
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  title: { fontWeight: 'bold' },
  divider: { marginVertical: 8 },
  btn: { marginTop: 16 },
});
