// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/designSystem.ts', 'src/components/ui/AppText.tsx', 'src/components/ui/AppTextInput.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'react-native', importNames: ['Text', 'TextInput'], message: 'Use AppText / AppTextInput so typography and theme defaults stay consistent.' }],
      }],
      'no-restricted-syntax': ['error', {
        selector: "Property[key.name='fontSize'][value.type='Literal']",
        message: 'Use appTextStyles or appArtworkSizes from theme/designSystem instead of a local font size.',
      }],
    },
  },
]);
