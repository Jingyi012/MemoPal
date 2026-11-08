/** Learning color roles shared by all screens and question types. */
export const learningColors = {
  light: {
    heroInk: '#FFFFFF', heroOverlay: 'rgba(255,255,255,.1)', heroTrack: 'rgba(255,255,255,.28)', heroAccent: '#FFD65C',
    heroSurface: '#F4EFFF', heroSurfaceInk: '#4C35A3', heroSurfaceBorder: 'rgba(0,0,0,.18)',
    scrim: 'rgba(20,16,40,.45)', subjectMathInk: '#8C4B12', patternBlue: '#405EAE',
    pairOrange: '#C15B00', pairOrangeTint: '#FFF1DF', pairCyan: '#00849A', pairCyanTint: '#E3F5F7',
    ink: '#251F3D', inkSoft: '#59516F', inkMuted: '#706681',
    canvas: '#FBF8FF', paper: '#FFFFFF', line: '#E4DAFB',
    violetTint: '#F1ECFF', violetLine: '#E4DAFB', violetDeep: '#6B4FCF',
    // Slightly deeper ink than the mockup so small status labels pass AA.
    successText: '#1D784F', grass: '#4FB27C', mintTint: '#E6F7EE', mintLine: '#A9DEC2',
    berryDeep: '#BE304C', berryTint: '#FDEBEE', berryLine: '#F2B8C2',
    peachTint: '#FFF0D6', peachLine: '#FFE0A8',
    disabled: '#D9D3E6', onAccent: '#FFFFFF',
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
    ink: '#F4EFFF', inkSoft: '#D0C7E8', canvas: '#1B152B', paper: '#2B233E', line: '#514365',
    violetTint: '#372B50', violetLine: '#63517D', violetDeep: '#BBA7FF',
    successText: '#82DFB0', mintTint: '#203E32', mintLine: '#3E7258',
    berryDeep: '#FF9AAE', berryTint: '#4B2637', berryLine: '#85435B',
    onAccent: '#251F3D', isDark: true, primaryShadow: '#7861B0', successShadow: '#28794F',
    disabledShadow: '#3D3351', memoryInk: '#FFE1EB',
    hero: ['#4E328D', '#723C83'], memory: ['#57283F', '#843A59'],
    science: ['#372B50', '#372B50'], math: ['#372B50', '#372B50'], english: ['#372B50', '#372B50'],
    tools: ['#EDE7FF', '#DDD3FF'], challenge: ['#214C42', '#2B746B'],
    toolsInk: '#4C35A3', challengeInk: '#E0FFF8',
  },
} satisfies Record<'light' | 'dark', Record<string, unknown>>;

export const learningLayout = {
  pagePadding: 16, gap: 12, sectionGap: 18,
  cardRadius: 22, buttonRadius: 18, iconRadius: 14, pillRadius: 99,
  borderWidth: 1.5, cardDepth: 6, buttonDepth: 5, optionDepth: 4, touchTarget: 44, controlHeight: 54, compactControlHeight: 48,
} as const;

export const learningTypeScale = {
  title: { fontSize: 22, lineHeight: 28 }, heading: { fontSize: 18, lineHeight: 25 },
  body: { fontSize: 15, lineHeight: 23 }, caption: { fontSize: 14, lineHeight: 21 },
  prompt: { fontSize: 23, lineHeight: 31 }, button: { fontSize: 16, lineHeight: 23 },
} as const;

/** Captured handwriting stays dark ink on white paper in both app themes. */
export const learningDocumentColors = { paper: '#FFFFFF', ink: '#172033', grid: '#E8EDF4' } as const;
