import { ProForm, ProFormDependency, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Alert, Image, Space, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { adminAvatarsApi } from '../../../api/adminAvatarsApi';
import { ImageUploadField } from '../../../components/media/ImageUploadField';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';
import type { AppearanceItemType } from '../../../types/appearance';
import { validateWearableArtwork } from '../utils/validateWearableArtwork';

const wearableTypes: AppearanceItemType[] = ['headwear', 'bodywear', 'backwear', 'handItem'];

export function AppearanceDefinitionForm() {
  const { resolveMediaPath } = useAdminMediaApi();
  const avatarsQuery = useQuery({
    queryKey: ['admin-configs', 'appearance-avatar-options'],
    queryFn: () => adminAvatarsApi.list(1, 100, ''),
  });
  const avatars = avatarsQuery.data?.data ?? [];
  const avatarOptions = avatars.map((avatar) => ({ label: `${avatar.titleEn} (${avatar.key})`, value: avatar.key }));

  return (
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
          { label: 'Headwear', value: 'headwear' },
          { label: 'Bodywear', value: 'bodywear' },
          { label: 'Backwear', value: 'backwear' },
          { label: 'Hand item', value: 'handItem' },
        ]}
      />
      <ProFormDependency name={['itemType']}>
        {({ itemType }) => wearableTypes.includes(itemType as AppearanceItemType) ? (
          <>
            <ProFormSelect
              name="companionAvatarKey"
              label="Compatible companion"
              rules={[{ required: true, message: 'Choose the companion this wearable is aligned for.' }]}
              options={avatarOptions}
              showSearch
              fieldProps={{ optionFilterProp: 'label', loading: avatarsQuery.isLoading }}
              extra="The wearable artwork must use this companion's canvas and coordinate layout."
            />
            <ProFormText name="setKey" label="Set key (optional)" extra="Use the same key for items that belong to one outfit set." />
          </>
        ) : null}
      </ProFormDependency>
      <ProFormDependency name={['imageUrl']}>
        {({ imageUrl }) => (
          <ProFormText
            name="assetKey"
            label="Bundled asset key"
            rules={imageUrl ? [] : [{ required: true, message: 'Enter an asset key or upload artwork.' }]}
            extra={imageUrl ? 'Optional when uploaded artwork is available.' : 'Required when no uploaded artwork is available.'}
          />
        )}
      </ProFormDependency>
      <ProFormText name="titleEn" label="English name" rules={[{ required: true }]} />
      <ProFormText name="titleZh" label="Chinese name" rules={[{ required: true }]} />
      <ProFormTextArea name="descriptionEn" label="English description" />
      <ProFormTextArea name="descriptionZh" label="Chinese description" />
      <ProFormDigit name="requiredLevel" label="Unlock level" min={1} rules={[{ required: true }]} />
      <ProFormDigit name="sortOrder" label="Sort order" min={0} />
      <ProFormSwitch name="isActive" label="Active" initialValue />
      <ProFormDependency name={['itemType']}>
        {({ itemType }) => {
          const isWearable = wearableTypes.includes(itemType as AppearanceItemType);
          return (
            <ProForm.Item name="imageUrl" label={isWearable ? 'Wearable artwork (PNG)' : 'Artwork'}>
              <ImageUploadField
                category="appearance"
                validateFile={isWearable ? validateWearableArtwork : undefined}
              />
            </ProForm.Item>
          );
        }}
      </ProFormDependency>
      <ProFormDependency name={['itemType', 'companionAvatarKey', 'imageUrl']}>
        {({ itemType, companionAvatarKey, imageUrl }) => {
          if (!wearableTypes.includes(itemType as AppearanceItemType)) return null;
          const avatar = avatars.find((candidate) => candidate.key === companionAvatarKey);
          const avatarUrl = avatar?.imageUrl ? resolveMediaPath(avatar.imageUrl) : undefined;
          const itemUrl = typeof imageUrl === 'string' && imageUrl ? resolveMediaPath(imageUrl) : undefined;

          return (
            <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
              <Typography.Text strong>Approximate wearable thumbnail</Typography.Text>
              <Typography.Text type="secondary">
                Approximate thumbnail only. This uses the companion's profile portrait, not its full-body base, so it cannot verify wearable fit or placement.
              </Typography.Text>
              <Alert type="info" showIcon message="Upload validation checks PNG format, the approved 1254 × 1254 canvas, and transparent pixels. Final alignment still needs review against the approved full-body companion base." />
              {avatarsQuery.isError ? <Alert type="error" showIcon message="Companion definitions could not be loaded. Retry after checking the admin API connection." /> : null}
              {avatarUrl && itemUrl ? (
                <div style={{ position: 'relative', width: 240, height: 240, overflow: 'hidden', background: '#f5f5f5', borderRadius: 8 }}>
                  <Image src={avatarUrl} alt={`${avatar?.titleEn} base companion`} preview={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                  <Image src={itemUrl} alt="Wearable overlay preview" preview={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <Alert
                  type={avatar && itemUrl ? 'warning' : 'info'}
                  showIcon
                  message={!companionAvatarKey ? 'Choose a compatible companion to preview alignment.' : avatarsQuery.isError ? 'Companion options are unavailable until the avatar list loads.' : !avatar ? 'The selected companion is not among the first 100 avatar definitions.' : !itemUrl ? 'Upload artwork to preview the wearable layer.' : 'Preview unavailable.'}
                />
              )}
              {avatar && !avatar.imageUrl ? <Alert type="warning" showIcon message="This companion has no uploaded base image, so a composited preview is unavailable." /> : null}
            </Space>
          );
        }}
      </ProFormDependency>
    </>
  );
}
