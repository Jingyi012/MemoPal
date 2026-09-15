import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Constants from 'expo-constants';
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  content: { paddingHorizontal: 20, paddingTop: 10 },
  brandCard: { alignItems: 'center', backgroundColor: theme.night, borderRadius: 24, padding: 22 },
  logo: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 22, height: 68, justifyContent: 'center', width: 68 },
  logoText: { fontSize: 36 },
  brandName: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 27, marginTop: 10 },
  tagline: { color: 'rgba(255,255,255,0.72)', fontFamily: typography.bodySemibold, fontSize: 12, marginTop: 3, textAlign: 'center' },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 20, marginTop: 22 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 20, marginTop: 7 },
  featureList: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 20, borderWidth: 1.5, marginTop: 18, padding: 5 },
  feature: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: 10 },
  featureIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 13, height: 38, justifyContent: 'center', width: 38 },
  featureEmoji: { fontSize: 20 },
  featureText: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 13, marginLeft: 11 },
  versionCard: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 16, borderWidth: 1.5, marginTop: 14, padding: 13 },
  versionLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  versionText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, marginTop: 4 },
});

AboutSheet.displayName = 'AboutSheet';
export default AboutSheet;
