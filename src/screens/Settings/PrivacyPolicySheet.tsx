import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Ref = BottomSheetModal;

const PrivacyPolicySheet = forwardRef<Ref>((_, ref) => {
  const insets = useSafeAreaInsets();

  return (
    <CustomBottomSheetModal ref={ref} snapPoints={['95%']} enableDynamicSizing={false}>
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        {/* Header */}
        <Text className="mb-3 px-6 pt-4 text-xl font-bold">Privacy Policy</Text>

        {/* Scrollable Content */}
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <Text className="mb-2 text-lg font-semibold">1. Information We Collect</Text>
          <Text className="mb-3 text-sm text-slate-600">
            We collect information you provide directly to us, including your name, email address,
            and profile photo. We also collect learning progress data, including completed palaces,
            review history, XP, levels, and badges earned.
          </Text>

          <Text className="mb-2 text-lg font-semibold">2. How We Use Your Information</Text>
          <Text className="mb-3 text-sm text-slate-600">
            We use the information we collect to provide, maintain, and improve MemoPal's services,
            including tracking your learning progress, scheduling review reminders, and
            personalizing your experience. We also use your data to communicate with you about
            updates and features.
          </Text>

          <Text className="mb-2 text-lg font-semibold">3. Data Storage & Security</Text>
          <Text className="mb-3 text-sm text-slate-600">
            Your data is stored securely on encrypted servers. Premium users with cloud sync enabled
            will have their data stored on Google Cloud Platform. We use industry-standard security
            measures to protect your information.
          </Text>

          <Text className="mb-2 text-lg font-semibold">4. Data Sharing</Text>
          <Text className="mb-3 text-sm text-slate-600">
            We do not sell, trade, or share your personal information with third parties for
            marketing purposes. We may share anonymized, aggregated data for research and analytics
            purposes.
          </Text>

          <Text className="mb-2 text-lg font-semibold">5. Google Login & Cloud Sync</Text>
          <Text className="mb-3 text-sm text-slate-600">
            If you sign in with Google, we receive your basic profile information (name, email,
            profile photo) from Google. Cloud sync stores your learning data on secure Google
            servers and syncs across your devices.
          </Text>

          <Text className="mb-2 text-lg font-semibold">6. Your Rights</Text>
          <Text className="mb-3 text-sm text-slate-600">
            You have the right to access, update, or delete your personal data at any time. You can
            export your learning data or request complete account deletion from the Settings page.
          </Text>

          <Text className="mb-2 text-lg font-semibold">7. Children's Privacy</Text>
          <Text className="mb-3 text-sm text-slate-600">
            MemoPal is not intended for children under 13. We do not knowingly collect personal
            information from children under 13. If you believe we have collected such information,
            please contact us.
          </Text>

          <Text className="mb-2 text-lg font-semibold">8. Analytics & Cookies</Text>
          <Text className="mb-3 text-sm text-slate-600">
            We use analytics tools to understand how users interact with MemoPal. We use cookies and
            similar technologies to maintain your session and remember your preferences.
          </Text>

          <Text className="mb-2 text-lg font-semibold">9. Changes to This Policy</Text>
          <Text className="mb-3 text-sm text-slate-600">
            We may update this Privacy Policy from time to time. We will notify you of any
            significant changes via email or in-app notification. Continued use after changes
            constitutes acceptance.
          </Text>

          <Text className="mb-2 text-lg font-semibold">10. Contact Us</Text>
          <Text className="mb-3 text-sm text-slate-600">
            If you have questions about this Privacy Policy or your data, please contact us at
            privacy@mindpal.app or through the Help & FAQ section.
          </Text>
        </BottomSheetScrollView>
      </View>
    </CustomBottomSheetModal>
  );
});

export default PrivacyPolicySheet;
