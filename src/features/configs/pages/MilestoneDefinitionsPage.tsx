import { ProFormDigit, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import type { MilestoneDefinitionDto } from '../../../types/config';
import { DefinitionCrudTab } from '../components/DefinitionCrudTab';
import { useAdminConfigsApi } from '../hooks/useAdminConfigsApi';

export default function MilestoneDefinitionsPage() {
  const {
    listMilestoneDefinitions,
    createMilestoneDefinition,
    updateMilestoneDefinition,
    deleteMilestoneDefinition,
  } = useAdminConfigsApi();

  return (
    <PortalPageContainer>
      <DefinitionCrudTab<MilestoneDefinitionDto>
        title='Milestone Definition'
        list={listMilestoneDefinitions}
        create={createMilestoneDefinition}
        update={updateMilestoneDefinition}
        remove={deleteMilestoneDefinition}
        columns={[
          { title: 'Key', dataIndex: 'key' },
          { title: 'Title', dataIndex: 'title' },
          { title: 'Condition Type', dataIndex: 'conditionType' },
          { title: 'Condition Value', dataIndex: 'conditionValue' },
        ]}
        form={
          <>
            <ProFormText
              name='key'
              label='Key'
              rules={[{ required: true }]}
              fieldProps={{ placeholder: 'Enter unique key (e.g., lessons_completed_10)' }}
            />
            <ProFormText
              name='title'
              label='Title'
              rules={[{ required: true }]}
              fieldProps={{ placeholder: 'Enter milestone title' }}
            />
            <ProFormText
              name='description'
              label='Description'
              fieldProps={{ placeholder: 'Enter milestone description (optional)' }}
            />
            <ProFormSelect
              name='conditionType'
              label='Condition Type'
              placeholder='Select condition type'
              rules={[{ required: true }]}
              options={['level', 'lessons_completed', 'words_learned', 'streak_days'].map(
                (value) => ({ label: value, value })
              )}
            />
            <ProFormDigit
              name='conditionValue'
              label='Condition Value'
              rules={[{ required: true }]}
              min={0}
              fieldProps={{ placeholder: 'Enter target value' }}
            />
          </>
        }
      />
    </PortalPageContainer>
  );
}

