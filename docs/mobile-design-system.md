# Mobile shared styles

`apps/mobile/src/theme/designSystem.ts` owns the mobile type scale, font faces,
fallback weights, spacing, radii, control sizes and card shadows.
`apps/mobile/src/theme/memopalTheme.ts` owns light and dark semantic colors.
Change these sources to update the app; do not create a screen-specific scale.

| Text role | Size / line height | Use |
| --- | --- | --- |
| `display` | 28 / 36 | A few special hero moments |
| `pageTitle` | 24 / 32 | Main page title |
| `screenTitle`, `sectionTitle` | 20 / 26 | Nested page and major section titles |
| `cardTitle`, `compactTitle` | 17 / 24 | Card, module and compact titles |
| `bodyLarge` | 16 / 24 | Important body copy |
| `body`, `bodyStrong` | 14 / 20 | Regular and emphasized reading text |
| `small` | 13 / 20 | Secondary descriptions |
| `label` | 12 / 16 | Tags and helper labels |
| `caption`, `tabLabel` | 11 / 16 | Dates, metadata and bottom navigation |
| `button`, `buttonCompact` | 14 / 20, 12 / 16 | Shared action labels |

`prompt`, `word`, `phrase`, `stat` and `display` support questions, vocabulary
and large numeric results. Decorative glyphs use `appArtworkSizes` and
`appArtworkTextStyles`, rather than borrowing a heading size. The scale is designed for 360–430pt mobile
screens: regular content centers on 14pt, while 28pt display text stays limited
to a few hero moments. Weight roles use 400, 500, 600 and 700 only.

```tsx
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { appSpacing, appTextStyles } from '@/theme/designSystem';
import { createThemedStyles } from '@/theme/createThemedStyles';

const useStyles = createThemedStyles(theme => ({
  title: { ...appTextStyles.sectionTitle, color: theme.ink },
  content: { padding: appSpacing.lg, gap: appSpacing.md },
}));
```

- Use `AppText` and `AppTextInput` for the shared body face, theme ink and input
  placeholder defaults. Nested `AppText` inherits its parent's formatting;
  caller styles and NativeWind classes continue to override defaults. Font
  scaling stays enabled. Chinese fallback weights follow the selected face.
- Use `CommonHeader` for main and nested headings, `HeaderIconButton` for
  transparent header actions, and `AppButton` for action hierarchy. Primary
  controls are 52pt high; compact and icon controls have a 44pt minimum.
- Cards use 20pt corners; hero and sheet surfaces use 24pt. Layout-specific
  geometry (diagrams, avatar frames, animation coordinates) remains local.
- NativeWind is an adapter: `nativewindTheme.ts` exposes the same tokens as CSS
  variables, and `tailwind.config.js` maps standard utilities to them.
- Learning's `learningTypography`, `learningLayout` and `learningTypeScale`
  are compatibility aliases of global tokens. `learningColors` extends the
  global palette only with game feedback, artwork and matching colors.
- ESLint prevents direct native text imports and literal style font sizes
  outside the shared primitives and token source. Prefer full semantic style
  spreads; use a role's `.fontSize` for intentional size-only overrides.

Check with `npm run check:mobile`, a production Expo export, and phone-width
visual checks for wrapping, clipping, sheets, feedback and both color schemes.
