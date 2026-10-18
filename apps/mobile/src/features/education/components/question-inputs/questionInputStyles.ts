import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { StyleSheet } from 'react-native';

export const useQuestionInputStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      gap: 12,
    },
    prompt: {
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 18,
      lineHeight: 26,
    },
    hint: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 18 },
    options: {
      gap: 10,
    },
    option: {
      alignItems: 'center',
      backgroundColor: theme.paper,
      borderColor: theme.line,
      borderRadius: 14,
      borderWidth: 1.5,
      flexDirection: 'row',
      gap: 12,
      minHeight: 52,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    optionSelected: {
      backgroundColor: theme.violetTint,
      borderColor: theme.violetDeep,
    },
    optionDisabled: {
      opacity: 0.55,
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
      fontFamily: typography.bodySemibold,
      fontSize: 16,
      lineHeight: 23,
    },
    input: {
      backgroundColor: theme.paper,
      borderColor: theme.line,
      borderRadius: 14,
      borderWidth: 1.5,
      color: theme.ink,
      fontFamily: typography.bodySemibold,
      fontSize: 17,
      minHeight: 52,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
  }),
);
