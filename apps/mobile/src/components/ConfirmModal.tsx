import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import AnimatedPressable from './AnimatedPressable';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  subject?: string;
  icon?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  alternativeText?: string;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onAlternative?: () => void;
}

export function ConfirmModal({
  visible,
  title = 'Are you sure?',
  description,
  subject,
  icon,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  alternativeText,
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
  onAlternative,
}: ConfirmModalProps) {
  const { styles, theme } = useStyles();
  const close = () => {
    if (!isLoading) onCancel();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      accessibilityViewIsModal
      onRequestClose={close}>
      <TouchableWithoutFeedback onPress={close}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <ScrollView style={styles.dialog} contentContainerStyle={styles.dialogContent} showsVerticalScrollIndicator={false}>
              {icon ? <View style={styles.icon}>{icon}</View> : null}
              <Text style={styles.title}>{title}</Text>
              {subject ? (
                <View style={styles.subjectCard}>
                  <Text numberOfLines={2} style={styles.subject}>
                    {subject}
                  </Text>
                </View>
              ) : null}
              {description ? <Text style={styles.description}>{description}</Text> : null}

              {alternativeText && onAlternative ? (
                <AnimatedPressable
                  disabled={isLoading}
                  onPress={onAlternative}
                  style={[styles.alternativeButton, isLoading && styles.disabled]}
                  containerStyle={{ alignSelf: 'stretch' }}>
                  <Text style={styles.alternativeText}>{alternativeText}</Text>
                </AnimatedPressable>
              ) : null}

              <View style={styles.actions}>
                <AnimatedPressable
                  disabled={isLoading}
                  onPress={close}
                  style={[styles.button, styles.cancelButton, isLoading && styles.disabled]}
                  containerStyle={styles.buttonSlot}>
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  disabled={isLoading}
                  onPress={onConfirm}
                  style={[
                    styles.button,
                    destructive ? styles.destructiveButton : styles.confirmButton,
                    isLoading && styles.disabled,
                  ]}
                  containerStyle={styles.buttonSlot}>
                  {isLoading ? (
                    <ActivityIndicator color={destructive ? theme.onAccent : theme.onSun} />
                  ) : (
                    <Text style={[styles.confirmText, destructive && styles.destructiveText]}>
                      {confirmText}
                    </Text>
                  )}
                </AnimatedPressable>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 26, 48, 0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    maxHeight: '90%',
    flexGrow: 0,
    backgroundColor: theme.paper,
    borderColor: theme.line,
    borderRadius: 26,
    borderWidth: 1,
    boxShadow: '0px 18px 40px rgba(30, 26, 48, 0.30)',
    maxWidth: 360,
    width: '100%',
  },
  dialogContent: { alignItems: 'center', padding: 22 },
  buttonSlot: { flexGrow: 1, flexBasis: 120 },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.berryTint,
    borderRadius: 22,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  title: {
    color: theme.ink,
    fontFamily: typography.displayExtraBold,
    fontSize: 21,
    marginTop: 14,
    textAlign: 'center',
  },
  subjectCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.canvas,
    borderColor: theme.line,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  subject: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 15,
    textAlign: 'center',
  },
  description: {
    color: theme.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20, width: '100%' },
  alternativeButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.violetTint,
    borderColor: theme.violetLine,
    borderRadius: 15,
    borderWidth: 1.5,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  alternativeText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 14, textAlign: 'center' },
  button: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 15,
    flex: 1,
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: theme.canvas, borderColor: theme.line, borderWidth: 1.5 },
  confirmButton: { backgroundColor: theme.sun },
  destructiveButton: { backgroundColor: theme.berryDeep },
  cancelText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 14, textAlign: 'center' },
  confirmText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 14, textAlign: 'center' },
  destructiveText: { color: theme.onAccent },
  disabled: { opacity: 0.65 },
}));
