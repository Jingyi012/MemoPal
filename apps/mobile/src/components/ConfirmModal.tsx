import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { ReactNode } from 'react';
import {
  Modal,
  StyleSheet,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AppButton } from './ui/AppButton';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
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
  children,
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
  const { styles } = useStyles();
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
              {children}

              {alternativeText && onAlternative ? (
                <AppButton
                  label={alternativeText}
                  variant="secondary"
                  fullWidth
                  disabled={isLoading}
                  onPress={onAlternative}
                  style={styles.alternativeButton}
                />
              ) : null}

              <View style={styles.actions}>
                <AppButton
                  label={cancelText}
                  variant="secondary"
                  size="regular"
                  disabled={isLoading}
                  onPress={close}
                  style={styles.buttonSlot}
                />
                <AppButton
                  label={confirmText}
                  variant={destructive ? 'destructive' : 'primary'}
                  size="regular"
                  loading={isLoading}
                  onPress={onConfirm}
                  style={styles.buttonSlot}
                />
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
  buttonSlot: { flexGrow: 1, flexBasis: 110, minHeight: 48 },
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
    marginTop: 18,
  },
}));
