import { Select } from 'antd';
import { useEducationCourse } from '../hooks/useEducationAuthoring';

export function PublishedAssessmentSelect({ userId, courseId, value, onChange }: {
  userId: string; courseId: string; value?: string; onChange?: (value: string) => void;
}) {
  const course = useEducationCourse(userId, courseId);
  const assessments = (course.assessments.data ?? []).filter(item => item.status === 'published');
  return <Select value={value} onChange={onChange} loading={course.assessments.isPending} disabled={!courseId}
    placeholder="Choose a published assessment" options={assessments.map(item => ({ value: item.id, label: `${item.title} · v${item.version}` }))} />;
}
