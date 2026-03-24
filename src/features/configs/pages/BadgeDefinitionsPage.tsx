import {
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from "@ant-design/pro-components";
import { adminConfigsApi } from "../../../api/adminConfigsApi";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import type { BadgeDefinitionDto } from "../../../types/config";
import { ImageUploadField } from "../../content/components/ImageUploadField";
import { MediaThumbnail } from "../../content/components/MediaThumbnail";
import { DefinitionCrudTab } from "../components/DefinitionCrudTab";

const badgeConditionOptions = [
  { label: "Manual Only", value: "manual" },
  { label: "Level", value: "level" },
  { label: "Lessons Completed", value: "lessons_completed" },
  { label: "Words Learned", value: "words_learned" },
  { label: "Review Count", value: "total_reviews" },
  { label: "Streak Days", value: "streak_days" },
  { label: "Missions Completed", value: "missions_completed" },
  { label: "Total XP", value: "total_xp" },
];

export default function BadgeDefinitionsPage() {
  return (
    <PortalPageContainer>
      <DefinitionCrudTab<BadgeDefinitionDto>
        title="Badge Definition"
        list={adminConfigsApi.listBadgeDefinitions}
        create={adminConfigsApi.createBadgeDefinition}
        update={adminConfigsApi.updateBadgeDefinition}
        remove={adminConfigsApi.deleteBadgeDefinition}
        columns={[
          {
            title: "Icon",
            dataIndex: "iconUrl",
            width: 110,
            render: (_, row) => (
              <MediaThumbnail
                path={row.iconUrl ?? undefined}
                alt={`${row.name} icon`}
                width={56}
                height={56}
              />
            ),
          },
          { title: "Lucide Icon", dataIndex: "icon" },
          { title: "Key", dataIndex: "key" },
          { title: "Name", dataIndex: "name" },
          { title: "Condition", dataIndex: "conditionType" },
          { title: "Target", dataIndex: "conditionValue", width: 90 },
          { title: "Rarity", dataIndex: "rarity" },
        ]}
        form={
          <>
            <ProFormText
              name="key"
              label="Key"
              rules={[{ required: true }]}
              fieldProps={{
                placeholder: "Enter unique key (e.g., memory_sprinter)",
              }}
            />
            <ProFormText
              name="name"
              label="Name"
              rules={[{ required: true }]}
              fieldProps={{ placeholder: "Enter badge name" }}
            />
            <ProFormText
              name="description"
              label="Description"
              fieldProps={{ placeholder: "Enter badge description (optional)" }}
            />
            <ProFormSelect
              name="rarity"
              label="Rarity"
              placeholder="Select rarity"
              options={["common", "rare", "epic", "legendary"].map((value) => ({
                label: value,
                value,
              }))}
            />
            <ProFormSelect
              name="conditionType"
              label="Condition Type"
              rules={[{ required: true }]}
              placeholder="Select unlock metric"
              options={badgeConditionOptions}
              initialValue="manual"
            />
            <ProFormDigit
              name="conditionValue"
              label="Target Value"
              rules={[{ required: true, type: "number", min: 0 }]}
              fieldProps={{
                placeholder: "0 for manual badges, otherwise greater than 0",
              }}
              initialValue={0}
            />
            <ProFormText
              name="icon"
              label="Lucide Icon Name"
              fieldProps={{
                placeholder: "Enter icon keyword fallback (e.g., trophy)",
              }}
            />
            <ProForm.Item name="iconUrl" label="Icon Image">
              <ImageUploadField category="general" />
            </ProForm.Item>
          </>
        }
      />
    </PortalPageContainer>
  );
}
