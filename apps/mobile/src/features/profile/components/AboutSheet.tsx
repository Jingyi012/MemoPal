import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Constants from 'expo-constants';
import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AboutSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const { t } = useTranslation('profile');
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <CustomBottomSheetModal ref={ref} snapPoints={['78%']} enableDynamicSizing={false} backgroundStyle={styles.sheetBackground}>
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.brandCard}>
          <View style={styles.logo}><Text style={styles.logoText}>🧠</Text></View>
          <Text style={styles.brandName}>MemoPal</Text>
          <Text style={styles.tagline}>{t('aboutTagline')}</Text>
        </View>
        <Text style={styles.title}>{t('about')}</Text>
        <Text style={styles.body}>{t('aboutBody')}</Text>
        <View style={styles.featureList}>
          <Feature icon="🗺️" title={t('aboutFeaturePalace')} styles={styles} />
          <Feature icon="🔗" title={t('aboutFeaturePeg')} styles={styles} />
          <Feature icon="🧠" title={t('aboutFeatureReview')} styles={styles} />
        </View>
        <View style={styles.versionCard}>
          <Text style={styles.versionLabel}>{t('buildInformation')}</Text>
          <Text style={styles.versionText}>{t('appVersion')} {version}</Text>
        </View>
      </BottomSheetScrollView>
    </CustomBottomSheetModal>
  );
});

function Feature({ icon, title, styles }: { icon: string; title: string; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.feature}><View style={styles.featureIcon}><Text style={styles.featureEmoji}>{icon}</Text></View><Text style={styles.featureText}>{title}</Text></View>;
}

const createStyles = (theme: typeof memopalThemes.light) => StyleSheet.create({
  sheetBackground: { backgroundColor: theme.paper, borderRadius: 30 },
  content: { paddingHorizontal: appSpacing.xl, paddingTop: 10 },
  brandCard: { alignItems: 'center', backgroundColor: theme.night, borderRadius: appRadii.hero, padding: 22 },
  logo: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: appRadii.card, height: 68, justifyContent: 'center', width: 68 },
  logoText: { fontSize: appArtworkSizes.medium },
  brandName: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: appTextStyles.pageTitle.fontSize, marginTop: 10 },
  tagline: { color: 'rgba(255,255,255,0.72)', fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, marginTop: 3, textAlign: 'center' },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize, marginTop: 22 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, marginTop: 7 },
  featureList: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 1.5, marginTop: 18, padding: 5 },
  feature: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: 10 },
  featureIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.control, height: 38, justifyContent: 'center', width: 38 },
  featureEmoji: { fontSize: appArtworkSizes.tiny },
  featureText: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize, marginLeft: 11 },
  versionCard: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: appRadii.control, borderWidth: 1.5, marginTop: 14, padding: 13 },
  versionLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  versionText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, marginTop: appSpacing.xs },
});

AboutSheet.displayName = 'AboutSheet';
export default AboutSheet;
