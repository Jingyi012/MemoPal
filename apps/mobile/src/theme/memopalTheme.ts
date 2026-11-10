export type MemoPalTheme = Readonly<{
  ink: string;
  inkSoft: string;
  inkMuted: string;
  onSun: string;
  onAccent: string;
  link: string;
  successText: string;
  disabled: string;
  controlPressed: string;
  paper: string;
  canvas: string;
  line: string;
  sand: string;
  berryTint: string;
  berryLine: string;
  violetTint: string;
  violetLine: string;
  sunTint: string;
  sunLine: string;
  mintTint: string;
  mintLine: string;
  skyTint: string;
  skyLine: string;
  peachTint: string;
  peachLine: string;
  sun: string;
  sunDeep: string;
  berry: string;
  berryDeep: string;
  violet: string;
  violetDeep: string;
  grass: string;
  sky: string;
  night: string;
  nightDeep: string;
}>;

const lightTheme: MemoPalTheme = {
  ink: '#2B2A3D',
  inkSoft: '#6B6A80',
  inkMuted: '#9A97A7',
  onSun: '#2B2A3D',
  onAccent: '#FFFFFF',
  link: '#24718D',
  successText: '#267A55',
  disabled: '#D8D4E2',
  controlPressed: '#ECECEF',
  paper: '#FFFFFF',
  canvas: '#FCFAFF',
  line: '#E9DFF0',
  sand: '#FFF3E6',
  berryTint: '#FFF0F4',
  berryLine: '#FFD9E2',
  violetTint: '#F3F0FF',
  violetLine: '#DED6FF',
  sunTint: '#FFF7DD',
  sunLine: '#FFE6A3',
  mintTint: '#EAF8F1',
  mintLine: '#BFE9D4',
  skyTint: '#EAF7FC',
  skyLine: '#C9EAF6',
  peachTint: '#FFF1E6',
  peachLine: '#F4D8B8',
  sun: '#FFC93C',
  sunDeep: '#F2A900',
  berry: '#FF6F91',
  berryDeep: '#C73565',
  violet: '#9B8CFF',
  violetDeep: '#6950CC',
  grass: '#3FB87F',
  sky: '#4FC0E8',
  night: '#2B2641',
  nightDeep: '#1E1A30',
};

const darkTheme: MemoPalTheme = {
  ink: '#F8F6FF',
  inkSoft: '#C9C5E0',
  inkMuted: '#AAA6B8',
  onSun: '#2B2A3D',
  onAccent: '#2B2A3D',
  link: '#6DD2F2',
  successText: '#75D8A6',
  disabled: '#51496F',
  controlPressed: '#403B4D',
  paper: '#2B2641',
  canvas: '#1E1A30',
  line: '#51496F',
  sand: '#463226',
  berryTint: '#4A2936',
  berryLine: '#704052',
  violetTint: '#37304F',
  violetLine: '#51496F',
  sunTint: '#5C4B1A',
  sunLine: '#806923',
  mintTint: '#213D33',
  mintLine: '#356551',
  skyTint: '#213B46',
  skyLine: '#356270',
  peachTint: '#463226',
  peachLine: '#6D4C35',
  sun: '#FFC93C',
  sunDeep: '#FFD86A',
  berry: '#FF6F91',
  berryDeep: '#FF8CAA',
  violet: '#9B8CFF',
  violetDeep: '#B3A7FF',
  grass: '#5FD09A',
  sky: '#6DD2F2',
  night: '#2B2641',
  nightDeep: '#171425',
};

export const memopalThemes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

/** Static StyleSheet consumers currently use the light palette. */
export const memopalTheme = memopalThemes.light;

/**
 * UI color roles. Screens should prefer these roles over literal colors so the
 * product can be recolored without editing feature files.
 */
export const createMemopalColorRoles = (theme: MemoPalTheme) => ({
  page: theme.canvas,
  surface: theme.paper,
  surfaceSubtle: theme.peachTint,
  border: theme.line,
  text: theme.ink,
  textSecondary: theme.inkSoft,
  textMuted: theme.inkMuted,
  action: theme.violetDeep,
  actionOn: theme.onAccent,
  actionSurface: theme.violetTint,
  actionOnSurface: theme.violetDeep,
  actionOutline: theme.violetLine,
  actionPressed: theme.violetDeep,
  actionDisabled: theme.disabled,
  actionOnDisabled: theme.inkSoft,
  destructive: theme.berryDeep,
  destructiveOn: theme.onAccent,
  reward: theme.sun,
  palace: theme.violetDeep,
  palaceTint: theme.violetTint,
  numberPeg: theme.berryDeep,
  numberPegTint: theme.berryTint,
  success: theme.grass,
  successTint: theme.mintTint,
  information: theme.sky,
  informationTint: theme.skyTint,
});

export const memopalColorRoles = createMemopalColorRoles(memopalTheme);
