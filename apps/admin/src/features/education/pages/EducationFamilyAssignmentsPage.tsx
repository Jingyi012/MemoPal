import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { FamilyAssignments } from '../components/FamilyAssignments';
import { useSearchParams } from 'react-router-dom';

export default function EducationFamilyAssignmentsPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  return <PortalPageContainer eyebrow="Learning workspace" title="Family practice" description="Assign learning activities to verified children and review their progress.">
    <FamilyAssignments key={`${user?.id}:${params.get('courseId')}:${params.get('assessmentId')}`} userId={user?.id ?? ''}
      initialCourseId={params.get('courseId') ?? ''} initialAssessmentId={params.get('assessmentId') ?? ''} />
  </PortalPageContainer>;
}
