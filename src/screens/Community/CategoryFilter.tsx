import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { LessonCategory as LessonCategoryEnum } from '@/enums/lessonCategory';
import { LessonCategory } from '@/types/lesson';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const CATEGORY_META: Record<LessonCategory, { label: string; icon: string }> = {
  general: { label: 'General', icon: '✨' },
  'language-learning': { label: 'Language', icon: '🌍' },
  vocabulary: { label: 'Vocabulary', icon: '📚' },
  medical: { label: 'Medical', icon: '⚕️' },
  science: { label: 'Science', icon: '🔬' },
  history: { label: 'History', icon: '🏛️' },
  business: { label: 'Business', icon: '💼' },
  'test-prep': { label: 'Test Prep', icon: '📝' },
};

const CATEGORIES: { category: LessonCategory | 'all'; label: string; icon: string }[] = [
  { category: 'all', label: 'All', icon: '✨' },
  ...(Object.values(LessonCategoryEnum) as LessonCategory[]).map((category) => ({
    category,
    label: CATEGORY_META[category].label,
    icon: CATEGORY_META[category].icon,
  })),
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
        const isSelected = selected === cat.category;

        return (
          <AnimatedPressable
            key={cat.category}
            onPress={() => onSelect(cat.category)}
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
