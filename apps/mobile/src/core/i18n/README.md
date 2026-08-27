# MemoPal mobile translations

Translations live in [`i18n.ts`](./i18n.ts) and are grouped by screen or feature namespace. This keeps a screen's copy together instead of scattering keys across a global dictionary.

## Adding or changing copy

1. Find the screen namespace (`home`, `practice`, `numberPeg`, `palace`, `memoryComposer`, and so on).
2. Add the same key to both `translations.en` and `translations.zh`.
3. Read it in the screen with `useTranslation('namespace')` and `t('key')`.
4. Keep server-authored content (memory titles, user names, admin-configured premium copy) as data; translate only the surrounding UI labels.

The `system` preference is resolved from the device locale and currently maps Chinese locales to `zh`, with English as the fallback. User-selected `en` or `zh` overrides the system preference and is persisted with the rest of the user settings.

When a new route is added, create its namespace before adding UI strings. This makes a route's translation surface easy to review and prevents new hard-coded labels from becoming invisible to localization work.
