import { ProForm, ProFormDigit, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Image } from 'antd';
import { DefinitionCrudTab } from '../components/DefinitionCrudTab';
import { ImageUploadField } from '../../../components/media/ImageUploadField';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { PortalSectionNav } from '../../../components/PortalSectionNav';
import { useAdminAvatarsApi } from '../hooks/useAdminAvatarsApi';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';
import type { AvatarDefinitionDto } from '../../../types/avatar';

export default function AvatarDefinitionsPage() {
  const api = useAdminAvatarsApi();
  const { resolveMediaPath } = useAdminMediaApi();
  return (
    <PortalPageContainer title="Avatar Gallery" description="Configure illustrated memory companions, images, and level unlocks." eyebrow="Gamification" navigation={<PortalSectionNav section="configs" />}>
      <DefinitionCrudTab<AvatarDefinitionDto>
        title="Avatar"
        list={api.list}
        create={api.create}
        update={api.update}
        remove={api.remove}
        columns={[
          { title: 'Preview', dataIndex: 'imageUrl', width: 100, render: (_, row) => row.imageUrl ? <Image src={resolveMediaPath(row.imageUrl)} width={52} height={52} preview={false} style={{ objectFit: 'contain' }} /> : <span>{row.assetKey}</span> },
          { title: 'Key', dataIndex: 'key' },
          { title: 'English name', dataIndex: 'titleEn' },
          { title: 'Chinese name', dataIndex: 'titleZh' },
          { title: 'Unlock level', dataIndex: 'requiredLevel' },
          { title: 'Active', dataIndex: 'isActive', valueType: 'switch' },
        ]}
        form={
          <>
            <ProFormText name="key" label="Key" rules={[{ required: true }]} fieldProps={{ placeholder: 'memory-fox' }} />
            <ProFormText name="assetKey" label="Bundled asset key" rules={[{ required: true }]} fieldProps={{ placeholder: 'memory-fox' }} extra="Use the mobile asset key for bundled artwork, or provide an uploaded image below." />
            <ProFormText name="titleEn" label="English name" rules={[{ required: true }]} />
            <ProFormText name="titleZh" label="Chinese name" rules={[{ required: true }]} />
            <ProFormTextArea name="descriptionEn" label="English description" />
            <ProFormTextArea name="descriptionZh" label="Chinese description" />
            <ProFormDigit name="requiredLevel" label="Unlock level" min={1} rules={[{ required: true }]} />
            <ProFormDigit name="sortOrder" label="Sort order" min={0} />
            <ProFormSwitch name="isActive" label="Active" initialValue />
            <ProForm.Item name="imageUrl" label="Artwork">
              <ImageUploadField category="avatar" />
            </ProForm.Item>
          </>
        }
      />
    </PortalPageContainer>
  );
}
