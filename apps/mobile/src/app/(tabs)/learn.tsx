import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import EducationPublicCoursesScreen from '@/features/education/screens/EducationPublicCoursesScreen';

export default function LearnTab() {
  const { user } = useAuth();
  if (user?.accountMode === 'RestrictedLearner') return <Redirect href="/education/assignments" />;
  return <EducationPublicCoursesScreen primaryEntry />;
}
