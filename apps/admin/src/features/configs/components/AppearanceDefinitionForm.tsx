import { ProForm, ProFormDependency, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Alert, Card, Col, Form, Image, Row, Slider, Space, Typography } from 'antd';
import type { PointerEvent } from 'react';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAvatarsApi } from '../../../api/adminAvatarsApi';
import { ImageUploadField } from '../../../components/media/ImageUploadField';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';
import type { AppearanceItemType } from '../../../types/appearance';
import { validateCompanionArtwork } from '../utils/validateCompanionArtwork';

const wearableTypes: AppearanceItemType[] = ['headwear', 'bodywear', 'backwear', 'handItem'];

export function AppearanceDefinitionForm() {
  const { resolveMediaPath } = useAdminMediaApi();
  const form = Form.useFormInstance();
  const dragRef = useRef<{ pointerX: number; pointerY: number; x: number; y: number; size: number } | null>(null);
  const avatarsQuery = useQuery({ queryKey: ['admin-configs', 'appearance-avatar-options'], queryFn: () => adminAvatarsApi.list(1, 100, '') });
  const avatars = avatarsQuery.data?.data ?? [];
  const avatarOptions = avatars.map((avatar) => ({ label: `${avatar.titleEn} (${avatar.key})`, value: avatar.key }));

  return (
    <Row gutter={[24, 8]} align="top">
      <Col xs={24} lg={10}>
        <ProFormText name="key" label="Internal key" rules={[{ required: true }]} fieldProps={{ placeholder: 'constellation-scarf' }} />
        <ProFormSelect name="itemType" label="Category" rules={[{ required: true }]} options={[
          { label: 'Frame', value: 'frame' }, { label: 'Decoration', value: 'decoration' }, { label: 'Outfit', value: 'outfit' },
          { label: 'Headwear', value: 'headwear' }, { label: 'Bodywear', value: 'bodywear' }, { label: 'Backwear', value: 'backwear' }, { label: 'Hand item', value: 'handItem' },
        ]} />
        <ProFormDependency name={['itemType']}>
          {({ itemType }) => wearableTypes.includes(itemType as AppearanceItemType) ? (
            <>
              <ProFormSelect name="companionAvatarKey" label="Compatible companion" rules={[{ required: true, message: 'Choose the companion this wearable is aligned for.' }]} options={avatarOptions} showSearch fieldProps={{ optionFilterProp: 'label', loading: avatarsQuery.isLoading }} />
              <ProFormText name="setKey" label="Outfit set key (optional)" extra="Use the same key for pieces that belong to one set." />
              <ProFormDependency name={['setKey']}>
                {({ setKey }) => setKey ? <>
                  <ProFormText name="setTitleEn" label="Set name (EN)" rules={[{ required: true }]} />
                  <ProFormText name="setTitleZh" label="Set name (ZH)" rules={[{ required: true }]} />
                  <ProFormTextArea name="setStoryEn" label="Set story (EN)" rules={[{ required: true }]} fieldProps={{ maxLength: 240, showCount: true }} />
                  <ProFormTextArea name="setStoryZh" label="Set story (ZH)" rules={[{ required: true }]} fieldProps={{ maxLength: 240, showCount: true }} />
                </> : null}
              </ProFormDependency>
            </>
          ) : null}
        </ProFormDependency>
        <ProFormText name="titleEn" label="English name" rules={[{ required: true }]} />
        <ProFormText name="titleZh" label="Chinese name" rules={[{ required: true }]} />
        <ProFormTextArea name="descriptionEn" label="English description" />
        <ProFormTextArea name="descriptionZh" label="Chinese description" />
        <ProFormDigit name="requiredLevel" label="Unlock level" min={1} rules={[{ required: true }]} />
        <ProFormDigit name="sortOrder" label="Catalog order" min={0} />
        <ProFormSwitch name="isActive" label="Available to players" initialValue />
        <ProFormDependency name={['itemType']}>
          {({ itemType }) => {
            const isWearable = wearableTypes.includes(itemType as AppearanceItemType);
            return <ProForm.Item name="imageUrl" label={isWearable ? 'Wearable artwork (PNG)' : 'Artwork'} rules={[{ required: true, message: 'Upload the artwork used by the app.' }]}>
              <ImageUploadField category={isWearable ? 'appearance-wearable' : 'appearance'} validateFile={isWearable ? validateCompanionArtwork : undefined} compress={!isWearable} />
            </ProForm.Item>;
          }}
        </ProFormDependency>
        <Alert type="info" showIcon message="Wearable art must be a transparent 1254 × 1254 PNG. The fitting room aligns it on the same canvas used in the app." />
      </Col>

      <Col xs={24} lg={14}>
        <ProFormDependency name={['itemType', 'companionAvatarKey', 'imageUrl', 'offsetXPercent', 'offsetYPercent', 'scalePercent', 'layerOrder']}>
          {({ itemType, companionAvatarKey, imageUrl, offsetXPercent, offsetYPercent, scalePercent, layerOrder }) => {
            if (!wearableTypes.includes(itemType as AppearanceItemType)) {
              return <Card title="Fitting room" style={{ position: 'sticky', top: 16 }}><Typography.Text type="secondary">Full-body try-on is available for companion wardrobe items.</Typography.Text></Card>;
            }
            const avatar = avatars.find((candidate) => candidate.key === companionAvatarKey);
            const avatarUrl = avatar?.companionCharacterImageUrl ? resolveMediaPath(avatar.companionCharacterImageUrl) : undefined;
            const itemUrl = typeof imageUrl === 'string' && imageUrl ? resolveMediaPath(imageUrl) : undefined;
            const x = typeof offsetXPercent === 'number' ? offsetXPercent : 0;
            const y = typeof offsetYPercent === 'number' ? offsetYPercent : 0;
            const scale = typeof scalePercent === 'number' ? scalePercent : 100;
            const start = (event: PointerEvent<HTMLDivElement>) => {
              if (!avatarUrl || !itemUrl) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = { pointerX: event.clientX, pointerY: event.clientY, x, y, size: event.currentTarget.clientWidth };
            };
            const move = (event: PointerEvent<HTMLDivElement>) => {
              const drag = dragRef.current;
              if (!drag || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
              form.setFieldsValue({
                offsetXPercent: clamp(drag.x + ((event.clientX - drag.pointerX) / drag.size) * 100, -40, 40),
                offsetYPercent: clamp(drag.y + ((event.clientY - drag.pointerY) / drag.size) * 100, -40, 40),
              });
            };
            return (
              <Card title="Companion fitting room" extra={<Typography.Text type="secondary">Drag to align</Typography.Text>} style={{ position: 'sticky', top: 16, borderRadius: 18 }}>
                {avatarUrl && itemUrl ? <div
                  role="application" aria-label="Drag wearable artwork to adjust its position on the companion"
                  onPointerDown={start} onPointerMove={move}
                  onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}
                  style={{ position: 'relative', width: 'min(100%, 360px)', aspectRatio: '1', margin: '0 auto 16px', overflow: 'hidden', borderRadius: 24, border: '1px solid #ded6ff', background: 'radial-gradient(circle at 50% 36%, #fff 0, #f2efff 60%, #e7f4ff 100%)', touchAction: 'none', cursor: 'grab', boxShadow: '0 12px 32px rgba(73, 53, 143, .12)' }}
                >
                  <div aria-hidden style={{ position: 'absolute', inset: '9%', border: '1px dashed rgba(105, 77, 199, .24)', borderRadius: '50%' }} />
                  <Image src={avatarUrl} alt={`${avatar?.titleEn} companion`} preview={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                  <Image src={itemUrl} alt="Selected wearable, drag to position" preview={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', transform: `translate(${x}%, ${y}%) scale(${scale / 100})`, transformOrigin: 'center' }} />
                  <div aria-hidden style={{ position: 'absolute', left: 14, bottom: 14, padding: '5px 10px', borderRadius: 20, color: '#5d47b5', background: 'rgba(255,255,255,.9)', fontSize: 11, fontWeight: 600, pointerEvents: 'none' }}>✦ Live fitting preview</div>
                </div> : <Alert type="info" showIcon message={!companionAvatarKey ? 'Choose a companion to open the fitting room.' : !avatarUrl ? 'Upload full-body companion artwork in Companion Gallery first.' : 'Upload the wearable PNG to try it on.'} />}
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Typography.Text>Horizontal offset · {x}%</Typography.Text><Slider min={-40} max={40} value={x} onChange={(value) => form.setFieldValue('offsetXPercent', value)} disabled={!avatarUrl || !itemUrl} />
                  <Typography.Text>Vertical offset · {y}%</Typography.Text><Slider min={-40} max={40} value={y} onChange={(value) => form.setFieldValue('offsetYPercent', value)} disabled={!avatarUrl || !itemUrl} />
                  <Typography.Text>Scale · {scale}%</Typography.Text><Slider min={50} max={180} value={scale} onChange={(value) => form.setFieldValue('scalePercent', value)} disabled={!avatarUrl || !itemUrl} />
                  <Typography.Text>Layer order · {layerOrder || 'Automatic by slot'}</Typography.Text><Slider min={0} max={100} value={typeof layerOrder === 'number' ? layerOrder : 0} onChange={(value) => form.setFieldValue('layerOrder', value)} />
                  <Typography.Text type="secondary">At 0, the app uses the default back-to-front slot order.</Typography.Text>
                </Space>
                <ProFormDigit name="offsetXPercent" label="Horizontal offset (%)" min={-40} max={40} initialValue={0} hidden />
                <ProFormDigit name="offsetYPercent" label="Vertical offset (%)" min={-40} max={40} initialValue={0} hidden />
                <ProFormDigit name="scalePercent" label="Scale (%)" min={50} max={180} initialValue={100} hidden />
                <ProFormDigit name="layerOrder" label="Layer order" min={0} max={100} initialValue={0} hidden />
              </Card>
            );
          }}
        </ProFormDependency>
      </Col>
    </Row>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
