import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
} from "antd";
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormText,
} from "@ant-design/pro-components";
import { adminUsersApi } from "../../../api/adminUsersApi";
import { useAdminAiCredits } from "../hooks/useAdminAiCredits";

export default function AiCreditsPage() {
  const [userId, setUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [page, setPage] = useState(1);
  const { balance, history, grant } = useAdminAiCredits(userId, page);
  const users = useQuery({
    queryKey: ["admin-ai-credit-user-search", userSearch],
    queryFn: () => adminUsersApi.list(1, 20, userSearch.trim(), false),
    enabled: userSearch.trim().length >= 2,
    staleTime: 30_000,
  });
  const { message } = App.useApp();
  const selectedUser = users.data?.data.find((user) => user.id === userId);
  return (
    <PageContainer
      title="AI credits"
      subTitle="Manage server-owned AI balances and audited manual grants"
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Card
          title="Select a user"
          bordered={false}
          styles={{ body: { paddingTop: 0 } }}
        >
          <Typography.Text type="secondary">
            Search by email or username, then choose the account whose wallet
            you want to manage.
          </Typography.Text>
          <Select
            showSearch
            allowClear
            style={{ width: "100%", marginTop: 12 }}
            size="large"
            placeholder="Type at least 2 characters to search"
            filterOption={false}
            onSearch={setUserSearch}
            onChange={(value) => {
              setUserId(value ?? "");
              setPage(1);
            }}
            notFoundContent={
              userSearch.trim().length < 2 ? (
                "Keep typing to search"
              ) : users.isFetching ? (
                "Searching…"
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No matching users"
                />
              )
            }
            options={(users.data?.data ?? []).map((user) => ({
              value: user.id,
              label: `${user.displayName} · ${user.email}`,
            }))}
          />
        </Card>
        <Alert
          type="info"
          showIcon
          message="Manual credit grants are audited. Paid subscriptions and top-ups require verified billing integration; this form does not simulate a purchase."
        />
        {(balance.isError || history.isError) && (
          <Alert
            type="error"
            showIcon
            message="Could not load wallet"
            action={
              <Button
                onClick={() => {
                  void balance.refetch();
                  void history.refetch();
                }}
              >
                Retry
              </Button>
            }
          />
        )}
        {userId && (
          <Card
            loading={balance.isLoading}
            title={
              selectedUser
                ? `${selectedUser.displayName}'s wallet`
                : "Selected user wallet"
            }
            extra={
              <Typography.Text type="secondary">
                {selectedUser?.email}
              </Typography.Text>
            }
          >
            <Space size="large" wrap align="start">
              <Statistic
                title="Available"
                value={balance.data?.available ?? 0}
              />
              <Statistic
                title="Subscription"
                value={balance.data?.subscription ?? 0}
              />
              <Statistic
                title="Purchased / other"
                value={balance.data?.purchased ?? 0}
              />
              <ModalForm<{ reference: string; amount: number }>
                title={`Grant credits to ${selectedUser?.displayName ?? "selected user"}`}
                trigger={<Button type="primary">Grant credits</Button>}
                modalProps={{ destroyOnHidden: true }}
                initialValues={{ reference: crypto.randomUUID() }}
                onFinish={async (values) => {
                  try {
                    await grant.mutateAsync({ ...values, expiresAt: null });
                    void message.success("Credits granted");
                    return true;
                  } catch {
                    void message.error(
                      "Grant failed. Keep the same reference when retrying.",
                    );
                    return false;
                  }
                }}
              >
                <ProFormText
                  name="reference"
                  label="Unique audit reference"
                  rules={[{ required: true }, { max: 180 }]}
                />
                <ProFormDigit
                  name="amount"
                  label="Credits (no expiry)"
                  min={1}
                  max={1000000}
                  fieldProps={{ precision: 0 }}
                  rules={[{ required: true }]}
                />
              </ModalForm>
            </Space>
          </Card>
        )}
        {userId && (
          <Table
            rowKey="id"
            loading={history.isLoading}
            dataSource={history.data ?? []}
            pagination={false}
            locale={{ emptyText: "No credit history for this user" }}
            columns={[
              { title: "Event", dataIndex: "kind" },
              { title: "Credit change", dataIndex: "amount" },
              {
                title: "Time (UTC)",
                dataIndex: "createdAt",
                render: (value: string) => new Date(value).toISOString(),
              },
            ]}
          />
        )}
        {userId && history.data?.length ? (
          <Space>
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              disabled={history.data.length !== 50}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </Space>
        ) : null}
      </Space>
    </PageContainer>
  );
}
