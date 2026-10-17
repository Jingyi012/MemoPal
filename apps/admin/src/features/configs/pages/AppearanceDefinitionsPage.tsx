import { Image } from 'antd';
import { DefinitionCrudTab } from '../components/DefinitionCrudTab';
import { AppearanceDefinitionForm } from '../components/AppearanceDefinitionForm';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { PortalSectionNav } from '../../../components/PortalSectionNav';
import { useAdminAppearanceApi } from '../hooks/useAdminAppearanceApi';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';
import type { AppearanceDefinitionDto } from '../../../types/appearance';

export default function AppearanceDefinitionsPage() {
  const api = useAdminAppearanceApi();
  const { resolveMediaPath } = useAdminMediaApi();
  return (
    <PortalPageContainer title="Appearance Studio" description="Configure profile frames and companion wardrobe items, including companion compatibility and outfit sets." eyebrow="Gamification" navigation={<PortalSectionNav section="configs" />}>
      <DefinitionCrudTab<AppearanceDefinitionDto>
        title="Appearance item"
        modalWidth={1120}
        list={api.list}
        create={(payload) => api.create({ ...payload, assetKey: payload.assetKey?.trim() || payload.key.trim() })}
        update={(id, payload) => api.update(id, { ...payload, assetKey: payload.assetKey?.trim() || payload.key.trim() })}
        remove={api.remove}
        columns={[
          { title: 'Preview', dataIndex: 'imageUrl', width: 100, render: (_, row) => row.imageUrl ? <Image src={resolveMediaPath(row.imageUrl)} width={52} height={52} preview={false} style={{ objectFit: 'contain' }} /> : <span>{row.assetKey}</span> },
          { title: 'Key', dataIndex: 'key' },
          { title: 'Type', dataIndex: 'itemType' },
          { title: 'Companion', dataIndex: 'companionAvatarKey', ellipsis: true },
          { title: 'Set', dataIndex: 'setKey', ellipsis: true },
          { title: 'Set story', dataIndex: 'setTitleEn', ellipsis: true },
          { title: 'English name', dataIndex: 'titleEn' },
          { title: 'Chinese name', dataIndex: 'titleZh' },
          { title: 'Unlock level', dataIndex: 'requiredLevel' },
          { title: 'Active', dataIndex: 'isActive', valueType: 'switch' },
        ]}
        form={<AppearanceDefinitionForm />}
      />
    </PortalPageContainer>
  );
}
