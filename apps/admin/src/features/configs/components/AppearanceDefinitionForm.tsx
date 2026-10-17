import { ProForm, ProFormDependency, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Alert, Image, Space, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { adminAvatarsApi } from '../../../api/adminAvatarsApi';
import { ImageUploadField } from '../../../components/media/ImageUploadField';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';
import type { AppearanceItemType } from '../../../types/appearance';
import { validateCompanionArtwork } from '../utils/validateCompanionArtwork';

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
            <ProFormText name="setKey" label="Set key (optional)" extra="Share the same key and set copy across pieces in one outfit set." />
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
      <ProFormDigit name="sortOrder" label="Sort order" min={0} />
      <ProFormSwitch name="isActive" label="Active" initialValue />
      <ProFormDependency name={['itemType']}>
        {({ itemType }) => {
          const isWearable = wearableTypes.includes(itemType as AppearanceItemType);
          return (
            <ProForm.Item name="imageUrl" label={isWearable ? 'Wearable artwork (PNG)' : 'Artwork (server-hosted)'} rules={[{ required: true, message: 'Upload the artwork used by the app.' }]}>
              <ImageUploadField
                category={isWearable ? 'appearance-wearable' : 'appearance'}
                validateFile={isWearable ? validateCompanionArtwork : undefined}
                compress={!isWearable}
              />
            </ProForm.Item>
          );
        }}
      </ProFormDependency>
      <ProFormDependency name={['itemType', 'companionAvatarKey', 'imageUrl']}>
        {({ itemType, companionAvatarKey, imageUrl }) => {
          if (!wearableTypes.includes(itemType as AppearanceItemType)) return null;
          const avatar = avatars.find((candidate) => candidate.key === companionAvatarKey);
          const avatarUrl = avatar?.companionCharacterImageUrl ? resolveMediaPath(avatar.companionCharacterImageUrl) : undefined;
          const itemUrl = typeof imageUrl === 'string' && imageUrl ? resolveMediaPath(imageUrl) : undefined;

          return (
            <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
              <Typography.Text strong>Approximate wearable thumbnail</Typography.Text>
              <Typography.Text type="secondary">
                Preview the layer against the server-hosted full-body companion art using the shared canvas.
              </Typography.Text>
              <Alert type="info" showIcon message="Upload validation checks PNG format, the approved 1254 × 1254 canvas, and transparent pixels." />
              {avatarsQuery.isError ? <Alert type="error" showIcon message="Companion definitions could not be loaded. Retry after checking the admin API connection." /> : null}
              {avatarUrl && itemUrl ? (
                <div style={{ position: 'relative', width: 240, height: 240, overflow: 'hidden', background: '#f5f5f5', borderRadius: 8 }}>
                  <Image src={avatarUrl} alt={`${avatar?.titleEn} full-body companion`} preview={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                  <Image src={itemUrl} alt="Wearable overlay preview" preview={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <Alert
                  type={avatar && itemUrl ? 'warning' : 'info'}
                  showIcon
                  message={!companionAvatarKey ? 'Choose a compatible companion to preview alignment.' : avatarsQuery.isError ? 'Companion options are unavailable until the avatar list loads.' : !avatar ? 'The selected companion is not among the first 100 avatar definitions.' : !itemUrl ? 'Upload artwork to preview the wearable layer.' : 'Preview unavailable.'}
                />
              )}
              {avatar && !avatar.companionCharacterImageUrl ? <Alert type="warning" showIcon message="Upload full-body character artwork on the Companion Gallery page to enable outfit previews and dressing." /> : null}
            </Space>
          );
        }}
      </ProFormDependency>
    </>
  );
}
