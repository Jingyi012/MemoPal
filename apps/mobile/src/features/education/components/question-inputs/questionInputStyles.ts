import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import { createContext, useContext } from 'react';
import { StyleSheet } from 'react-native';
import type { EducationAttemptAnswerDto } from '../../types/question.types';

export const QuestionFeedbackContext = createContext<boolean | null>(null);
export const useQuestionFeedback = () => useContext(QuestionFeedbackContext);
export const QuestionHintsContext = createContext(true);
export const useQuestionHints = () => useContext(QuestionHintsContext);
export const CorrectAnswerContext = createContext<EducationAttemptAnswerDto | null>(null);
export const useCorrectAnswer = () => useContext(CorrectAnswerContext);

export const useQuestionInputStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      gap: 12,
    },
    prompt: {
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 23,
      lineHeight: 31,
    },
    hint: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 18 },
    options: {
      gap: 10,
    },
    option: {
      alignItems: 'center',
      backgroundColor: theme.paper,
      borderColor: theme.line,
      borderRadius: 18,
      borderWidth: 1.5,
      borderBottomWidth: 4,
      flexDirection: 'row',
      gap: 12,
      minHeight: 58,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    optionSelected: {
      backgroundColor: theme.violetTint,
      borderColor: theme.violetDeep,
      transform: [{ translateY: -2 }],
    },
    optionCorrect: { backgroundColor: theme.mintTint, borderColor: theme.successText, borderBottomColor: theme.successText },
    optionIncorrect: { backgroundColor: theme.berryTint, borderColor: theme.berryDeep, borderBottomColor: theme.berryDeep },
    marker: { alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 10, backgroundColor: theme.violetTint, borderWidth: 0, borderColor: theme.line },
    markerSelected: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
    markerText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13 },
    // Keep the chosen answer readable after submission. The native disabled
    // prop still prevents edits while the feedback panel is open.
    optionDisabled: {
      opacity: 1,
    },
    radio: {
      alignItems: 'center',
      borderColor: theme.inkMuted,
      borderRadius: 10,
      borderWidth: 2,
      height: 20,
      justifyContent: 'center',
      width: 20,
    },
    radioSelected: {
      borderColor: theme.violetDeep,
    },
    radioDot: {
      backgroundColor: theme.violetDeep,
      borderRadius: 5,
      height: 10,
      width: 10,
    },
    checkbox: {
      alignItems: 'center',
      borderColor: theme.inkMuted,
      borderRadius: 5,
      borderWidth: 2,
      height: 22,
      justifyContent: 'center',
      width: 22,
    },
    checkboxSelected: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
    checkboxMark: { color: theme.paper, fontFamily: typography.bodyExtraBold, fontSize: 14 },
    optionLabel: {
      color: theme.ink,
      flex: 1,
      fontFamily: typography.bodyExtraBold,
      fontSize: 16,
      lineHeight: 23,
    },
    input: {
      backgroundColor: theme.paper,
      borderColor: theme.line,
      borderRadius: 20,
      borderWidth: 1.5,
      color: theme.ink,
      fontFamily: typography.bodySemibold,
      fontSize: 17,
      minHeight: 58,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
  }),
);
