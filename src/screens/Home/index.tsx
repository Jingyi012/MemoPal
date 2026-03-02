import { QuoteCard } from '@/components/information/QuoteCard';
import { PremiumUpdateCard } from '@/components/PremiumUpdateCard';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { motivationalQuotes } from '@/constants/motivationQuotes';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserState } from '@/contexts/UserStateContext';
import { HomeHeader } from '@/screens/Home/Header/HomeHeader';
import LearningPath from '@/screens/Home/LearningPath';
import { QuickState } from '@/screens/Home/QuickStat';
import { WhyThisWorkCard } from '@/screens/Home/WhyThisWorkCard';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { PalaceTrainingCard } from './PalaceTrainingCard';

const HomeScreen = () => {
  const { user } = useCurrentUser();
  const { userState } = useUserState();
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(true);

  const isFirstTime = userState.isFirstTime ?? true;
  const todayQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  return (
    <View className="flex-1">
      <HomeHeader userData={user ?? { id: 'guest', displayName: 'Guest', email: 'guest@local', totalXp: 0, level: 1, isPremium: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-4">
          {isFirstTime && <PalaceTrainingCard />}

          {showTutorialPrompt && (
            <View className="mt-3">
              <TutorialPromptCard dismissTutorialPrompt={() => setShowTutorialPrompt(false)} />
            </View>
          )}
          <LearningPath />
          <WhyThisWorkCard />
          <QuickState />
          <QuoteCard todayQuote={todayQuote} />
          <PremiumUpdateCard className="mt-6" />
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
