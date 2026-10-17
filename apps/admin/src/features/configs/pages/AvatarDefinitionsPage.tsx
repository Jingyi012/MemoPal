import { ProForm, ProFormDigit, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Image, Tabs, Tag } from 'antd';
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
  const catalog = <DefinitionCrudTab<AvatarDefinitionDto>
        title="Companion"
        list={api.list}
        create={api.create}
        update={api.update}
        remove={api.remove}
        columns={[
          { title: 'Companion', dataIndex: 'imageUrl', width: 230, render: (_, row) => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{row.imageUrl ? <Image src={resolveMediaPath(row.imageUrl)} width={48} height={48} preview={false} style={{ objectFit: 'contain' }} /> : null}<div><strong>{row.titleEn}</strong><div style={{ color: '#888', fontSize: 12 }}>{row.titleZh}</div></div></div> },
          { title: 'Key', dataIndex: 'key', copyable: true, width: 170 },
          { title: 'Full-body art', dataIndex: 'companionCharacterImageUrl', width: 125, render: (_, row) => row.companionCharacterImageUrl ? <Image src={resolveMediaPath(row.companionCharacterImageUrl)} width={42} height={42} preview={false} style={{ objectFit: 'contain' }} /> : <Tag>Missing</Tag> },
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
      />;
  return (
    <PortalPageContainer title="Companion gallery" description="Manage companion artwork, unlock levels, relationship progression, and in-game dialogue." eyebrow="COMPANION EXPERIENCE" navigation={<PortalSectionNav section="configs" />}>
      <Tabs defaultActiveKey="companions" items={[
        { key: 'companions', label: 'Companions', children: catalog },
        { key: 'progression', label: 'Relationship progression', children: <CompanionBondStagesCard /> },
        { key: 'dialogue', label: 'Interactions & dialogue', children: <CompanionDialogueCard /> },
      ]} />
    </PortalPageContainer>
  );
}
