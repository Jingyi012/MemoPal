/** App-wide presentation tokens. Colors live in memopalTheme.ts. */
export const fontFamilies = {
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_500Medium',
  bodySemibold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  /** Compatibility aliases map older component names to the shared 700 weight. */
  bodyExtraBold: 'Nunito_700Bold',
  display: 'Nunito_600SemiBold',
  displayExtraBold: 'Nunito_700Bold',
} as const;

export const appFontWeightValues = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Also supplies the matching system fallback weight for Chinese and other scripts. */
export const appFontWeights = {
  [fontFamilies.body]: appFontWeightValues.regular,
  [fontFamilies.bodyMedium]: appFontWeightValues.medium,
  [fontFamilies.bodySemibold]: appFontWeightValues.semibold,
  [fontFamilies.bodyBold]: appFontWeightValues.bold,
} as const;

/** Semantic text roles shared by screens, cards, forms and learning activities. */
export const appTextStyles = {
  display: { fontFamily: fontFamilies.displayExtraBold, fontSize: 28, lineHeight: 36 },
  pageTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 24, lineHeight: 32 },
  screenTitle: { fontFamily: fontFamilies.display, fontSize: 20, lineHeight: 26 },
  compactTitle: { fontFamily: fontFamilies.display, fontSize: 17, lineHeight: 24 },
  sectionTitle: { fontFamily: fontFamilies.display, fontSize: 20, lineHeight: 26 },
  cardTitle: { fontFamily: fontFamilies.bodySemibold, fontSize: 17, lineHeight: 24 },
  bodyLarge: { fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: fontFamilies.bodySemibold, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 20 },
  label: { fontFamily: fontFamilies.bodyMedium, fontSize: 12, lineHeight: 16 },
  labelStrong: { fontFamily: fontFamilies.bodySemibold, fontSize: 12, lineHeight: 16 },
  caption: { fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 16 },
  captionStrong: { fontFamily: fontFamilies.bodySemibold, fontSize: 11, lineHeight: 16 },
  button: { fontFamily: fontFamilies.bodySemibold, fontSize: 14, lineHeight: 20 },
  buttonCompact: { fontFamily: fontFamilies.bodySemibold, fontSize: 12, lineHeight: 16 },
  tabLabel: { fontFamily: fontFamilies.bodySemibold, fontSize: 11, lineHeight: 16 },
  prompt: { fontFamily: fontFamilies.displayExtraBold, fontSize: 20, lineHeight: 26 },
  stat: { fontFamily: fontFamilies.displayExtraBold, fontSize: 20, lineHeight: 26 },
  phrase: { fontFamily: fontFamilies.displayExtraBold, fontSize: 24, lineHeight: 32 },
  word: { fontFamily: fontFamilies.displayExtraBold, fontSize: 28, lineHeight: 36 },
} as const;

export const appSpacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, section: 32, spacious: 40 } as const;
export const appRadii = { small: 8, control: 14, card: 20, hero: 24, sheet: 24, pill: 999 } as const;
export const appLayout = {
  pagePadding: appSpacing.lg,
  cardPadding: appSpacing.lg,
  gap: appSpacing.md,
  sectionGap: appSpacing.xxl,
  touchTarget: 44,
  controlHeight: 52,
  compactControlHeight: 44,
  inputHeight: 48,
  borderWidth: 1,
  cardDepth: 2,
  buttonDepth: 2,
  optionDepth: 4,
} as const;

/** Decorative glyphs are artwork, rather than reading text. */
export const appArtworkSizes = { tiny: 18, small: 24, medium: 32, large: 40, hero: 48, feature: 64, display: 80, countdown: 96 } as const;
export const appArtworkTextStyles = {
  tiny: { fontSize: appArtworkSizes.tiny, lineHeight: 25 },
  small: { fontSize: appArtworkSizes.small, lineHeight: 30 },
  medium: { fontSize: appArtworkSizes.medium, lineHeight: 38 },
  large: { fontSize: appArtworkSizes.large, lineHeight: 48 },
  hero: { fontSize: appArtworkSizes.hero, lineHeight: 56 },
  feature: { fontSize: appArtworkSizes.feature, lineHeight: 72 },
  display: { fontSize: appArtworkSizes.display, lineHeight: 88 },
  countdown: { fontSize: appArtworkSizes.countdown, lineHeight: 112 },
} as const;

export const appShadows = {
  card: { boxShadow: '0px 2px 0px rgba(105,80,204,0.08)' },
  raised: { boxShadow: '0px 4px 0px rgba(105,80,204,0.10)' },
} as const;
