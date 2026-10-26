import { useMemo, useState } from 'react';
import { App, Button, Card, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { useClassroomMembers, useEducationRelationships } from '../hooks/useEducationRelationships';
import { QueryState } from '../components/QueryState';
import { InviteMemberForm } from '../components/RelationshipForms';
import { ClassroomAssignments } from '../components/ClassroomAssignments';
import { ClassroomObjectiveProgress } from '../components/ClassroomObjectiveProgress';
import { useEducationCourses } from '../hooks/useEducationAuthoring';
import { useClassroomCourses } from '../hooks/useEducationStudyItems';
import { LanguageSwitch } from '../components/EducationObjectiveStudyEditor';
import { useEducationText } from '../i18n/useEducationText';

export default function ClassroomDetailPage() {
  const { classroomId = '' } = useParams();
  const { user } = useAuth();
  const { modal } = App.useApp();
  const { t } = useEducationText();
  const relationships = useEducationRelationships(user?.id ?? '');
  const classroomQuery = relationships.classrooms;
  const classroom = classroomQuery.data?.find(item => item.id === classroomId);
  const owner = classroom?.role === 'owner';
  const educator = classroom?.role === 'owner' || classroom?.role === 'teacher';
  const members = useClassroomMembers(user?.id ?? '', classroomId, educator);
  const courses = useEducationCourses(user?.id ?? '');
  const linked = useClassroomCourses(user?.id ?? '', classroomId, ['owner', 'teacher', 'student'].includes(classroom?.role ?? ''));
  const [courseToLink, setCourseToLink] = useState<string>();
  const linkedIds = useMemo(() => new Set(linked.courses.data?.map(course => course.courseId) ?? []), [linked.courses.data]);
  const availableCourses = (courses.courses.data ?? []).filter(course => !linkedIds.has(course.id));

  return <PortalPageContainer eyebrow={t('classroom')} title={classroom?.name ?? t('classroom')} description={t('classroomPageDescription')} actions={<Space><LanguageSwitch />{owner && <InviteMemberForm loading={relationships.invite.isPending} onSubmit={input => relationships.invite.mutate({ classroomId, input })} />}</Space>}>
    {!classroomQuery.isPending && !classroom && <Typography.Text role="alert" type="danger">{t('loadError')}</Typography.Text>}
    <Card title={t('members')} style={{ marginBottom: 20 }}>{classroom?.role === 'student' ? <Typography>{t('memberDetailsPrivate')}</Typography> : <QueryState query={members} emptyText={t('noMembers')}>{rows => <Table rowKey="id" pagination={false} dataSource={rows} columns={[
      { title: t('member'), render: (_: unknown, row) => <div><div>{row.userDisplayName || 'MemoPal user'}</div><Typography.Text type="secondary">{row.userId}</Typography.Text></div> },
      { title: t('role'), dataIndex: 'role', render: (role: string) => <Tag>{role}</Tag> },
      { title: t('status'), dataIndex: 'status', render: (status: string) => <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'gold' : 'default'}>{status}</Tag> },
      { title: t('expires'), dataIndex: 'expiresAt', render: (date: string) => new Date(date).toLocaleString() },
      { title: '', key: 'action', render: (_: unknown, row) => owner && row.status !== 'revoked' ? <Button danger type="link" onClick={() => modal.confirm({ title: t('revokeMember'), content: t('revokeMemberBody'), okText: t('revoke'), okButtonProps: { danger: true }, onOk: () => relationships.revokeMembership.mutateAsync({ membershipId: row.id, classroomId }) })}>{t('revoke')}</Button> : null },
    ]} />}</QueryState>}</Card>

    <Card title={t('classCourses')} style={{ marginBottom: 20 }} extra={educator && <Space>
      <Select aria-label={t('selectCourse')} placeholder={t('selectCourse')} value={courseToLink} onChange={setCourseToLink} style={{ minWidth: 240 }} options={availableCourses.map(course => ({ value: course.id, label: course.title }))} />
      <Button type="primary" disabled={!courseToLink} loading={linked.attach.isPending} onClick={() => courseToLink && linked.attach.mutate(courseToLink)}>{t('linkCourse')}</Button>
    </Space>}>
      {educator && courses.courses.isError && <Typography.Text role="alert" type="danger">{t('loadError')}</Typography.Text>}
      {educator && !courses.courses.isPending && availableCourses.length === 0 && linked.courses.data?.length === 0 && <Typography.Text type="secondary">{t('noOwnedCourses')}</Typography.Text>}
      <QueryState query={linked.courses} emptyText={t('noCourses')}>{rows => <Table rowKey="courseId" pagination={false} dataSource={rows} columns={[
        { title: t('classCourses'), dataIndex: 'title' },
        { title: t('objectives'), render: (_: unknown, row) => row.objectives.map(objective => <div key={objective.id}>
          {objective.title} <Tag>{objective.publishedStudyItemCount} · {t('published')}</Tag>
        </div>) },
        { title: '', render: (_: unknown, row) => educator ? <Popconfirm title={t('unlinkTitle')} description={t('unlinkDescription')} okText={t('unlink')} cancelText={t('cancel')} onConfirm={() => linked.detach.mutate(row.courseId)}>
          <Button danger loading={linked.detach.isPending}>{t('unlink')}</Button>
        </Popconfirm> : null },
      ]} />}</QueryState>
      <Typography.Text type="secondary">{t('publishedHelp')}</Typography.Text>
    </Card>

    {educator && <ClassroomObjectiveProgress userId={user?.id ?? ''} classroomId={classroomId} enabled />}
    {educator && <ClassroomAssignments userId={user?.id ?? ''} classroomId={classroomId} canManage />}
  </PortalPageContainer>;
}
