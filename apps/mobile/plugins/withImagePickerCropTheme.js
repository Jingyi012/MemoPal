const {
  AndroidConfig,
  withAndroidManifest,
  withAndroidStyles,
} = require('@expo/config-plugins');

const CROP_ACTIVITY = 'expo.modules.imagepicker.ExpoCropImageActivity';
const CROP_THEME = 'MemoPalImageCropTheme';

function withCropTheme(config) {
  return withAndroidStyles(config, (modConfig) => {
    const styles = modConfig.modResults.resources.style ?? [];
    const cropStyle = {
      $: {
        name: CROP_THEME,
        parent: 'Base.Theme.AppCompat',
      },
      item: [
        { $: { name: 'expoCropToolbarColor' }, _: '#FFFDF8' },
        { $: { name: 'expoCropToolbarIconColor' }, _: '#241F38' },
        { $: { name: 'expoCropToolbarActionTextColor' }, _: '#241F38' },
        { $: { name: 'expoCropBackButtonIconColor' }, _: '#241F38' },
        { $: { name: 'expoCropBackgroundColor' }, _: '#FFFDF8' },
        { $: { name: 'android:statusBarColor' }, _: '#FFFDF8' },
        { $: { name: 'android:navigationBarColor' }, _: '#FFFDF8' },
        { $: { name: 'android:windowLightStatusBar' }, _: 'true' },
        { $: { name: 'android:windowLightNavigationBar' }, _: 'true' },
        {
          $: {
            name: 'android:windowOptOutEdgeToEdgeEnforcement',
            'tools:targetApi': '35',
          },
          _: 'true',
        },
      ],
    };

    modConfig.modResults.resources.style = [
      cropStyle,
      ...styles.filter((style) => style.$?.name !== CROP_THEME),
    ];
    return modConfig;
  });
}

function withCropActivityTheme(config) {
  return withAndroidManifest(config, (modConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      modConfig.modResults,
    );
    application.activity = application.activity ?? [];

    let cropActivity = application.activity.find(
      (activity) => activity.$?.['android:name'] === CROP_ACTIVITY,
    );
    if (!cropActivity) {
      cropActivity = { $: { 'android:name': CROP_ACTIVITY } };
      application.activity.push(cropActivity);
    }

    cropActivity.$['android:theme'] = `@style/${CROP_THEME}`;
    cropActivity.$['android:exported'] = 'false';
    cropActivity.$['tools:replace'] = 'android:theme,android:exported';
    return modConfig;
  });
}

module.exports = function withImagePickerCropTheme(config) {
  config = withCropTheme(config);
  return withCropActivityTheme(config);
};
