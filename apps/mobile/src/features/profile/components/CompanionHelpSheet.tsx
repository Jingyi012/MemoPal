import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { BookOpen, Heart, Sparkles } from '@/core/icons';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
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
    { Icon: Sparkles, title: chinese ? '十段成长' : 'Ten stages of growth', detail: chinese ? '沫沫从 1 级的幼年模样开始，随账号等级一点点长大，10 级成为月光伙伴。' : 'Momo starts as a tiny youngster at level 1 and grows with your account level into a moonlit companion at 10.', color: theme.violetDeep },
    { Icon: Sparkles, title: chinese ? '海底寻宝' : 'Pearl quest', detail: chinese ? '翻贝壳找四对宝藏，连续配对会得到沫沫的欢呼。' : 'Turn shells to find four pairs; Momo cheers for your matches.', color: theme.violetDeep },
  ];

  return (
    <CustomBottomSheetModal ref={ref} snapPoints={['48%']} enableDynamicSizing={false} backgroundStyle={styles.sheet}>
      <BottomSheetView style={[styles.content, { paddingBottom: Math.max(insets.bottom, 22) }]}>
        <View style={styles.heading}>
          <View style={styles.headingIcon}><Sparkles size={19} color={theme.violetDeep} /></View>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>{chinese ? '和伙伴一起成长' : 'Grow together'}</Text>
            <Text style={styles.subtitle}>{chinese ? '学习让沫沫成长，问候加深羁绊。互动小游戏不消耗也不增加经验。' : 'Learning grows Momo. Greetings grow your bond. Play is just for fun, with no XP cost or reward.'}</Text>
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
  content: { paddingHorizontal: 22, paddingTop: appSpacing.md, gap: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.md },
  headingIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: appRadii.control, backgroundColor: theme.violetTint },
  headingCopy: { flex: 1 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize },
  subtitle: { color: theme.inkSoft, fontFamily: typography.body, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: 3 },
  list: { gap: 7 },
  row: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, borderRadius: appRadii.control, backgroundColor: theme.canvas },
  rowIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: appRadii.control, backgroundColor: theme.paper },
  rowCopy: { flex: 1 },
  rowTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  rowDetail: { color: theme.inkMuted, fontFamily: typography.body, fontSize: appTextStyles.caption.fontSize, marginTop: 2 },
}));

CompanionHelpSheet.displayName = 'CompanionHelpSheet';
export default CompanionHelpSheet;
