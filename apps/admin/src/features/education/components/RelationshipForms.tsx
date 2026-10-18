import { Button, Form, Input, Modal, Select, Typography } from 'antd';
import { useState } from 'react';
import type { CreateClassroomRequest, CreateGuardianLinkRequest, InviteClassroomMemberRequest } from '../../../types/educationRelationships';

export function CreateClassroomButton({ onSubmit, loading }: { onSubmit: (value: CreateClassroomRequest) => void; loading: boolean }) {
  const [open, setOpen] = useState(false);
  return <><Button type="primary" onClick={() => setOpen(true)}>Create classroom</Button><Modal title="Create classroom" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
    <Form layout="vertical" onFinish={value => { onSubmit(value); setOpen(false); }}><Form.Item name="name" label="Classroom name" rules={[{ required: true }, { max: 120 }]}><Input maxLength={120} /></Form.Item><Button type="primary" htmlType="submit" loading={loading}>Create</Button></Form>
  </Modal></>;
}

export function InviteMemberForm({ onSubmit, loading }: { onSubmit: (value: InviteClassroomMemberRequest) => void; loading: boolean }) {
  return <Form layout="inline" onFinish={onSubmit}><Form.Item name="userId" rules={[{ required: true, message: 'Enter a MemoPal account ID.' }]}><Input placeholder="MemoPal account ID" /></Form.Item><Form.Item name="role" initialValue="student"><Select options={[{ value: 'student', label: 'Student' }, { value: 'teacher', label: 'Teacher' }]} /></Form.Item><Button type="primary" htmlType="submit" loading={loading}>Invite</Button><Typography.Text type="secondary" style={{ width: '100%' }}>Ask them to copy their account ID from Education → Assignments.</Typography.Text></Form>;
}

export function CreateGuardianLinkForm({ onSubmit, loading }: { onSubmit: (value: CreateGuardianLinkRequest) => void; loading: boolean }) {
  return <Form layout="inline" onFinish={onSubmit}><Form.Item name="studentUserId" rules={[{ required: true, message: 'Enter the student’s MemoPal account ID.' }]}><Input placeholder="Student account ID" /></Form.Item><Button type="primary" htmlType="submit" loading={loading}>Request family link</Button><Typography.Text type="secondary" style={{ width: '100%' }}>The student must confirm, then an administrator verifies the relationship before any family data is shared.</Typography.Text></Form>;
}
