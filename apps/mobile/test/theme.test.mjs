import assert from 'node:assert/strict';
import test from 'node:test';
import { memopalThemes } from '../src/theme/memopalTheme.ts';
import { learningColors } from '../src/features/education/theme/learningTokens.ts';

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const [mode, theme] of Object.entries(memopalThemes)) {
  test(`${mode}: card titles and body copy meet normal-text contrast`, () => {
    for (const surface of ['canvas', 'paper', 'sunTint', 'violetTint', 'berryTint', 'mintTint', 'skyTint', 'peachTint']) {
      for (const text of ['ink', 'inkSoft']) {
        const ratio = contrast(theme[text], theme[surface]);
        assert.ok(ratio >= 4.5, `${text} on ${surface}: ${ratio.toFixed(2)}:1`);
      }
    }
  });
  test(`${mode}: actions and status labels stay legible`, () => {
    for (const [text, surface] of [
      ['onSun', 'sun'], ['onSun', 'violet'], ['onSun', 'sunDeep'],
      ['onAccent', 'violetDeep'], ['onAccent', 'berryDeep'],
      ['violetDeep', 'violetTint'], ['berryDeep', 'berryTint'],
      ['successText', 'mintTint'], ['link', 'paper'],
    ]) {
      const ratio = contrast(theme[text], theme[surface]);
      assert.ok(ratio >= 4.5, `${text} on ${surface}: ${ratio.toFixed(2)}:1`);
    }
  });
}

for (const [mode, colors] of Object.entries(learningColors)) {
  const theme = { ...memopalThemes[mode], ...colors };
  test(`${mode}: learning text stays readable on cards, feedback and matching surfaces`, () => {
    for (const surface of ['canvas', 'paper', 'violetTint', 'mintTint', 'berryTint', 'pairOrangeTint', 'pairCyanTint']) {
      for (const text of ['ink', 'inkSoft']) {
        assert.ok(contrast(theme[text], theme[surface]) >= 4.5, `${text} on ${surface}`);
      }
    }
  });
  test(`${mode}: learning hero and action labels meet AA contrast`, () => {
    for (const [foreground, background] of [
      ...theme.hero.map(background => [theme.heroInk, background]),
      [theme.heroSurfaceInk, theme.heroSurface],
      [theme.onAccent, theme.violetDeep], [theme.onAccent, theme.berryDeep],
      [theme.onAccent, theme.successText], [theme.violetDeep, theme.violetTint],
      [theme.successText, theme.mintTint], [theme.berryDeep, theme.berryTint],
    ]) assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  });
}
