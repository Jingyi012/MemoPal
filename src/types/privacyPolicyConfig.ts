export type PrivacyPolicySection = {
  heading: string;
  body: string;
};

export type PrivacyPolicyConfig = {
  title: string;
  sections: PrivacyPolicySection[];
};
