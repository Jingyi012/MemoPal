export function guidedStarterSessionHref(memorySetId: string) {
  return `/number-peg/${encodeURIComponent(memorySetId)}?guided=1&returnTo=practice` as const;
}

export function practiceCreateHref(
  onboardingStatus: string | null | undefined,
  onboardingMemorySetId: string | null | undefined,
  requestedGuide: boolean,
) {
  if (requestedGuide) {
    return '/onboarding?replay=true' as const;
  }
  if (onboardingStatus === 'in-progress' && onboardingMemorySetId) {
    return guidedStarterSessionHref(onboardingMemorySetId);
  }
  if (onboardingStatus === 'not-started' || onboardingStatus === 'in-progress') {
    return '/onboarding?replay=true' as const;
  }
  return '/create-memory' as const;
}
