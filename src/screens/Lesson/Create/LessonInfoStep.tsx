import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { LessonCategory } from '@/enums/lessonCategory';
import { LessonForm } from '@/types/lesson';
import { Globe, Lock } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StepNavigationFooter } from '../../../components/StepNavigationFooter';

type LessonInfo = Omit<LessonForm, 'words'>;

interface Props {
  value: LessonInfo;
  onChange: (value: LessonInfo) => void;
  onNext: () => void;
}

export function LessonInfoStep({ value, onChange, onNext }: Props) {
  const [localForm, setLocalForm] = useState<LessonInfo>(value);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [tempTitle, setTempTitle] = useState(value.title);
  const [tempDescription, setTempDescription] = useState(value.description);
  const [tempCategory, setTempCategory] = useState(value.category);
  const [tempTags, setTempTags] = useState<string[]>(value.tag ?? []);
  const [tagInput, setTagInput] = useState('');

  const textToTags = (text: string) =>
    text
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const addTag = (text: string) => {
    const cleaned = text.trim();
    if (cleaned && !tempTags.includes(cleaned)) {
      const newTags = [...tempTags, cleaned];
      setTempTags(newTags);
      updateLocal({ tag: newTags });
    }
    setTagInput('');
  };

  const handleTagInputChange = (text: string) => {
    // If user pastes or types comma, split and add all tags at once
    if (text.includes(',')) {
      const tagsToAdd = textToTags(text);
      const newTags = [...tempTags];

      tagsToAdd.forEach((tag) => {
        if (tag && !newTags.includes(tag)) {
          newTags.push(tag);
        }
      });

      setTempTags(newTags);
      updateLocal({ tag: newTags });
      setTagInput('');
    } else {
      setTagInput(text);
    }
  };

  const descRef = useRef<TextInput>(null);

  const canContinue = localForm.title.trim().length > 1;

  const updateLocal = (patch: Partial<LessonInfo>) => {
    setLocalForm((prev) => ({ ...prev, ...patch }));
  };

  const handleNext = () => {
    onChange(localForm);
    onNext();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-black text-slate-700">General Info</Text>
            <Text className="mt-1 text-sm text-slate-500">
              Set the foundation for your memory palace.
            </Text>
          </View>

          {/* Card */}
          <View className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            {/* Title */}
            <View className="mb-5">
              <View className="mb-2 flex-row items-center justify-between px-1">
                <Text className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Lesson Title *
                </Text>
                <Text className="text-xs text-slate-400">{tempTitle.length}/40</Text>
              </View>

              <TextInput
                value={tempTitle}
                maxLength={40}
                placeholder="e.g., Periodic Table Elements"
                placeholderTextColor="#94a3b8"
                onChangeText={setTempTitle}
                onFocus={() => setFocusedField('title')}
                onBlur={() => {
                  setFocusedField(null);
                  updateLocal({ title: tempTitle });
                }}
                returnKeyType="next"
                onSubmitEditing={() => {
                  updateLocal({ title: tempTitle });
                  descRef.current?.focus();
                }}
                className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-700"
                style={focusedField === 'title' ? styles.inputFocused : undefined}
              />
            </View>

            {/* Description */}
            <View className="mb-5">
              <Text className="mb-2 px-1 text-xs font-black uppercase tracking-widest text-slate-400">
                Description
              </Text>

              <TextInput
                ref={descRef}
                multiline
                value={tempDescription}
                placeholder="What will you memorize in this lesson?"
                placeholderTextColor="#94a3b8"
                onChangeText={setTempDescription}
                onFocus={() => setFocusedField('desc')}
                onBlur={() => {
                  setFocusedField(null);
                  updateLocal({ description: tempDescription });
                }}
                className="min-h-[80px] rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-700"
                style={focusedField === 'desc' ? styles.inputFocused : undefined}
              />
            </View>

            {/* Category */}
            <View className="mb-5">
              <Text className="mb-3 px-1 text-xs font-black uppercase tracking-widest text-slate-400">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(Object.values(LessonCategory) as LessonCategory[]).map((c) => (
                  <AnimatedPressable
                    key={c}
                    onPress={() => {
                      setTempCategory(c);
                      updateLocal({ category: c });
                    }}
                    className={`rounded-xl px-5 py-3 ${
                      tempCategory === c ? 'bg-teal-500' : 'bg-slate-200'
                    }`}>
                    <Text
                      className={`text-sm font-semibold ${tempCategory === c ? 'text-white' : 'text-slate-700'}`}>
                      {c}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
            </View>

            {/* Tags */}
            <View>
              <Text className="mb-3 px-1 text-xs font-black uppercase tracking-widest text-slate-400">
                Tags
              </Text>
              <View className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                {tempTags.length > 0 && (
                  <View className="mb-2 flex-row flex-wrap gap-2">
                    {tempTags.map((tag, idx) => (
                      <View
                        key={idx}
                        className="flex-row items-center gap-2 rounded-full bg-teal-100 px-3 py-1.5">
                        <Text className="text-xs font-semibold text-teal-700">{tag}</Text>
                        <AnimatedPressable
                          onPress={() => {
                            const newTags = tempTags.filter((_, i) => i !== idx);
                            setTempTags(newTags);
                            updateLocal({ tag: newTags });
                          }}>
                          <Text className="text-lg font-bold text-teal-700">x</Text>
                        </AnimatedPressable>
                      </View>
                    ))}
                  </View>
                )}
                <TextInput
                  value={tagInput}
                  placeholder={
                    tempTags.length === 0 ? 'Add tags (press Enter or comma)' : 'Add more tags...'
                  }
                  placeholderTextColor="#94a3b8"
                  onChangeText={handleTagInputChange}
                  onSubmitEditing={() => addTag(tagInput)}
                  onFocus={() => setFocusedField('tags')}
                  onBlur={() => {
                    setFocusedField(null);
                    if (tagInput.trim()) {
                      addTag(tagInput);
                    }
                  }}
                  className="text-sm text-slate-700"
                  style={focusedField === 'tags' ? styles.inputFocused : undefined}
                />
              </View>
            </View>
          </View>

          {/* Privacy */}
          <View className="mt-8">
            <Text className="mb-3 px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Privacy Setting
            </Text>

            {(['private', 'public'] as const).map((p) => (
              <PrivacyCard
                key={p}
                type={p}
                isActive={localForm.privacy === p}
                onSelect={() => updateLocal({ privacy: p })}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <StepNavigationFooter
        disableNext={!canContinue}
        nextLabel="Next: Add Words"
        onNext={handleNext}
      />
    </KeyboardAvoidingView>
  );
}

/* ---------------- Privacy Card ---------------- */

interface PrivacyCardProps {
  type: 'private' | 'public';
  isActive: boolean;
  onSelect: () => void;
}

const PrivacyCard = React.memo(({ type, isActive, onSelect }: PrivacyCardProps) => {
  const meta = {
    private: {
      icon: Lock,
      label: 'Private',
      desc: 'Only you can see this.',
    },
    public: {
      icon: Globe,
      label: 'Public',
      desc: 'Your lesson will appear in the Community Library for others to discover and import.',
    },
  }[type];

  const Icon = meta.icon;

  return (
    <AnimatedPressable
      onPress={onSelect}
      className={`mb-3 flex-row items-center gap-4 rounded-2xl border-2 p-4 ${
        isActive ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-white'
      }`}>
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={isActive ? styles.iconActive : styles.iconInactive}>
        <Icon size={20} color={isActive ? 'white' : Colors.slate400} />
      </View>

      <View className="flex-1">
        <Text className={`text-sm font-bold ${isActive ? 'text-teal-900' : 'text-slate-700'}`}>
          {meta.label}
        </Text>
        <Text className="mt-0.5 text-xs text-slate-400">{meta.desc}</Text>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  inputFocused: {
    borderColor: '#14b8a6',
  },
  iconActive: {
    backgroundColor: '#14b8a6',
  },
  iconInactive: {
    backgroundColor: '#f1f5f9',
  },
  buttonActive: {
    backgroundColor: '#0d9488',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#e2e8f0',
  },
});
