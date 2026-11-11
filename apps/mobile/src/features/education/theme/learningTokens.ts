import { appLayout, appRadii, appTextStyles } from '../../../theme/designSystem.ts';
import { memopalThemes } from '../../../theme/memopalTheme.ts';

/** Learning-only artwork and game feedback; common colors come from the app theme. */
export const learningColors = {
  light: {
    heroInk: '#FFFFFF', heroOverlay: 'rgba(255,255,255,.1)', heroTrack: 'rgba(255,255,255,.28)', heroAccent: '#FFD65C',
    heroSurface: '#F4EFFF', heroSurfaceInk: '#4C35A3', heroSurfaceBorder: 'rgba(0,0,0,.18)',
    scrim: 'rgba(20,16,40,.45)', subjectMathInk: '#8C4B12', patternBlue: '#405EAE',
    pairOrange: '#C15B00', pairOrangeTint: '#FFF1DF', pairCyan: '#00849A', pairCyanTint: '#E3F5F7',
    ...memopalThemes.light,
    isDark: false, primaryShadow: '#4C35A3', successShadow: '#17613F',
    disabledShadow: '#C2BAD6', memoryInk: '#5E1030',
    hero: ['#6B4FCF', '#9752B4'], memory: ['#FFD1DC', '#FF9DB5'],
    science: ['#F1ECFF', '#F1ECFF'], math: ['#F1ECFF', '#F1ECFF'], english: ['#F1ECFF', '#F1ECFF'],
    tools: ['#EDE7FF', '#DDD3FF'], challenge: ['#8FE6CF', '#4CC3B8'],
    toolsInk: '#4C35A3', challengeInk: '#05453F',
  },
  dark: {
    heroInk: '#FFFFFF', heroOverlay: 'rgba(255,255,255,.1)', heroTrack: 'rgba(255,255,255,.28)', heroAccent: '#FFD65C',
    heroSurface: '#F4EFFF', heroSurfaceInk: '#4C35A3', heroSurfaceBorder: 'rgba(0,0,0,.18)',
    scrim: 'rgba(20,16,40,.65)', subjectMathInk: '#FFBC74', patternBlue: '#9DB9FF',
    pairOrange: '#FFBC74', pairOrangeTint: '#493421', pairCyan: '#71DCE8', pairCyanTint: '#203F48',
    ...memopalThemes.dark,
    isDark: true, primaryShadow: '#7861B0', successShadow: '#28794F',
    disabledShadow: '#3D3351', memoryInk: '#FFE1EB',
    hero: ['#4E328D', '#723C83'], memory: ['#57283F', '#843A59'],
    science: ['#372B50', '#372B50'], math: ['#372B50', '#372B50'], english: ['#372B50', '#372B50'],
    tools: ['#EDE7FF', '#DDD3FF'], challenge: ['#214C42', '#2B746B'],
    toolsInk: '#4C35A3', challengeInk: '#E0FFF8',
  },
} satisfies Record<'light' | 'dark', Record<string, unknown>>;

export const learningLayout = {
  ...appLayout,
  cardRadius: appRadii.card, buttonRadius: appRadii.control, iconRadius: appRadii.control, pillRadius: appRadii.pill,
} as const;

export const learningTypeScale = {
  title: appTextStyles.screenTitle, heading: appTextStyles.sectionTitle,
  body: appTextStyles.bodyStrong, caption: appTextStyles.small,
  prompt: appTextStyles.prompt, button: appTextStyles.button,
} as const;

/** Captured handwriting stays dark ink on white paper in both app themes. */
export const learningDocumentColors = { paper: '#FFFFFF', ink: '#172033', grid: '#E8EDF4' } as const;
