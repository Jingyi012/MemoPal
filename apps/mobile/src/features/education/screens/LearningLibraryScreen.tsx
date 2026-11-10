import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { LibraryScreen } from '@/features/library';
export default function LearningLibraryScreen() { const { user } = useAuth(); return user?.accountMode === 'RestrictedLearner' ? <Redirect href="/education/assignments" /> : <LibraryScreen memoryEntry />; }
