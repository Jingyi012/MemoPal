import { Alert, Button, Card, Checkbox, Form, Modal, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { QueryState } from '../components/QueryState';
import { EducationQuestionEditor, type AssessmentFormValue } from '../components/EducationQuestionEditor';
import { useEducationAssessment, useEducationCourse } from '../hooks/useEducationAuthoring';
import { useEducationText } from '../i18n/useEducationText';
import { EducationBackLink } from '../components/EducationBackLink';
import { adminPaths } from '../../../navigation/adminPaths';

export default function EducationAssessmentPage() {
  const { assessmentId = '' } = useParams();
  const { user } = useAuth();
  const { t } = useEducationText();
  const [form] = Form.useForm<AssessmentFormValue>();
  const [publicPractice, setPublicPractice] = useState(false);
  const [publicationOpen, setPublicationOpen] = useState(false);
  const data = useEducationAssessment(user?.id ?? '', assessmentId);
  const assessment = data.assessment.data;
  const courseData = useEducationCourse(user?.id ?? '', assessment?.courseId ?? '');

  useEffect(() => {
    if (!assessment) return;
    form.setFieldsValue({
      title: assessment.title,
      questions: assessment.questions.map(question => ({
        ...question,
        fillMode: question.fillMode ?? undefined,
        fillUseWordBank: question.type === 'fill-blank' && question.options.length > 0,
        allowedTextAnswers: question.allowedTextAnswers.join('\n'),
        allowedNumericAnswers: question.allowedNumericAnswers.join(', '),
      })),
    });
  }, [assessment, form]);

  return <PortalPageContainer eyebrow="Assessment" title={assessment?.title ?? 'Assessment'} description="Build an assessment with reusable objective question types."
    navigation={<EducationBackLink to={assessment ? adminPaths.educationCourse(assessment.courseId) : adminPaths.educationCourses}>{t('backToCourse')}</EducationBackLink>}
    actions={assessment?.status === 'draft' ? <Button type="primary" loading={data.publish.isPending} disabled={!assessment.questions.length} onClick={() => { setPublicPractice(false); setPublicationOpen(true); }}>Publish</Button> : assessment && <Tag color="green">Published v{assessment.version}</Tag>}>
    <Modal title="Publish this assessment?" open={publicationOpen} okText="Publish" confirmLoading={data.publish.isPending}
      onCancel={() => !data.publish.isPending && setPublicationOpen(false)} onOk={async () => {
        if (!assessment) return;
        try {
          await data.publish.mutateAsync({ version: assessment.version, isPublicPractice: publicPractice });
          setPublicationOpen(false);
        } catch { /* The mutation displays the error; keep the selected publication choice. */ }
      }}>
      <Space direction="vertical">
      <span>Published question content is frozen. Future changes require a new assessment version.</span>
      <Checkbox checked={publicPractice} disabled={data.publish.isPending} onChange={event => setPublicPractice(event.target.checked)}>
        Include objective questions in public self-practice
      </Checkbox>
      {publicPractice && <Alert type="warning" showIcon message="Public questions are not confidential and must not be used for secure exams." />}
      <Alert type="info" showIcon message={t('guidedPracticeAssessmentHelp')} />
      </Space>
    </Modal>
    <QueryState query={data.assessment}>
      {loaded => <>
        {loaded.status === 'published' && <Alert type="info" showIcon message={loaded.isPublicPractice
          ? 'Published for public self-practice. Keep confidential exam questions in a separate assessment.'
          : 'This assessment is published privately for authorized assignments; its question content is read-only.'}
          style={{ marginBottom: 16 }} />}
        {courseData.objectives.isError && <Alert type="error" showIcon message="Learning objectives could not be loaded." action={<Button onClick={() => void courseData.objectives.refetch()}>Retry</Button>} />}
        {courseData.objectives.isPending ? <Card loading /> : <Card>
          <EducationQuestionEditor
            form={form}
            objectives={courseData.objectives.data ?? []}
            disabled={loaded.status !== 'draft'}
            saving={data.update.isPending}
            onSave={(title, questions) => data.update.mutate({ expectedVersion: loaded.version, title, questions })}
          />
        </Card>}
        <Space style={{ marginTop: 12 }}>
          <Tag>Version {loaded.version}</Tag>
          {loaded.publishedAt && <Tag>Published {new Date(loaded.publishedAt).toLocaleString()}</Tag>}
          {data.update.isError && <Button onClick={() => void data.assessment.refetch()}>Reload latest draft</Button>}
        </Space>
      </>}
    </QueryState>
  </PortalPageContainer>;
}
