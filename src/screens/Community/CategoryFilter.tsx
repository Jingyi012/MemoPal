import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { LessonCategory } from '@/types/community';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const CATEGORIES: { id: LessonCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'language-learning', label: 'Language', icon: '🌍' },
  { id: 'vocabulary', label: 'Vocabulary', icon: '📚' },
  { id: 'medical', label: 'Medical', icon: '⚕️' },
  { id: 'business', label: 'Business', icon: '💼' },
];

interface Props {
  selected: LessonCategory | 'all';
  onSelect: (id: LessonCategory | 'all') => void;
}

export const CategoryFilter: React.FC<Props> = ({ selected, onSelect }) => (
  <View style={styles.wrapper}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.id;

        return (
          <AnimatedPressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[styles.chip, isSelected ? styles.chipActive : styles.chipInactive]}>
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text style={[styles.label, isSelected && styles.labelActive]}>{cat.label}</Text>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
  },
  chipActive: {
    backgroundColor: Colors.teal600,
  },
  chipInactive: {
    backgroundColor: '#f1f5f9',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: '#475569',
    fontSize: 14,
  },
  labelActive: {
    color: Colors.white,
    fontWeight: '700',
  },
});
