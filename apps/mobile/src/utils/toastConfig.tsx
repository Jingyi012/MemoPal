import { Colors } from '@/constants/colors';
import { AlertCircle, CheckCircle2, Info, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '@/theme/typography';
import { ToastConfig } from 'react-native-toast-message';

type ToastVariant = 'success' | 'error' | 'info';

type VariantStyle = {
  Icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
  borderColor: string;
  accentColor: string;
  titleColor: string;
  messageColor: string;
};

const variantStyles: Record<ToastVariant, VariantStyle> = {
  success: {
    Icon: CheckCircle2,
    iconColor: Colors.emerald700,
    iconBackground: Colors.emerald100,
    borderColor: Colors.emerald200,
    accentColor: Colors.emerald500,
    titleColor: Colors.emerald900,
    messageColor: Colors.emerald700,
  },
  error: {
    Icon: AlertCircle,
    iconColor: Colors.red700,
    iconBackground: Colors.red100,
    borderColor: Colors.red200,
    accentColor: Colors.red500,
    titleColor: Colors.red900,
    messageColor: Colors.red700,
  },
  info: {
    Icon: Info,
    iconColor: Colors.indigo700,
    iconBackground: Colors.indigo100,
    borderColor: Colors.indigo200,
    accentColor: Colors.indigo500,
    titleColor: Colors.indigo900,
    messageColor: Colors.indigo700,
  },
};

function ToastCard({
  variant,
  text1,
  text2,
}: {
  variant: ToastVariant;
  text1?: string;
  text2?: string;
}) {
  const theme = variantStyles[variant];
  const Icon = theme.Icon;

  return (
    <View style={[styles.container, { borderColor: theme.borderColor }]}>
      <View style={[styles.accent, { backgroundColor: theme.accentColor }]} />
      <View style={[styles.iconChip, { backgroundColor: theme.iconBackground }]}>
        <Icon size={20} color={theme.iconColor} />
      </View>

      <View style={styles.textWrap}>
        <Text numberOfLines={2} style={[styles.title, { color: theme.titleColor }]}>
          {text1 ?? (variant === 'error' ? 'Something went wrong' : 'Update')}
        </Text>
        {text2 ? (
          <Text numberOfLines={3} style={[styles.message, { color: theme.messageColor }]}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => <ToastCard variant="success" text1={text1} text2={text2} />,
  error: ({ text1, text2 }) => <ToastCard variant="error" text1={text1} text2={text2} />,
  info: ({ text1, text2 }) => <ToastCard variant="info" text1={text1} text2={text2} />,
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 12,
    boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.12)',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 999,
    marginRight: 10,
  },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    lineHeight: 20,
  },
  message: {
    fontFamily: typography.bodySemibold,
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
});
