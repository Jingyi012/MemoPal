import { PortalSectionNav } from "../../../components/PortalSectionNav";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import FeatureLimitsTab from "../components/FeatureLimitsConfigTab";

export default function FeatureLimitsPage() {
  return (
    <PortalPageContainer title="Feature limits" description="Set the resources available to free and premium members." eyebrow="Gamification" navigation={<PortalSectionNav section="configs" />}>
      <FeatureLimitsTab />
    </PortalPageContainer>
  );
}
