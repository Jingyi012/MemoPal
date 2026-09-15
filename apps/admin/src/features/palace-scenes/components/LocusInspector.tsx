import { Col, Form, Input, InputNumber, Row, Typography } from 'antd';
import type { PalaceLocusInput } from '../../../types/palaceScene';

export function LocusInspector({ locus, disabled, onChange }: { locus?: PalaceLocusInput; disabled: boolean; onChange: (value: Partial<PalaceLocusInput>) => void }) {
  return <section className='studio-editor-section'><Typography.Title level={4} style={{ marginTop: 0 }}>Memory point details</Typography.Title>
    {!locus ? <Typography.Paragraph type='secondary'>Add a point on the image or select an existing point to edit its details.</Typography.Paragraph> : <Form layout='vertical' disabled={disabled}>
      <Form.Item label='English point name' htmlFor='locus-name-en' required><Input id='locus-name-en' maxLength={100} value={locus.nameEn ?? locus.name} onChange={e => onChange({ name: e.target.value, nameEn: e.target.value })} /></Form.Item>
      <Form.Item label='Chinese point name' htmlFor='locus-name-zh'><Input id='locus-name-zh' maxLength={100} value={locus.nameZh ?? ''} onChange={e => onChange({ nameZh: e.target.value })} /></Form.Item>
      <Form.Item label='English point description' htmlFor='locus-description-en'><Input.TextArea id='locus-description-en' rows={2} maxLength={500} value={locus.descriptionEn ?? locus.description ?? ''} onChange={e => onChange({ description: e.target.value, descriptionEn: e.target.value })} /></Form.Item>
      <Form.Item label='Chinese point description' htmlFor='locus-description-zh'><Input.TextArea id='locus-description-zh' rows={2} maxLength={500} value={locus.descriptionZh ?? ''} onChange={e => onChange({ descriptionZh: e.target.value })} /></Form.Item>
      <Row gutter={12}><Col span={12}><Form.Item label='X position (%)'><InputNumber aria-label='X position' min={0} max={100} precision={1} value={locus.xPercent} onChange={value => onChange({ xPercent: value ?? locus.xPercent })} style={{ width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item label='Y position (%)'><InputNumber aria-label='Y position' min={0} max={100} precision={1} value={locus.yPercent} onChange={value => onChange({ yPercent: value ?? locus.yPercent })} style={{ width: '100%' }} /></Form.Item></Col></Row>
      <Form.Item label='Point radius (%)' extra='The point’s interaction area in the scene.'><InputNumber aria-label='Point radius' min={2} max={25} precision={1} value={locus.radiusPercent} onChange={value => onChange({ radiusPercent: value ?? locus.radiusPercent })} /></Form.Item>
    </Form>}
  </section>;
}
