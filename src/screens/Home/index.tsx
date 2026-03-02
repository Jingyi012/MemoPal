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
import React from 'react';
import { ScrollView, View } from 'react-native';
import { PalaceTrainingCard } from './PalaceTrainingCard';

const HomeScreen = () => {
  const { user } = useCurrentUser();
  const { userState, updateState } = useUserState();

  const isFirstTime = userState.isFirstTime ?? true;
  const showTutorialPrompt = !userState.ui.tutorialPromptDismissed;
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
              <TutorialPromptCard
                dismissTutorialPrompt={() =>
                  updateState({
                    ui: { ...userState.ui, tutorialPromptDismissed: true },
                  })
                }
                onViewTutorial={() =>
                  updateState({
                    ui: {
                      ...userState.ui,
                      tutorialPromptDismissed: true,
                      tutorialViewedAt: new Date().toISOString(),
                    },
                  })
                }
              />
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
