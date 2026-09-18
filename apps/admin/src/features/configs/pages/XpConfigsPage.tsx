import { PortalSectionNav } from "../../../components/PortalSectionNav";
import { XpConfigTab } from '../components/XpConfigTab';
import { PortalPageContainer } from '../../../components/PortalPageContainer';

export default function XpConfigsPage() {
  return (
    <PortalPageContainer title="XP rewards" description="Shape how learning, reviews and practice reward progress." eyebrow="Gamification" navigation={<PortalSectionNav section="configs" />}>
      <XpConfigTab />
    </PortalPageContainer>
  );
}

