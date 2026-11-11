import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography, learningLayout, learningTypeScale } from '@/features/education/theme/learningTheme';
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
      gap: appSpacing.md,
    },
    prompt: {
      color: theme.ink,
      ...learningTypeScale.prompt,
    },
    hint: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
    options: {
      gap: 10,
    },
    option: {
      alignItems: 'center',
      backgroundColor: theme.paper,
      borderColor: theme.line,
      borderRadius: learningLayout.buttonRadius,
      borderWidth: learningLayout.borderWidth,
      borderBottomWidth: learningLayout.optionDepth,
      flexDirection: 'row',
      gap: appSpacing.md,
      minHeight: 58,
      paddingHorizontal: 14,
      paddingVertical: appSpacing.md,
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
    markerText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
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
    checkboxMark: { color: theme.paper, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
    optionLabel: {
      color: theme.ink,
      flex: 1,
      fontFamily: typography.bodyExtraBold,
      fontSize: appTextStyles.cardTitle.fontSize,
      lineHeight: appTextStyles.cardTitle.lineHeight,
    },
    input: {
      backgroundColor: theme.paper,
      borderColor: theme.line,
      borderRadius: appRadii.card,
      borderWidth: 1.5,
      color: theme.ink,
      fontFamily: typography.bodySemibold,
      fontSize: appTextStyles.sectionTitle.fontSize,
      minHeight: 58,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
  }),
);
