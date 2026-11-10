import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { DiscoverMemorySetsScreen } from '@/features/library';
export default function LearningDiscoverScreen() { const { user } = useAuth(); return user?.accountMode === 'RestrictedLearner' ? <Redirect href="/education/assignments" /> : <DiscoverMemorySetsScreen />; }
