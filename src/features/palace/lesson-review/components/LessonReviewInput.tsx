import React from 'react';
import { Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Props = {
  inputRef: React.RefObject<TextInput | null>;
  value: string;
  onChange: (text: string) => void;
  feedback: 'correct' | 'wrong' | null;
  isRevealed: boolean;
  onSubmit: () => void;
  shakeStyle: any;
  correctWord: string;
};

export const ReviewInputSection: React.FC<Props> = ({
  inputRef,
  value,
  onChange,
  feedback,
  isRevealed,
  onSubmit,
  shakeStyle,
  correctWord,
}) => (
  <View className="mt-8 w-full">
    <Animated.View style={shakeStyle}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder="Identify the object..."
        placeholderTextColor="#94a3b8"
        className={`w-full rounded-3xl border-2 bg-white p-5 text-center text-xl font-bold shadow-sm ${
          feedback === 'correct'
            ? 'border-green-500 text-green-600'
            : feedback === 'wrong'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-slate-800'
        }`}
        autoFocus
        autoCorrect={false}
        editable={!isRevealed}
        onSubmitEditing={onSubmit}
      />
    </Animated.View>
    {isRevealed && (
      <Animated.View entering={FadeInDown} className="mt-4 items-center">
        <Text className="font-medium text-slate-400">The correct word was:</Text>
        <Text className="text-3xl font-black uppercase text-teal-600">{correctWord}</Text>
      </Animated.View>
    )}
  </View>
);
