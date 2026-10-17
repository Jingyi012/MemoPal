import { ProForm, ProFormDigit, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Card, Image, Space, Tag, Typography } from 'antd';
import { DefinitionCrudTab } from '../components/DefinitionCrudTab';
import { ImageUploadField } from '../../../components/media/ImageUploadField';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { PortalSectionNav } from '../../../components/PortalSectionNav';
import { useAdminAvatarsApi } from '../hooks/useAdminAvatarsApi';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';
import type { AvatarDefinitionDto } from '../../../types/avatar';
import { CompanionBondStagesCard } from '../components/CompanionBondStagesCard';
import { CompanionDialogueCard } from '../components/CompanionDialogueCard';
import { validateCompanionArtwork } from '../utils/validateCompanionArtwork';

export default function AvatarDefinitionsPage() {
  const api = useAdminAvatarsApi();
  const { resolveMediaPath } = useAdminMediaApi();
  return (
    <PortalPageContainer title="Companion gallery" description="Manage the companions players can meet, their artwork, descriptions, and level unlocks." eyebrow="COMPANION EXPERIENCE" navigation={<PortalSectionNav section="configs" />}>
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 16 }}>
        <Space align="start" size={16}>
          <span style={{ fontSize: 28 }} aria-hidden>✦</span>
          <div><Typography.Title level={5} style={{ margin: 0 }}>One catalog powers the companion experience</Typography.Title><Typography.Paragraph type="secondary" style={{ margin: '4px 0 0' }}>Add a companion here, set its unlock level and artwork, then assign compatible wardrobe items in Appearance Studio. Profile photos remain separate from the active in-game companion.</Typography.Paragraph><Space size={8}><Tag color="purple">Gallery</Tag><Tag color="blue">Level unlocks</Tag><Tag color="gold">Artwork</Tag></Space></div>
        </Space>
      </Card>
      <CompanionBondStagesCard />
      <CompanionDialogueCard />
      <DefinitionCrudTab<AvatarDefinitionDto>
        title="Companion"
        list={api.list}
        create={api.create}
        update={api.update}
        remove={api.remove}
        columns={[
          { title: 'Portrait', dataIndex: 'imageUrl', width: 84, render: (_, row) => row.imageUrl ? <Image src={resolveMediaPath(row.imageUrl)} width={52} height={52} preview={false} style={{ objectFit: 'contain' }} /> : '—' },
          { title: 'Character art', dataIndex: 'companionCharacterImageUrl', width: 110, render: (_, row) => row.companionCharacterImageUrl ? <Image src={resolveMediaPath(row.companionCharacterImageUrl)} width={64} height={64} preview={false} style={{ objectFit: 'contain' }} /> : 'Not dress-up ready' },
          { title: 'Internal key', dataIndex: 'key', copyable: true },
          { title: 'Name (EN)', dataIndex: 'titleEn' },
          { title: 'Name (ZH)', dataIndex: 'titleZh' },
          { title: 'Unlock', dataIndex: 'requiredLevel', render: (_, row) => <Tag color={row.requiredLevel <= 1 ? 'green' : 'gold'}>Lv. {row.requiredLevel}</Tag> },
          { title: 'Status', dataIndex: 'isActive', valueType: 'switch', render: (_, row) => <Tag color={row.isActive ? 'green' : 'default'}>{row.isActive ? 'Live' : 'Hidden'}</Tag> },
        ]}
        form={
          <>
            <ProFormText name="key" label="Key" rules={[{ required: true }]} fieldProps={{ placeholder: 'memory-fox' }} />
            <ProFormText name="titleEn" label="English name" rules={[{ required: true }]} />
            <ProFormText name="titleZh" label="Chinese name" rules={[{ required: true }]} />
            <ProFormTextArea name="descriptionEn" label="English description" />
            <ProFormTextArea name="descriptionZh" label="Chinese description" />
            <ProFormDigit name="requiredLevel" label="Unlock level" min={1} rules={[{ required: true }]} />
            <ProFormDigit name="sortOrder" label="Sort order" min={0} />
            <ProFormSwitch name="isActive" label="Active" initialValue />
            <ProForm.Item name="imageUrl" label="Portrait image (server-hosted)" rules={[{ required: true, message: 'Upload a portrait image.' }]}>
              <ImageUploadField category="avatar" />
            </ProForm.Item>
            <ProForm.Item name="companionCharacterImageUrl" label="Full-body character image" extra="Used in Companion Space and wardrobe try-on. Upload a transparent 1254 × 1254 PNG so its canvas aligns with wearable layers. Without one, only this companion's portrait artwork appears.">
              <ImageUploadField category="companion-character" validateFile={validateCompanionArtwork} compress={false} />
            </ProForm.Item>
          </>
        }
      />
    </PortalPageContainer>
  );
}
