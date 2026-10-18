import { Button, Form, Input, Space } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

export function EducationMatchingPairsEditor({ questionName, disabled }: { questionName: number; disabled: boolean }) {
  return <Form.List name={[questionName, 'matchingPairs']} rules={[{ validator: async (_, pairs: unknown[] | undefined) => {
    if (!pairs || pairs.length < 2 || pairs.length > 10) throw new Error('Add 2–10 matching pairs.');
  } }]}>
    {(fields, { add, remove }, { errors }) => <Space direction="vertical" style={{ display: 'flex' }}>
      {fields.map((field, index) => <Space key={field.key} align="baseline" wrap>
        <Form.Item name={[field.name, 'left', 'id']} hidden><Input /></Form.Item>
        <Form.Item name={[field.name, 'left', 'label']} label={`Item ${index + 1}`} rules={[{ required: true }, { max: 500 }]}>
          <Input disabled={disabled} placeholder="Left-side item" />
        </Form.Item>
        <Form.Item name={[field.name, 'right', 'id']} hidden><Input /></Form.Item>
        <Form.Item name={[field.name, 'right', 'label']} label="Correct match" rules={[{ required: true }, { max: 500 }]}>
          <Input disabled={disabled} placeholder="Right-side match" />
        </Form.Item>
        {!disabled && <Button aria-label={`Remove matching pair ${index + 1}`} danger type="text" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />}
      </Space>)}
      {!disabled && fields.length < 10 && <Button icon={<PlusOutlined />} onClick={() => add({
        left: { id: crypto.randomUUID(), label: '' }, right: { id: crypto.randomUUID(), label: '' },
      })}>Add matching pair</Button>}
      <Form.ErrorList errors={errors} />
    </Space>}
  </Form.List>;
}
