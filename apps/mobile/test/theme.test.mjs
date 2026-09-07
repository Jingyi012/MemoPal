import assert from 'node:assert/strict';
import test from 'node:test';
import { memopalThemes } from '../src/theme/memopalTheme.ts';

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
