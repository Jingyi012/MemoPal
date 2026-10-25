import { useTranslation } from '@/core/i18n/useTranslation';
import { typography } from '@/theme/typography';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Sparkles } from '@/core/icons';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { getCompanionStage } from '@/features/profile/companion/growth';
import { AppButton } from '@/components/ui/AppButton';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

type LevelUpModalProps = {
  level: number;
  visible: boolean;
  onClose: () => void;
};

/** A short, celebratory confirmation shown only after the server confirms a level-up. */
export function LevelUpModal({ level, visible, onClose }: LevelUpModalProps) {
  const { t, language } = useTranslation('achievements');
  const growthStage = getCompanionStage(level);
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
            {visible && !dismissed ? <CompanionActor size={200} stage={level} cue={{ action: 'celebrate', sequence: level }} label={language === 'zh' ? '沫沫为你的成长庆祝' : 'Momo celebrates your growth'} /> : null}
            <Text style={styles.eyebrow}>{t('levelUpEyebrow')}</Text>
            <Text style={styles.title}>{t('levelUpTitle')}</Text>
            <Text style={styles.level}>{t('level')} {level}</Text>
            {level <= 10 ? <Text style={styles.growth}>{language === 'zh' ? `新形态解锁 · ${growthStage.zh}` : `New stage unlocked · ${growthStage.en}`}</Text> : null}
          </LinearGradient>
          <View style={styles.body}>
            <Text style={styles.bodyText}>{t('levelUpBody')}</Text>
            <View style={styles.rewardRow}>
              <View style={styles.rewardIcon}><Check size={16} color="#267A55" strokeWidth={3} /></View>
              <Text style={styles.rewardText}>{t('levelUpReward')}</Text>
            </View>
            <AppButton label={t('levelUpContinue')} onPress={close} fullWidth style={styles.button} />
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
  growth: { color: '#FFE4B9', fontFamily: typography.bodyBold, fontSize: 12, textAlign: 'center', marginTop: 10 },
  eyebrow: { color: '#FFC93C', fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 27, marginTop: 3 },
  level: { color: '#D7D2EE', fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 3 },
  body: { alignItems: 'center', padding: 20 },
  bodyText: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, borderRadius: 999, backgroundColor: theme.mintTint, paddingHorizontal: 12, paddingVertical: 8 },
  rewardIcon: { width: 21, height: 21, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#DDF5E9' },
  rewardText: { color: '#267A55', fontFamily: typography.bodyExtraBold, fontSize: 11 },
  button: { marginTop: 18 },
});
