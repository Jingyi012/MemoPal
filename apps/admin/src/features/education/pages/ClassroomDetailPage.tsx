import { useMemo, useState } from 'react';
import { App, Button, Card, Col, Popconfirm, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography } from 'antd';
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
import { useEducationText } from '../i18n/useEducationText';

export default function ClassroomDetailPage() {
  const { classroomId = '' } = useParams();
  const { user } = useAuth();
  const { modal } = App.useApp();
  const { t } = useEducationText();
  const [activeTab, setActiveTab] = useState('overview');
  const relationships = useEducationRelationships(user?.id ?? '');
  const classroomQuery = relationships.classrooms;
  const classroom = classroomQuery.data?.find(item => item.id === classroomId);
  const owner = classroom?.role === 'owner';
  const educator = owner || classroom?.role === 'teacher';
  const members = useClassroomMembers(user?.id ?? '', classroomId, educator);
  const courses = useEducationCourses(user?.id ?? '');
  const linked = useClassroomCourses(user?.id ?? '', classroomId, ['owner', 'teacher', 'student'].includes(classroom?.role ?? ''));
  const [courseToLink, setCourseToLink] = useState<string>();
  const linkedIds = useMemo(() => new Set(linked.courses.data?.map(course => course.courseId) ?? []), [linked.courses.data]);
  const availableCourses = (courses.courses.data ?? []).filter(course => !linkedIds.has(course.id));
  const linkedRows = linked.courses.data ?? [];
  const memberCount = members.data?.filter(member => member.status === 'active').length;

  const membersSection = <Card title={t('members')} extra={owner && <InviteMemberForm loading={relationships.invite.isPending} onSubmit={input => relationships.invite.mutate({ classroomId, input })} />}>
    {classroom?.role === 'student' ? <Typography>{t('memberDetailsPrivate')}</Typography> : <QueryState query={members} emptyText={t('noMembers')}>
      {rows => <Table rowKey="id" pagination={false} scroll={{ x: 'max-content' }} dataSource={rows} columns={[
        { title: t('member'), render: (_: unknown, row) => <div><div>{row.userDisplayName || 'MemoPal user'}</div><Typography.Text type="secondary">{row.userId}</Typography.Text></div> },
        { title: t('role'), dataIndex: 'role', render: (role: string) => <Tag>{role}</Tag> },
        { title: t('status'), dataIndex: 'status', render: (status: string) => <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'gold' : 'default'}>{status}</Tag> },
        { title: t('expires'), dataIndex: 'expiresAt', render: (date: string) => new Date(date).toLocaleString() },
        { title: '', key: 'action', render: (_: unknown, row) => owner && row.status !== 'revoked' ? <Button danger type="link" onClick={() => modal.confirm({ title: t('revokeMember'), content: t('revokeMemberBody'), okText: t('revoke'), okButtonProps: { danger: true }, onOk: () => relationships.revokeMembership.mutateAsync({ membershipId: row.id, classroomId }) })}>{t('revoke')}</Button> : null },
      ]} />}
    </QueryState>}
  </Card>;

  const coursesSection = <Card title={t('classCourses')}>
    {educator && <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
      <Col flex="1 1 240px"><Select aria-label={t('selectCourse')} placeholder={t('selectCourse')} value={courseToLink} onChange={setCourseToLink} style={{ width: '100%' }} options={availableCourses.map(course => ({ value: course.id, label: course.title }))} /></Col>
      <Col><Button type="primary" disabled={!courseToLink} loading={linked.attach.isPending} onClick={() => courseToLink && linked.attach.mutate(courseToLink)}>{t('linkCourse')}</Button></Col>
    </Row>}
    {educator && courses.courses.isError && <Typography.Text role="alert" type="danger">{t('loadError')}</Typography.Text>}
    {educator && !courses.courses.isPending && availableCourses.length === 0 && linkedRows.length === 0 && <Typography.Paragraph type="secondary">{t('noOwnedCourses')}</Typography.Paragraph>}
    <QueryState query={linked.courses} emptyText={t('noCourses')}>{rows => <Table rowKey="courseId" pagination={false} scroll={{ x: 'max-content' }} dataSource={rows} columns={[
      { title: t('classCourses'), dataIndex: 'title', width: 220 },
      { title: t('objectives'), render: (_: unknown, row) => row.objectives.length ? row.objectives.map(objective => <div key={objective.id}>{objective.title} <Tag>{objective.publishedStudyItemCount} · {t('published')}</Tag></div>) : <Typography.Text type="secondary">{t('objectiveEmpty')}</Typography.Text> },
      { title: t('guidedPractice'), render: (_: unknown, row) => row.canManageGuidedPractice ? <Space>
        <Switch aria-label={t('guidedPractice')} checked={row.guidedPracticeEnabled} loading={linked.setGuidedPractice.isPending}
          onChange={enabled => enabled
            ? modal.confirm({ title: t('guidedPracticeConfirmTitle'), content: t('guidedPracticeConfirmBody'), okText: t('guidedPracticeEnable'), cancelText: t('cancel'), onOk: () => linked.setGuidedPractice.mutateAsync({ courseId: row.courseId, enabled: true }) })
            : linked.setGuidedPractice.mutate({ courseId: row.courseId, enabled: false })} />
        <Typography.Text type="secondary">{row.guidedPracticeEnabled ? t('guidedPracticeOn') : t('guidedPracticeOff')}</Typography.Text>
      </Space> : null },
      { title: '', render: (_: unknown, row) => educator ? <Popconfirm title={t('unlinkTitle')} description={t('unlinkDescription')} okText={t('unlink')} cancelText={t('cancel')} onConfirm={() => linked.detach.mutate(row.courseId)}>
        <Button danger loading={linked.detach.isPending}>{t('unlink')}</Button>
      </Popconfirm> : null },
    ]} />}</QueryState>
    <Typography.Text type="secondary">{t('publishedHelp')}</Typography.Text>
  </Card>;

  const items = [
    { key: 'overview', label: t('overview'), children: <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={8}><Card><Statistic title={t('members')} value={memberCount ?? '—'} loading={members.isPending} /></Card></Col>
        <Col xs={24} sm={12} xl={8}><Card><Statistic title={t('classCourses')} value={linked.courses.data?.length ?? '—'} loading={linked.courses.isPending} /></Card></Col>
      </Row>
      <Card title={t('quickActions')} style={{ marginTop: 16 }}>
        <Space wrap>
          {owner && <Button onClick={() => setActiveTab('people')}>{t('inviteMembers')}</Button>}
          <Button onClick={() => setActiveTab('courses')}>{t('manageCourses')}</Button>
          {educator && <Button type="primary" onClick={() => setActiveTab('classwork')}>{t('createAssignment')}</Button>}
        </Space>
      </Card>
      <Card title={t('classroomFlow')} style={{ marginTop: 16 }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>{t('classroomFlowDescription')}</Typography.Paragraph>
      </Card>
    </> },
    { key: 'people', label: t('members'), children: membersSection },
    { key: 'courses', label: t('classCourses'), children: coursesSection },
    ...(educator ? [
      { key: 'classwork', label: t('classwork'), children: <ClassroomAssignments userId={user?.id ?? ''} classroomId={classroomId} canManage /> },
      { key: 'progress', label: t('progress'), children: <ClassroomObjectiveProgress userId={user?.id ?? ''} classroomId={classroomId} enabled /> },
    ] : []),
  ];

  return <PortalPageContainer className="classroom-detail-page" eyebrow={t('classroom')} title={classroom?.name ?? t('classroom')} description={t('classroomPageDescription')}>
    {!classroomQuery.isPending && !classroom && <Typography.Text role="alert" type="danger">{t('loadError')}</Typography.Text>}
    {classroom && <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} destroyOnHidden />}
  </PortalPageContainer>;
}
