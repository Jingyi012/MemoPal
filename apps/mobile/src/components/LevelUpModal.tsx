import { useTranslation } from '@/core/i18n/useTranslation';
import { typography } from '@/theme/typography';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Sparkles, Trophy } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type LevelUpModalProps = {
  level: number;
  visible: boolean;
  onClose: () => void;
};

/** A short, celebratory confirmation shown only after the server confirms a level-up. */
export function LevelUpModal({ level, visible, onClose }: LevelUpModalProps) {
  const { t } = useTranslation('achievements');
  const [dismissed, setDismissed] = useState(false);

  React.useEffect(() => {
    if (visible) setDismissed(false);
  }, [visible, level]);

  const close = () => {
    setDismissed(true);
    onClose();
  };

  return (
    <Modal
      visible={visible && !dismissed}
      transparent
      animationType="fade"
      onRequestClose={close}
      accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <LinearGradient colors={['#302849', '#1E1A30']} style={styles.hero}>
            <View style={styles.sparkleOne}><Sparkles size={19} color="#FFC93C" /></View>
            <View style={styles.sparkleTwo}><Sparkles size={14} color="#FF9AB4" /></View>
            <View style={styles.trophyRing}><Trophy size={39} color="#2B2A3D" fill="#FFC93C" /></View>
            <Text style={styles.eyebrow}>{t('levelUpEyebrow')}</Text>
            <Text style={styles.title}>{t('levelUpTitle')}</Text>
            <Text style={styles.level}>{t('level')} {level}</Text>
          </LinearGradient>
          <View style={styles.body}>
            <Text style={styles.bodyText}>{t('levelUpBody')}</Text>
            <View style={styles.rewardRow}>
              <View style={styles.rewardIcon}><Check size={16} color="#267A55" strokeWidth={3} /></View>
              <Text style={styles.rewardText}>{t('levelUpReward')}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={close} style={styles.button}>
              <Text style={styles.buttonText}>{t('levelUpContinue')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30,26,48,0.64)', padding: 24 },
  dialog: { width: '100%', maxWidth: 360, overflow: 'hidden', borderRadius: 26, backgroundColor: theme.paper, boxShadow: '0px 18px 40px rgba(30,26,48,0.35)' },
  hero: { minHeight: 216, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 22 },
  sparkleOne: { position: 'absolute', top: 31, left: 48, transform: [{ rotate: '-18deg' }] },
  sparkleTwo: { position: 'absolute', top: 55, right: 52, transform: [{ rotate: '20deg' }] },
  trophyRing: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 39, backgroundColor: '#FFC93C', borderWidth: 5, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },
  eyebrow: { color: '#FFC93C', fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 27, marginTop: 3 },
  level: { color: '#D7D2EE', fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 3 },
  body: { alignItems: 'center', padding: 20 },
  bodyText: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, borderRadius: 999, backgroundColor: theme.mintTint, paddingHorizontal: 12, paddingVertical: 8 },
  rewardIcon: { width: 21, height: 21, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#DDF5E9' },
  rewardText: { color: '#267A55', fontFamily: typography.bodyExtraBold, fontSize: 11 },
  button: { width: '100%', minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.sun, marginTop: 18 },
  buttonText: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13.5 },
});
