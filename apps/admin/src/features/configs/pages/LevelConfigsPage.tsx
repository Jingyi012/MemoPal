import { PortalSectionNav } from "../../../components/PortalSectionNav";
import { LevelConfigTab } from '../components/LevelConfigTab';
import { PortalPageContainer } from '../../../components/PortalPageContainer';

export default function LevelConfigsPage() {
  return (
    <PortalPageContainer title="Player levels" description="Define progression thresholds and the rewards for reaching each level." eyebrow="Gamification" navigation={<PortalSectionNav section="configs" />}>
      <LevelConfigTab />
    </PortalPageContainer>
  );
}

