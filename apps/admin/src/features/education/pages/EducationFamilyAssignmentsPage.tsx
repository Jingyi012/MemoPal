import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { FamilyAssignments } from '../components/FamilyAssignments';

export default function EducationFamilyAssignmentsPage() {
  const { user } = useAuth();
  return <PortalPageContainer eyebrow="Learning workspace" title="Family practice" description="Assign learning activities to verified children and review their progress.">
    <FamilyAssignments userId={user?.id ?? ''} />
  </PortalPageContainer>;
}
