import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import configure from '../app.config.ts';
const config = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
function properties(result) {
  return result.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
  )[1];
}
test('normal release retains platform packaging and enables code and resource shrinking', () => {
  const old = process.env.MEMOPAL_COMPACT_APK;
  try {
    delete process.env.MEMOPAL_COMPACT_APK;
    const result = configure({ config });
    const props = properties(result);
    assert.equal(props.android.enableMinifyInReleaseBuilds, true);
    assert.equal(props.android.enableShrinkResourcesInReleaseBuilds, true);
    assert.equal(props.android.enableBundleCompression, true);
    assert.equal(props.android.useLegacyPackaging, false);
    assert.equal(props.ios.deploymentTarget, '16.0');
    assert.equal(
      result.plugins.some((plugin) => plugin === './plugins/withChineseMlkitOcr'),
      true
    );
  } finally {
    if (old === undefined) delete process.env.MEMOPAL_COMPACT_APK;
    else process.env.MEMOPAL_COMPACT_APK = old;
  }
});
test('direct APK profile compresses native libraries without changing the store bundle profile', () => {
  const old = process.env.MEMOPAL_COMPACT_APK;
  try {
    process.env.MEMOPAL_COMPACT_APK = '1';
    assert.equal(properties(configure({ config })).android.useLegacyPackaging, true);
    const eas = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));
    assert.equal(eas.build.production.android.buildType, 'app-bundle');
    assert.equal(eas.build['production-apk'].env.MEMOPAL_COMPACT_APK, '1');
  } finally {
    if (old === undefined) delete process.env.MEMOPAL_COMPACT_APK;
    else process.env.MEMOPAL_COMPACT_APK = old;
  }
});
