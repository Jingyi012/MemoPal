import { ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { adminConfigsApi } from '../../../api/adminConfigsApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import type { BadgeDefinitionDto } from '../../../types/config';
import { DefinitionCrudTab } from '../components/DefinitionCrudTab';

export default function BadgeDefinitionsPage() {
  return (
    <PortalPageContainer>
      <DefinitionCrudTab<BadgeDefinitionDto>
        title='Badge Definition'
        list={adminConfigsApi.listBadgeDefinitions}
        create={adminConfigsApi.createBadgeDefinition}
        update={adminConfigsApi.updateBadgeDefinition}
        remove={adminConfigsApi.deleteBadgeDefinition}
        columns={[
          { title: 'Key', dataIndex: 'key' },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Rarity', dataIndex: 'rarity' },
        ]}
        form={
          <>
            <ProFormText
              name='key'
              label='Key'
              rules={[{ required: true }]}
              fieldProps={{ placeholder: 'Enter unique key (e.g., memory_sprinter)' }}
            />
            <ProFormText
              name='name'
              label='Name'
              rules={[{ required: true }]}
              fieldProps={{ placeholder: 'Enter badge name' }}
            />
            <ProFormText
              name='description'
              label='Description'
              fieldProps={{ placeholder: 'Enter badge description (optional)' }}
            />
            <ProFormSelect
              name='rarity'
              label='Rarity'
              placeholder='Select rarity'
              options={['common', 'rare', 'epic', 'legendary'].map((value) => ({
                label: value,
                value,
              }))}
            />
            <ProFormText
              name='icon'
              label='Icon'
              fieldProps={{ placeholder: 'Enter icon keyword (e.g., trophy)' }}
            />
            <ProFormText
              name='iconUrl'
              label='Icon URL'
              fieldProps={{ placeholder: 'Enter icon image URL (optional)' }}
            />
          </>
        }
      />
    </PortalPageContainer>
  );
}

