import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { LessonForm } from '@/types/lesson';
import { BookOpen, Edit3, Globe, Layers, Lock, Users } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { StepNavigationFooter } from '../../../components/StepNavigationFooter';

interface Props {
  form: LessonForm;
  onEditInfo: () => void;
  onEditWords: () => void;
  onSave: (lesson: LessonForm) => void;
}

export function ReviewSummaryStep({ form, onEditInfo, onEditWords, onSave }: Props) {
  // Metadata for the Privacy Badge
  const privacyMeta = {
    private: { icon: Lock, color: '#64748b', bg: '#f1f5f9' },
    shared: { icon: Users, color: '#0891b2', bg: '#ecfeff' },
    public: { icon: Globe, color: '#059669', bg: '#ecfdf5' },
  }[form.privacy || 'private'];

  const PrivacyIcon = privacyMeta.icon;

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View className="py-6">
          <Text className="text-2xl font-black text-slate-800">Final Review</Text>
          <Text className="text-slate-500">Double check everything before saving.</Text>
        </View>

        {/* Lesson Info Card */}
        <View className="mb-6 rounded-3xl border border-slate-100 bg-slate-50/50 p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <BookOpen size={18} color={Colors.teal600} />
              <Text className="text-xs font-black uppercase tracking-widest text-slate-400">
                Lesson Info
              </Text>
            </View>
            <AnimatedPressable onPress={onEditInfo} className="rounded-full bg-white p-2 shadow-sm">
              <Edit3 size={16} color={Colors.teal600} />
            </AnimatedPressable>
          </View>

          <Text className="text-xl font-bold text-slate-900">{form.title}</Text>

          {form.description ? (
            <Text className="mt-2 leading-5 text-slate-500">{form.description}</Text>
          ) : null}

          <View className="mt-4 flex-row flex-wrap gap-2">
            {/* Privacy Badge */}
            <View
              style={{ backgroundColor: privacyMeta.bg }}
              className="flex-row items-center gap-1.5 rounded-full px-3 py-1">
              <PrivacyIcon size={12} color={privacyMeta.color} />
              <Text
                style={{ color: privacyMeta.color }}
                className="text-[10px] font-black uppercase">
                {form.privacy}
              </Text>
            </View>

            {form.category && (
              <View className="rounded-full bg-slate-200 px-3 py-1">
                <Text className="text-[10px] font-black uppercase text-slate-600">
                  {form.category}
                </Text>
              </View>
            )}

            {form.tag && (
              <View className="rounded-full bg-slate-200 px-3 py-1">
                <Text className="text-[10px] font-black uppercase text-slate-600">{form.tag}</Text>
              </View>
            )}

            <View className="rounded-full bg-slate-100 px-3 py-1">
              <Text className="text-[10px] font-black uppercase text-slate-600">
                {form.isCustom ? 'Custom Lesson' : 'Preset Lesson'}
              </Text>
            </View>

            <View className="rounded-full bg-slate-100 px-3 py-1">
              <Text className="text-[10px] font-black uppercase text-slate-600">
                {form.words.length} Word{form.words.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Words Summary Card */}
        <View className="mb-10 rounded-3xl border border-slate-100 bg-slate-50/50 p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Layers size={18} color={Colors.teal600} />
              <Text className="text-xs font-black uppercase tracking-widest text-slate-400">
                Vocabulary ({form.words.length})
              </Text>
            </View>
            <AnimatedPressable
              onPress={onEditWords}
              className="rounded-full bg-white p-2 shadow-sm">
              <Edit3 size={16} color={Colors.teal600} />
            </AnimatedPressable>
          </View>

          <View className="flex-col gap-3">
            {form.words.length === 0 && (
              <Text className="italic text-slate-400">No words added yet.</Text>
            )}

            {form.words.map((w, index) => (
              <View
                key={index}
                className="flex-row items-center rounded-2xl border border-teal-100 bg-white p-4 shadow-sm"
                style={{ elevation: 1 }}>
                {/* Left color indicator */}
                <View className="mr-3 h-10 w-1 rounded-full bg-teal-500" />

                {/* Word details */}
                <View className="flex-1">
                  <Text className="text-lg font-extrabold text-slate-900">{w.text}</Text>
                  {w.translation && (
                    <Text className="mt-1 text-sm italic text-slate-500">
                      Translation: {w.translation}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <StepNavigationFooter nextLabel="Save" onNext={() => onSave(form)} />
    </View>
  );
}
