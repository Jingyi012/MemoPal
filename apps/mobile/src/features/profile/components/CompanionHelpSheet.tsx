import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { BookOpen, Heart, Shirt, Sparkles } from '@/core/icons';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CompanionHelpSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const { language } = useTranslation('profile');
  const chinese = language === 'zh';
  const { styles, theme } = useStyles();
  const insets = useSafeAreaInsets();
  const items = [
    { Icon: BookOpen, title: chinese ? '一起复习' : 'Practice together', detail: chinese ? '每次复习增加 5 点羁绊' : 'Earn 5 bond points per practice', color: theme.violetDeep },
    { Icon: Heart, title: chinese ? '每天问候' : 'Say hello daily', detail: chinese ? '每日首次问候增加 1 点' : 'Your first hello each day earns 1 point', color: theme.berryDeep },
    { Icon: Shirt, title: chinese ? '装扮伙伴' : 'Dress your companion', detail: chinese ? '打开衣橱试穿并保存造型' : 'Try on and save looks in the wardrobe', color: theme.violetDeep },
  ];

  return (
    <CustomBottomSheetModal ref={ref} snapPoints={['48%']} enableDynamicSizing={false} backgroundStyle={styles.sheet}>
      <BottomSheetView style={[styles.content, { paddingBottom: Math.max(insets.bottom, 22) }]}>
        <View style={styles.heading}>
          <View style={styles.headingIcon}><Sparkles size={19} color={theme.violetDeep} /></View>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>{chinese ? '和伙伴一起成长' : 'Grow together'}</Text>
            <Text style={styles.subtitle}>{chinese ? '复习、问候，慢慢解锁更亲密的关系。' : 'Practice and say hello to grow your bond.'}</Text>
          </View>
        </View>
        <View style={styles.list}>
          {items.map(({ Icon, title, detail, color }) => (
            <View key={title} style={styles.row}>
              <View style={styles.rowIcon}><Icon size={18} color={color} /></View>
              <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>
            </View>
          ))}
        </View>
      </BottomSheetView>
    </CustomBottomSheetModal>
  );
});

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  sheet: { backgroundColor: theme.paper, borderRadius: 28 },
  content: { paddingHorizontal: 22, paddingTop: 12, gap: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headingIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: theme.violetTint },
  headingCopy: { flex: 1 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 11, lineHeight: 16, marginTop: 3 },
  list: { gap: 7 },
  row: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, borderRadius: 16, backgroundColor: theme.canvas },
  rowIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.paper },
  rowCopy: { flex: 1 },
  rowTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  rowDetail: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 10, marginTop: 2 },
}));

CompanionHelpSheet.displayName = 'CompanionHelpSheet';
export default CompanionHelpSheet;
