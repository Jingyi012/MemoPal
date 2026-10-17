import { ProForm, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Image } from 'antd';
import { DefinitionCrudTab } from '../components/DefinitionCrudTab';
import { ImageUploadField } from '../../../components/media/ImageUploadField';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { PortalSectionNav } from '../../../components/PortalSectionNav';
import { useAdminAppearanceApi } from '../hooks/useAdminAppearanceApi';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';
import type { AppearanceDefinitionDto } from '../../../types/appearance';

export default function AppearanceDefinitionsPage() {
  const api = useAdminAppearanceApi();
  const { resolveMediaPath } = useAdminMediaApi();
  return (
    <PortalPageContainer title="Appearance Studio" description="Configure frames, decorations, and outfits that users can equip on their profile avatar." eyebrow="Gamification" navigation={<PortalSectionNav section="configs" />}>
      <DefinitionCrudTab<AppearanceDefinitionDto>
        title="Appearance item"
        list={api.list}
        create={api.create}
        update={api.update}
        remove={api.remove}
        columns={[
          { title: 'Preview', dataIndex: 'imageUrl', width: 100, render: (_, row) => row.imageUrl ? <Image src={resolveMediaPath(row.imageUrl)} width={52} height={52} preview={false} style={{ objectFit: 'contain' }} /> : <span>{row.assetKey}</span> },
          { title: 'Key', dataIndex: 'key' },
          { title: 'Type', dataIndex: 'itemType' },
          { title: 'English name', dataIndex: 'titleEn' },
          { title: 'Chinese name', dataIndex: 'titleZh' },
          { title: 'Unlock level', dataIndex: 'requiredLevel' },
          { title: 'Active', dataIndex: 'isActive', valueType: 'switch' },
        ]}
        form={
          <>
            <ProFormText name="key" label="Key" rules={[{ required: true }]} fieldProps={{ placeholder: 'constellation-frame' }} />
            <ProFormSelect
              name="itemType"
              label="Slot"
              rules={[{ required: true }]}
              options={[
                { label: 'Frame', value: 'frame' },
                { label: 'Decoration', value: 'decoration' },
                { label: 'Outfit', value: 'outfit' },
              ]}
            />
            <ProFormText name="assetKey" label="Bundled asset key" rules={[{ required: true }]} extra="Use a bundled mobile asset key, or provide an uploaded image below." />
            <ProFormText name="titleEn" label="English name" rules={[{ required: true }]} />
            <ProFormText name="titleZh" label="Chinese name" rules={[{ required: true }]} />
            <ProFormTextArea name="descriptionEn" label="English description" />
            <ProFormTextArea name="descriptionZh" label="Chinese description" />
            <ProFormDigit name="requiredLevel" label="Unlock level" min={1} rules={[{ required: true }]} />
            <ProFormDigit name="sortOrder" label="Sort order" min={0} />
            <ProFormSwitch name="isActive" label="Active" initialValue />
            <ProForm.Item name="imageUrl" label="Artwork">
              <ImageUploadField category="appearance" />
            </ProForm.Item>
          </>
        }
      />
    </PortalPageContainer>
  );
}
