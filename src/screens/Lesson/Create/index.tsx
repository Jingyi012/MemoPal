import { ActionSheet } from '@/components/ActionSheet';
import { CommonHeader } from '@/components/CommonHeader';
import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { LessonForm, LessonWordForm } from '@/types/lesson';
import { useRouter } from 'expo-router';
import { LogOut, X } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { LessonInfoStep } from './LessonInfoStep';
import { LocationCanvasStep } from './LocationCanvasStep';
import { ReviewSummaryStep } from './ReviewSummaryStep';

interface Props {
  palaceId: string;
}

type CreateLessonStep = 'info' | 'locations' | 'review';

const STEPS: { key: CreateLessonStep; label: string }[] = [
  { key: 'info', label: 'General Info' },
  { key: 'locations', label: 'Add Words' },
  { key: 'review', label: 'Review' },
];

export const CreateLessonScreen: React.FC<Props> = ({ palaceId }) => {
  const router = useRouter();
  const [step, setStep] = useState<CreateLessonStep>('info');

  const [form, setForm] = useState<Omit<LessonForm, 'words'>>({
    palaceId,
    title: '',
    description: '',
    category: '',
    tag: '',
    privacy: 'private',
    isCustom: true,
  });

  const [words, setWords] = useState<LessonWordForm[]>([]);

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);
  const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState<boolean>(false);

  return (
    <View className="flex-1 bg-white">
      <CommonHeader
        title="Create Lesson"
        description="Fill in the details below"
        hideBackButton={true}
        actions={[
          {
            icon: X,
            onPress: () => {
              setIsDeleteSheetVisible(true);
            },
          },
        ]}
        additionalContent={
          <View className="mt-2">
            <SegmentedProgressBar
              total={3}
              current={currentStepIndex}
              label={STEPS[currentStepIndex].label}
            />
          </View>
        }
      />

      {step === 'info' && (
        <LessonInfoStep value={form} onChange={setForm} onNext={() => setStep('locations')} />
      )}

      {step === 'locations' && (
        <LocationCanvasStep
          palaceId={palaceId}
          words={words}
          onChangeWords={setWords}
          onPrevious={() => {
            setStep(STEPS[currentStepIndex - 1].key);
          }}
          onNext={() => setStep('review')}
        />
      )}

      {step === 'review' && (
        <ReviewSummaryStep
          form={{ ...form, words }}
          onEditInfo={() => setStep('info')}
          onEditWords={() => setStep('locations')}
          onSave={(lesson) => console.log('SAVE LESSON', lesson)}
        />
      )}

      <ActionSheet
        isVisible={isDeleteSheetVisible}
        onClose={() => setIsDeleteSheetVisible(false)}
        onAction={() => router.back()}
        title="Exit create mode?"
        description="Are you sure you want to stop creating this lesson? Nothing will be saved if you exit."
        actionLabel="Exit"
        variant="destructive"
        Icon={LogOut}
      />
    </View>
  );
};
