export interface PrivacyPolicySection {
  heading: string;
  body: string;
}

export interface PrivacyPolicyConfig {
  title: string;
  sections: PrivacyPolicySection[];
}

export const PRIVACY_POLICY_CONFIG_SCHEMA = {
  type: "object",
  title: "Privacy Policy Configuration",
  description: "Configure privacy policy content shown in mobile settings",
  properties: {
    title: {
      type: "string",
      title: "Policy Title",
      default: "Privacy Policy",
    },
    sections: {
      type: "array",
      title: "Policy Sections",
      items: {
        type: "object",
        title: "Section",
        properties: {
          heading: {
            type: "string",
            title: "Heading",
            minLength: 1,
          },
          body: {
            type: "string",
            title: "Body",
            minLength: 1,
          },
        },
        required: ["heading", "body"],
        additionalProperties: false,
      },
      default: [],
    },
  },
  required: ["title", "sections"],
  additionalProperties: false,
} as const;

export const PRIVACY_POLICY_CONFIG_DEFAULT: PrivacyPolicyConfig = {
  title: "Privacy Policy",
  sections: [
    {
      heading: "1. Information We Collect",
      body: "We collect information you provide directly to us, including your name, email address, and profile photo. We also collect learning progress data, including completed memories, review history, XP, levels, streaks, and milestones.",
    },
    {
      heading: "2. How We Use Your Information",
      body: "We use the information we collect to provide, maintain, and improve MemoPal's services, including tracking your learning progress, scheduling review reminders, and personalizing your experience. We also use your data to communicate with you about updates and features.",
    },
    {
      heading: "3. Data Storage & Security",
      body: "Your data is stored securely on encrypted servers. Premium users with cloud sync enabled will have their data stored on secure cloud infrastructure. We use industry-standard security measures to protect your information.",
    },
    {
      heading: "4. Data Sharing",
      body: "We do not sell, trade, or share your personal information with third parties for marketing purposes. We may share anonymized, aggregated data for research and analytics purposes.",
    },
    {
      heading: "5. Google Login & Cloud Sync",
      body: "If you sign in with Google, we receive your basic profile information (name, email, profile photo) from Google. Cloud sync stores your learning data securely and syncs across your devices.",
    },
    {
      heading: "6. Your Rights",
      body: "You have the right to access, update, or delete your personal data at any time. You can export your learning data or request complete account deletion from the Settings page.",
    },
    {
      heading: "7. Children's Privacy",
      body: "MemoPal is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us.",
    },
    {
      heading: "8. Analytics & Cookies",
      body: "We use analytics tools to understand how users interact with MemoPal. We use cookies and similar technologies to maintain your session and remember your preferences.",
    },
    {
      heading: "9. Changes to This Policy",
      body: "We may update this Privacy Policy from time to time. We will notify you of significant changes. Continued use after changes constitutes acceptance.",
    },
    {
      heading: "10. Contact Us",
      body: "If you have questions about this Privacy Policy or your data, please contact us at privacy@mindpal.app or through the Help & FAQ section.",
    },
  ],
};
