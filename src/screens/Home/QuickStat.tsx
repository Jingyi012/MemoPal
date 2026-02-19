import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'expo-router';
import { Award, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { StatCard } from '../../components/StatCard';

export const QuickState: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  return (
    <View className="mt-6 flex-row gap-2">
      <StatCard
        label="Level"
        value={user?.level}
        bgClass="bg-teal-100"
        icon={<TrendingUp size={16} color="#0d9488" />}
      />

      <StatCard
        label="XP"
        value={user?.totalXp}
        bgClass="bg-orange-100"
        navigate={() => router.push('/badges')}
        icon={<Award size={16} color="#ea580c" />}
      />

      <StatCard
        label="Streak"
        value={user?.stats?.currentStreak}
        bgClass="bg-red-100"
        icon={<Text className="text-lg">🔥</Text>}
      />
    </View>
  );
};
