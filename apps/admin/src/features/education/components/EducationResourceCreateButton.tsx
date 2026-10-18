import { Button, Form, Input, Modal, Select } from 'antd';
import { useState } from 'react';

export function EducationResourceCreateButton({ label, noun, loading, onSubmit, memorySets }: {
  label: string; noun: string; loading: boolean; onSubmit: (title: string, recommendedMemorySetId?: string) => void;
  memorySets?: readonly { id: string; title: string; techniqueKey: string }[];
}) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="primary" onClick={() => setOpen(true)}>{label}</Button>
    <Modal title={label} open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
      <Form layout="vertical" onFinish={value => { onSubmit(value.title, value.recommendedMemorySetId); setOpen(false); }}>
        <Form.Item name="title" label={`${noun} title`} rules={[{ required: true }, { max: 200 }]}>
          <Input autoFocus maxLength={200} />
        </Form.Item>
        {memorySets && <Form.Item name="recommendedMemorySetId" label="Recommended memory practice (optional)" extra="Only currently public, visible sets are listed. Learners open the set through Community.">
          <Select allowClear placeholder="No recommendation" options={memorySets.map(set => ({ value: set.id, label: `${set.title} · ${set.techniqueKey === 'palace' ? 'Memory Palace' : 'Number Peg'}` }))} />
        </Form.Item>}
        <Button type="primary" htmlType="submit" loading={loading}>Create</Button>
      </Form>
    </Modal>
  </>;
}
