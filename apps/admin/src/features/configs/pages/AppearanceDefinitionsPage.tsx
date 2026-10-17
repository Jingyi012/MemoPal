import { Image } from 'antd';
import { DefinitionCrudTab } from '../components/DefinitionCrudTab';
import { AppearanceDefinitionForm } from '../components/AppearanceDefinitionForm';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { PortalSectionNav } from '../../../components/PortalSectionNav';
import { useAdminAppearanceApi } from '../hooks/useAdminAppearanceApi';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';
import type { AppearanceDefinitionDto, AppearanceDefinitionUpsertRequest } from '../../../types/appearance';

export default function AppearanceDefinitionsPage() {
  const api = useAdminAppearanceApi();
  const { resolveMediaPath } = useAdminMediaApi();
  const normalizePayload = (payload: AppearanceDefinitionUpsertRequest): AppearanceDefinitionUpsertRequest => ({
    ...payload,
    offsetXPercent: Math.round(Number(payload.offsetXPercent) || 0),
    offsetYPercent: Math.round(Number(payload.offsetYPercent) || 0),
    scalePercent: Math.round(Number(payload.scalePercent) || 100),
    layerOrder: Math.round(Number(payload.layerOrder) || 0),
    assetKey: payload.assetKey?.trim() || payload.key.trim(),
  });
  return (
    <PortalPageContainer title="Appearance Studio" description="Configure profile frames and companion wardrobe items, including companion compatibility and outfit sets." eyebrow="Gamification" navigation={<PortalSectionNav section="configs" />}>
      <DefinitionCrudTab<AppearanceDefinitionDto>
        title="Appearance item"
        modalWidth={1120}
        list={api.list}
        create={(payload) => api.create(normalizePayload(payload))}
        update={(id, payload) => api.update(id, normalizePayload(payload))}
        remove={api.remove}
        columns={[
          { title: 'Preview', dataIndex: 'imageUrl', width: 100, render: (_, row) => row.imageUrl ? <Image src={resolveMediaPath(row.imageUrl)} width={52} height={52} preview={false} style={{ objectFit: 'contain' }} /> : <span>{row.assetKey}</span> },
          { title: 'Key', dataIndex: 'key' },
          { title: 'Type', dataIndex: 'itemType' },
          { title: 'Companions', dataIndex: 'companionAvatarKeys', ellipsis: true, render: (_, row) => row.companionAvatarKeys?.join(', ') || '—' },
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
