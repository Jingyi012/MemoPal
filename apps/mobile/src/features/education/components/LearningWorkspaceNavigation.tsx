import { LearningChoiceMenu } from './LearningChoiceMenu';
import { useLearningCopy } from './LearningUi';

export function LearningWorkspaceNavigation({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: readonly { value: string; label: string }[] }) {
  const { zh } = useLearningCopy();
  return <LearningChoiceMenu value={value} onChange={onChange} options={options} title={zh ? '浏览什么内容？' : 'What would you like to browse?'} />;
}
