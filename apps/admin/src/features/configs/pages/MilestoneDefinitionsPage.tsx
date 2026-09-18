import { PortalSectionNav } from "../../../components/PortalSectionNav";
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
    <PortalPageContainer title="Milestones" description="Define the achievements that celebrate meaningful learning progress." eyebrow="Gamification" navigation={<PortalSectionNav section="configs" />}>
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
              options={[
                { label: 'Player level', value: 'level' },
                { label: 'Practice sessions completed', value: 'lessons_completed' },
                { label: 'Different memory items practised', value: 'words_learned' },
                { label: 'Current streak (days)', value: 'streak_days' },
                { label: 'Best streak (days)', value: 'longest_streak' },
                { label: 'Total XP earned', value: 'xp_earned' },
              ]}
            />
            <ProFormDigit
              name='conditionValue'
              label='Condition Value'
              rules={[{ required: true }]}
              min={1}
              fieldProps={{ placeholder: 'Enter target value' }}
            />
          </>
        }
      />
    </PortalPageContainer>
  );
}
