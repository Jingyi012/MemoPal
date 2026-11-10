import React from "react";
import { Tabs, Space, Alert } from "antd";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminReferralsApi } from '../../../api/adminReferralsApi';
import type { ReferralProgramConfigDto } from '../../../types/referral';
import {
  REFERRAL_PROGRAM_CONFIG_DEFAULT,
  REFERRAL_PROGRAM_CONFIG_SCHEMA,
} from "../../../schemas/systemSettings";

/**
 * Referral Program Configuration Editor
 * Allows admins to configure referral rewards, tiers, and program settings
 */
export const ReferralProgramConfigTab: React.FC = () => {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['admin-referral-config'], queryFn: adminReferralsApi.getConfig });
  const save = useMutation({ mutationFn: adminReferralsApi.updateConfig,
    onSuccess: (value) => client.setQueryData(['admin-referral-config'], value) });
  const isLoading = query.isLoading || save.isPending;
  const error = query.error?.message ?? save.error?.message;
  // The dedicated endpoint normalizes old XP settings once, on the server.
  // The JSON editor only exposes the currently editable credit fields.
  const value = query.data ?? REFERRAL_PROGRAM_CONFIG_DEFAULT;
  const config = {
    ...Object.fromEntries(Object.entries(value).filter(([key]) => key in REFERRAL_PROGRAM_CONFIG_SCHEMA.properties)),
    milestones: value.milestones.map(item => Object.fromEntries(Object.entries(item)
      .filter(([key]) => key in REFERRAL_PROGRAM_CONFIG_SCHEMA.properties.milestones.items.properties))),
  };

  const saveConfig = (data: Record<string, unknown>) => save.mutateAsync(data as unknown as ReferralProgramConfigDto);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    await saveConfig(data);
  };

  const handleAdvancedSubmit = async (data: any) => {
    await saveConfig(data);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {error && (
        <Alert
          type="error"
          message="Error"
          description={error}
          showIcon
          closable
        />
      )}

      <Alert
        type="info"
        message="Referral Program Configuration"
        description="Configure referral rewards, bonus per tier, and reward tiers. Enable/disable the program as needed."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs
        items={[
          {
            key: "form",
            label: "Form Editor",
            children: (
              <ConfigEditorForm
                schema={REFERRAL_PROGRAM_CONFIG_SCHEMA}
                formData={config}
                onSubmit={handleFormSubmit}
                title="Referral Program Configuration"
                loading={isLoading}
              />
            ),
          },
          {
            key: "advanced",
            label: "Advanced (JSON)",
            children: (
              <AdvancedJsonEditor
                value={config}
                schema={REFERRAL_PROGRAM_CONFIG_SCHEMA}
                onSubmit={handleAdvancedSubmit}
                title="Advanced Referral Program Configuration"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};

export default ReferralProgramConfigTab;
