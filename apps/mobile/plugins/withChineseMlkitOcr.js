const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod } = require('@expo/config-plugins');

const ANDROID_MODULE = path.join(
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'mlkitocr',
  'ExpoMlkitOcrModule.kt',
);
const IOS_MODULE = path.join('ios', 'ExpoMlkitOcrModule.swift');
const IOS_PODSPEC = path.join('ios', 'ExpoMlkitOcr.podspec');

function findOcrPackage(projectRoot) {
  const candidates = [
    path.join(projectRoot, 'node_modules', 'expo-mlkit-ocr'),
    path.join(projectRoot, '..', '..', 'node_modules', 'expo-mlkit-ocr'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function replaceOnce(contents, search, replacement, filePath) {
  if (!contents.includes(search)) {
    throw new Error(`MemoPal OCR patch could not find expected text in ${filePath}`);
  }
  return contents.replace(search, replacement);
}

function patchAndroid(packageRoot) {
  const modulePath = path.join(packageRoot, ANDROID_MODULE);
  const gradlePath = path.join(packageRoot, 'android', 'build.gradle');
  let module = fs.readFileSync(modulePath, 'utf8');
  let gradle = fs.readFileSync(gradlePath, 'utf8');

  if (!module.includes('ChineseTextRecognizerOptions')) {
    module = replaceOnce(
      module,
      'import com.google.mlkit.vision.text.latin.TextRecognizerOptions',
      'import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions',
      modulePath,
    );
    module = replaceOnce(
      module,
      'TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)',
      'TextRecognition.getClient(ChineseTextRecognizerOptions.Builder().build())',
      modulePath,
    );
  }
  if (!gradle.includes('text-recognition-chinese')) {
    gradle = replaceOnce(
      gradle,
      "implementation 'com.google.mlkit:text-recognition:16.0.1'",
      [
        "implementation 'com.google.mlkit:text-recognition:16.0.1'",
        "implementation 'com.google.mlkit:text-recognition-chinese:16.0.1'",
      ].join('\n'),
      gradlePath,
    );
  }

  fs.writeFileSync(modulePath, module);
  fs.writeFileSync(gradlePath, gradle);
}

function patchIos(packageRoot) {
  const modulePath = path.join(packageRoot, IOS_MODULE);
  const podspecPath = path.join(packageRoot, IOS_PODSPEC);
  let module = fs.readFileSync(modulePath, 'utf8');
  let podspec = fs.readFileSync(podspecPath, 'utf8');

  if (!module.includes('MLKitTextRecognitionChinese')) {
    module = replaceOnce(
      module,
      'import MLKitTextRecognition\nimport MLKitVision',
      'import MLKitTextRecognition\nimport MLKitTextRecognitionChinese\nimport MLKitVision',
      modulePath,
    );
    module = replaceOnce(
      module,
      'let textRecognizer = TextRecognizer.textRecognizer()',
      [
        'let chineseOptions = ChineseTextRecognizerOptions()',
        'let textRecognizer = TextRecognizer.textRecognizer(options: chineseOptions)',
      ].join('\n        '),
      modulePath,
    );
    module = replaceOnce(
      module,
      'request.usesLanguageCorrection = true',
      [
        'request.usesLanguageCorrection = true',
        'request.recognitionLanguages = ["zh-Hans", "en-US"]',
      ].join('\n      '),
      modulePath,
    );
  }
  if (!podspec.includes('TextRecognitionChinese')) {
    podspec = replaceOnce(
      podspec,
      "s.dependency 'GoogleMLKit/TextRecognition', '~> 7.0'",
      [
        "s.dependency 'GoogleMLKit/TextRecognition', '~> 7.0'",
        "s.dependency 'GoogleMLKit/TextRecognitionChinese', '~> 7.0'",
      ].join('\n    '),
      podspecPath,
    );
  }

  fs.writeFileSync(modulePath, module);
  fs.writeFileSync(podspecPath, podspec);
}

module.exports = function withChineseMlkitOcr(config) {
  config = withDangerousMod(config, ['android', async (modConfig) => {
    const packageRoot = findOcrPackage(modConfig.modRequest.projectRoot);
    if (!packageRoot) throw new Error('expo-mlkit-ocr package was not found');
    patchAndroid(packageRoot);
    return modConfig;
  }]);

  return withDangerousMod(config, ['ios', async (modConfig) => {
    const packageRoot = findOcrPackage(modConfig.modRequest.projectRoot);
    if (!packageRoot) throw new Error('expo-mlkit-ocr package was not found');
    patchIos(packageRoot);
    return modConfig;
  }]);
};
