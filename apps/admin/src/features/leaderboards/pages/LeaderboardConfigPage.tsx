import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, App, Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, GiftOutlined, PlusOutlined, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import { adminLeaderboardsApi } from "../../../api/adminLeaderboardsApi";
import type { LeaderboardBoardDefinition, LeaderboardRewardConfig, LeaderboardRewardTier, LeaderboardScoringTask } from "../../../types/leaderboards";

const queryKey = ["admin-leaderboards-config"] as const;

export default function LeaderboardConfigPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<LeaderboardBoardDefinition>();
  const [editingBoard, setEditingBoard] = useState<LeaderboardBoardDefinition | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<LeaderboardScoringTask[]>([]);
  const [rewardDraft, setRewardDraft] = useState<LeaderboardRewardConfig>(createDefaultRewards());

  const configQuery = useQuery({ queryKey, queryFn: adminLeaderboardsApi.getConfig });
  const updateMutation = useMutation({
    mutationFn: adminLeaderboardsApi.updateConfig,
    onSuccess: async (config) => {
      queryClient.setQueryData(queryKey, config);
      setEditingBoard(null);
      message.success("Leaderboard catalog saved.");
    },
    onError: (error) => {
      const responseMessage = (error as { response?: { data?: { message?: unknown } } })
        .response?.data?.message;
      message.error(typeof responseMessage === "string" && responseMessage.trim()
        ? responseMessage
        : error instanceof Error ? error.message : "Could not save leaderboard settings.");
    },
  });

  useEffect(() => {
    if (!editingBoard) return;
    form.resetFields();
    form.setFieldsValue({
      ...editingBoard,
    });
  }, [editingBoard, form]);

  const openEditor = (board: LeaderboardBoardDefinition) => {
    const tasks = Array.isArray(board.tasks) ? board.tasks : [];
    setTaskDrafts(tasks.length > 0
      ? tasks.map((task) => ({ ...task }))
      : board.kind === "community-weekly-recall" ? createDefaultWeeklyTasks() : []);
    setRewardDraft(cloneRewards(board.rewards ?? createDefaultRewards(board.kind === "community-weekly-recall")));
    setEditingBoard(board);
  };

  const save = async () => {
    if (!editingBoard) return;
    try {
      const values = await form.validateFields();
      const boards = configQuery.data?.boards ?? [];
      const originalId = editingBoard.id;
      if (editingBoard.kind === "community-weekly-recall") {
        const taskError = validateTasks(taskDrafts);
        if (taskError) {
          message.error(taskError);
          return;
        }
        const rewardError = validateRewards(rewardDraft);
        if (rewardError) {
          message.error(rewardError);
          return;
        }
      }
      const nextBoard: LeaderboardBoardDefinition = {
        ...editingBoard,
        ...values,
        tasks: [...taskDrafts].sort((left, right) => left.sortOrder - right.sortOrder),
        rewards: cloneRewards(rewardDraft),
        id: values.id ?? originalId,
        kind: values.kind ?? editingBoard.kind,
      };
      const isExisting = boards.some((board) => board.id === originalId);
      const next = isExisting
        ? boards.map((board) => board.id === originalId ? nextBoard : board)
        : [...boards, nextBoard];
      await updateMutation.mutateAsync({ boards: next });
    } catch {
      // Keep the dialog open so field validation and API errors remain visible.
    }
  };

  const createDraft = () => openEditor({
      id: nextDraftId(configQuery.data?.boards ?? []),
      kind: "community-streak",
      enabled: false,
      sortOrder: (configQuery.data?.boards.length ?? 0) + 1,
      titleEn: "New leaderboard",
      titleZh: "新排行榜",
      descriptionEn: "Draft leaderboard description.",
      descriptionZh: "排行榜说明草稿。",
      tasks: [],
      rewards: createDefaultRewards(false),
    });

  const removeDraft = async (id: string) => {
    const boards = configQuery.data?.boards ?? [];
    await updateMutation.mutateAsync({ boards: boards.filter((board) => board.id !== id) });
  };

  const columns: ColumnsType<LeaderboardBoardDefinition> = [
    {
      title: "Leaderboard",
      key: "title",
      render: (_, board) => <Space direction="vertical" size={0}>
        <Typography.Text strong>{board.titleEn}</Typography.Text>
        <Typography.Text type="secondary">{board.titleZh}</Typography.Text>
      </Space>,
    },
    { title: "Format", dataIndex: "kind", render: (kind: LeaderboardBoardDefinition["kind"]) => formatKind(kind) },
    { title: "Order", dataIndex: "sortOrder", width: 90 },
    {
      title: "Status",
      dataIndex: "enabled",
      width: 110,
      render: (enabled: boolean, board) => board.kind !== "community-weekly-recall"
        ? <Tag color="gold">Draft</Tag>
        : <Tag color={enabled ? "green" : "default"}>{enabled ? "Published" : "Paused"}</Tag>,
    },
    {
      title: "",
      key: "action",
      width: 200,
        render: (_, board) => <Space>
        <Button icon={<SettingOutlined />} onClick={() => openEditor(board)}>Configure</Button>
        {board.id !== "community-weekly" && <Popconfirm title="Delete this draft?" onConfirm={() => void removeDraft(board.id)}>
          <Button danger aria-label={`Delete ${board.titleEn}`} icon={<DeleteOutlined />} />
        </Popconfirm>}
      </Space>,
    },
  ];

  return <PortalPageContainer
    title="Leaderboard center"
    description="Manage the live leaderboard and prepare future formats as unpublished drafts."
    eyebrow="Gamification"
  >
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        message="Draft future boards here; only live ranking formats can be published."
        description="The anonymous community weekly recall board is live. Friends and streak boards can be prepared as drafts, but the server will reject attempts to publish them until their real ranking logic is implemented."
      />
      {configQuery.isError && <Alert type="error" showIcon message="Could not load leaderboard settings." action={<Button size="small" onClick={() => void configQuery.refetch()}>Retry</Button>} />}
      <Card
        title="Leaderboard catalog"
        loading={configQuery.isLoading}
        extra={<Space>
          <Button icon={<ReloadOutlined />} onClick={() => void configQuery.refetch()} loading={configQuery.isFetching}>Reload</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={createDraft}>Add draft</Button>
        </Space>}
      >
        <Table<LeaderboardBoardDefinition>
          rowKey="id"
          columns={columns}
          dataSource={configQuery.data?.boards ?? []}
          pagination={false}
          locale={{ emptyText: "No leaderboard entries configured." }}
        />
      </Card>
    </Space>

    <Modal
      title={editingBoard?.id === "community-weekly" ? "Configure community weekly recall" : "Configure leaderboard draft"}
      open={editingBoard !== null}
      onCancel={() => setEditingBoard(null)}
      onOk={() => void save()}
      confirmLoading={updateMutation.isPending}
      okText="Save changes"
      forceRender
      width={760}
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 20 }}
        message={editingBoard?.id === "community-weekly" ? "Format and period are fixed for this live board." : "Drafts are not shown to players."}
        description={editingBoard?.id === "community-weekly"
          ? "The leaderboard is anonymous, community-wide, and resets weekly on UTC. Scoring and reward changes are frozen for the current week and apply next Monday UTC."
          : "Choose a future format and prepare its copy. Drafts cannot be activated until the matching ranking processor is delivered."}
      />
      <Form form={form} layout="vertical" preserve={false}>
        <Row gutter={16}>
          {editingBoard?.id !== "community-weekly" && <Col xs={24} md={12}>
            <Form.Item name="id" label="Stable ID" rules={[{ required: true }, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "Use lowercase letters, numbers, and hyphens." }, { max: 64 }]}>
              <Input maxLength={64} />
            </Form.Item>
          </Col>}
          {editingBoard?.id !== "community-weekly" && <Col xs={24} md={12}>
            <Form.Item name="kind" label="Draft format" rules={[{ required: true }]}>
              <Select options={[
                { value: "community-streak", label: "Community streak" },
                { value: "friends-weekly-recall", label: "Friends weekly recall" },
              ]} />
            </Form.Item>
          </Col>}
          <Col xs={24} md={12}>
            <Form.Item name="enabled" label="Show in leaderboard center" valuePropName="checked">
              <Switch disabled={editingBoard?.id !== "community-weekly"} checkedChildren="Published" unCheckedChildren="Draft / paused" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="sortOrder" label="Display order" rules={[{ required: true }]}>
              <InputNumber min={1} max={1000} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="titleZh" label="Title · Chinese" rules={[{ required: true, max: 80 }]}><Input maxLength={80} /></Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="titleEn" label="Title · English" rules={[{ required: true, max: 80 }]}><Input maxLength={80} /></Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="descriptionZh" label="Description · Chinese" rules={[{ required: true, max: 240 }]}><Input.TextArea rows={3} maxLength={240} showCount /></Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="descriptionEn" label="Description · English" rules={[{ required: true, max: 240 }]}><Input.TextArea rows={3} maxLength={240} showCount /></Form.Item>
          </Col>
        </Row>
        {editingBoard?.kind === "community-weekly-recall" && <Card size="small" title="Daily tasks & scoring">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="The mobile checklist uses these exact server-calculated tasks."
            description="Choose a supported activity metric, then set its daily target and reward. Score changes are recalculated from qualifying practice history."
          />
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {taskDrafts.map((task, index) => <Card
                key={task.id}
                size="small"
                title={`Task ${index + 1}`}
                extra={<Button danger disabled={taskDrafts.length <= 1} onClick={() => setTaskDrafts((current) => current.filter((_, taskIndex) => taskIndex !== index))}>Remove</Button>}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Task name · Chinese" required>
                      <Input maxLength={80} value={task.titleZh} onChange={(event) => updateTask(index, { titleZh: event.target.value })} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Task name · English" required>
                      <Input maxLength={80} value={task.titleEn} onChange={(event) => updateTask(index, { titleEn: event.target.value })} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Activity counted" required>
                      <Select value={task.metric} onChange={(metric) => updateTask(index, { metric })} options={[
                        { value: "distinct-recall-items", label: "Different items recalled" },
                        { value: "distinct-due-review-items", label: "Different due items recalled" },
                      ]} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Item label="Daily target" required>
                      <InputNumber min={1} max={1000} precision={0} style={{ width: "100%" }} value={task.threshold} onChange={(threshold) => updateTask(index, { threshold: threshold ?? 0 })} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Item label="Points" required>
                      <InputNumber min={0} max={1000} precision={0} style={{ width: "100%" }} value={task.points} onChange={(points) => updateTask(index, { points: points ?? 0 })} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Display order" required>
                      <InputNumber min={1} max={1000} precision={0} style={{ width: "100%" }} value={task.sortOrder} onChange={(sortOrder) => updateTask(index, { sortOrder: sortOrder ?? 0 })} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>)}
              <Button disabled={taskDrafts.length >= 20} onClick={() => setTaskDrafts((current) => [...current, createTask(Math.max(0, ...current.map((task) => task.sortOrder)) + 1, current)])}>
                Add task
              </Button>
          </Space>
        </Card>}
        {editingBoard?.kind === "community-weekly-recall" && <Card size="small" title={<Space><GiftOutlined /> AI Credit rewards</Space>} style={{ marginTop: 16 }}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={`Scheduled payout: ${formatCredits(getScheduledPayout(rewardDraft))} / ${formatCredits(rewardDraft.weeklyBudget)} AI Credits per week`}
            description="The configured maximum is shared across the top 100 rank positions. Tied players share the prize value of the positions they occupy. Changes apply to the next UTC week."
          />
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Enable weekly rewards">
                <Switch checked={rewardDraft.enabled} checkedChildren="On" unCheckedChildren="Off"
                  onChange={(enabled) => setRewardDraft((current) => ({ ...current, enabled }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Weekly budget · AI Credits" required>
                <InputNumber min={1} max={1_000_000} precision={0} style={{ width: "100%" }} value={rewardDraft.weeklyBudget}
                  onChange={(weeklyBudget) => setRewardDraft((current) => ({ ...current, weeklyBudget: weeklyBudget ?? 0 }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Minimum active Recall days" required>
                <InputNumber min={1} max={7} precision={0} style={{ width: "100%" }} value={rewardDraft.minimumActiveDays}
                  onChange={(minimumActiveDays) => setRewardDraft((current) => ({ ...current, minimumActiveDays: minimumActiveDays ?? 0 }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Credit expiry · days" required>
                <InputNumber min={1} max={365} precision={0} style={{ width: "100%" }} value={rewardDraft.expiryDays}
                  onChange={(expiryDays) => setRewardDraft((current) => ({ ...current, expiryDays: expiryDays ?? 0 }))} />
              </Form.Item>
            </Col>
          </Row>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {rewardDraft.tiers.map((tier, index) => <Card
              key={`${index}-${tier.rankFrom}-${tier.rankTo}`}
              size="small"
              title={`Reward tier ${index + 1}`}
              extra={<Button danger disabled={rewardDraft.tiers.length <= 1} onClick={() => setRewardDraft((current) => ({
                ...current,
                tiers: current.tiers.filter((_, tierIndex) => tierIndex !== index),
              }))}>Remove</Button>}
            >
              <Row gutter={12}>
                <Col xs={12} md={6}><Form.Item label="Rank from" required>
                  <InputNumber min={1} max={100} precision={0} style={{ width: "100%" }} value={tier.rankFrom}
                    onChange={(rankFrom) => updateRewardTier(index, { rankFrom: rankFrom ?? 0 })} />
                </Form.Item></Col>
                <Col xs={12} md={6}><Form.Item label="Rank to" required>
                  <InputNumber min={1} max={100} precision={0} style={{ width: "100%" }} value={tier.rankTo}
                    onChange={(rankTo) => updateRewardTier(index, { rankTo: rankTo ?? 0 })} />
                </Form.Item></Col>
                <Col xs={24} md={8}><Form.Item label="Credits per player" required>
                  <InputNumber min={1} max={100_000} precision={0} style={{ width: "100%" }} value={tier.creditsPerWinner}
                    onChange={(creditsPerWinner) => updateRewardTier(index, { creditsPerWinner: creditsPerWinner ?? 0 })} />
                </Form.Item></Col>
              </Row>
            </Card>)}
            <Button disabled={rewardDraft.tiers.length >= 20} onClick={() => setRewardDraft((current) => ({
              ...current,
              tiers: [...current.tiers, { rankFrom: 100, rankTo: 100, creditsPerWinner: 1 }],
            }))}>Add reward tier</Button>
          </Space>
        </Card>}
      </Form>
    </Modal>
  </PortalPageContainer>;

  function updateTask(index: number, patch: Partial<LeaderboardScoringTask>) {
    setTaskDrafts((current) => current.map((task, taskIndex) => taskIndex === index ? { ...task, ...patch } : task));
  }

  function updateRewardTier(index: number, patch: Partial<LeaderboardRewardTier>) {
    setRewardDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier, tierIndex) => tierIndex === index ? { ...tier, ...patch } : tier),
    }));
  }
}

function formatKind(kind: LeaderboardBoardDefinition["kind"]): string {
  switch (kind) {
    case "community-weekly-recall": return "Community · Weekly recall";
    case "community-streak": return "Community · Streak (draft)";
    case "friends-weekly-recall": return "Friends · Weekly recall (draft)";
  }
}

function nextDraftId(boards: readonly LeaderboardBoardDefinition[]): string {
  let number = 1;
  while (boards.some((board) => board.id === `leaderboard-draft-${number}`)) number += 1;
  return `leaderboard-draft-${number}`;
}

function createTask(sortOrder: number, existing: readonly LeaderboardScoringTask[]): LeaderboardScoringTask {
  let number = 1;
  while (existing.some(task => task.id === `daily-task-${number}`)) number += 1;
  return {
    id: `daily-task-${number}`,
    sortOrder,
    metric: "distinct-recall-items",
    threshold: 5,
    points: 5,
    titleEn: `Daily task ${number}`,
    titleZh: `每日任务 ${number}`,
  };
}

function createDefaultWeeklyTasks(): LeaderboardScoringTask[] {
  return [
    {
      id: "daily-recall",
      sortOrder: 1,
      metric: "distinct-recall-items",
      threshold: 5,
      points: 10,
      titleEn: "Daily recall",
      titleZh: "每日回忆",
    },
    {
      id: "due-review",
      sortOrder: 2,
      metric: "distinct-due-review-items",
      threshold: 5,
      points: 5,
      titleEn: "Due-item recall",
      titleZh: "到期项目回忆",
    },
  ];
}

function createDefaultRewards(enabled = true): LeaderboardRewardConfig {
  return {
    enabled,
    weeklyBudget: 5000,
    minimumActiveDays: 3,
    expiryDays: 90,
    tiers: [
      { rankFrom: 1, rankTo: 1, creditsPerWinner: 600 },
      { rankFrom: 2, rankTo: 3, creditsPerWinner: 300 },
      { rankFrom: 4, rankTo: 10, creditsPerWinner: 150 },
      { rankFrom: 11, rankTo: 25, creditsPerWinner: 80 },
      { rankFrom: 26, rankTo: 50, creditsPerWinner: 40 },
      { rankFrom: 51, rankTo: 100, creditsPerWinner: 11 },
    ],
  };
}

function cloneRewards(rewards: LeaderboardRewardConfig): LeaderboardRewardConfig {
  return { ...rewards, tiers: rewards.tiers.map((tier) => ({ ...tier })) };
}

function getScheduledPayout(rewards: LeaderboardRewardConfig): number {
  return rewards.tiers.reduce((sum, tier) =>
    sum + Math.max(0, tier.rankTo - tier.rankFrom + 1) * tier.creditsPerWinner, 0);
}

function formatCredits(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function validateRewards(rewards: LeaderboardRewardConfig): string | null {
  if (!Number.isInteger(rewards.weeklyBudget) || rewards.weeklyBudget < 1 || rewards.weeklyBudget > 1_000_000) {
    return "Weekly reward budget must be between 1 and 1,000,000 AI Credits.";
  }
  if (!Number.isInteger(rewards.minimumActiveDays) || rewards.minimumActiveDays < 1 || rewards.minimumActiveDays > 7) {
    return "Minimum active Recall days must be between 1 and 7.";
  }
  if (!Number.isInteger(rewards.expiryDays) || rewards.expiryDays < 1 || rewards.expiryDays > 365) {
    return "Credit expiry must be between 1 and 365 days.";
  }
  if (rewards.tiers.length < 1 || rewards.tiers.length > 20) return "Configure between 1 and 20 reward tiers.";
  let expectedRank = 1;
  for (const [index, tier] of [...rewards.tiers].sort((a, b) => a.rankFrom - b.rankFrom).entries()) {
    if (!Number.isInteger(tier.rankFrom) || !Number.isInteger(tier.rankTo) ||
        tier.rankFrom !== expectedRank || tier.rankTo < tier.rankFrom || tier.rankTo > 100) {
      return `Reward tier ${index + 1} must continue the rank range without gaps or overlaps.`;
    }
    if (!Number.isInteger(tier.creditsPerWinner) || tier.creditsPerWinner < 1 || tier.creditsPerWinner > 100_000) {
      return `Reward tier ${index + 1} needs a credit amount from 1 to 100,000.`;
    }
    expectedRank = tier.rankTo + 1;
  }
  if (expectedRank !== 101) return "Reward tiers must cover every rank from 1 to 100.";
  if (getScheduledPayout(rewards) > rewards.weeklyBudget) {
    return "The scheduled reward total cannot exceed the weekly budget.";
  }
  return null;
}

function validateTasks(tasks: readonly LeaderboardScoringTask[]): string | null {
  if (tasks.length < 1 || tasks.length > 20) return "Add between 1 and 20 scoring tasks.";
  const ids = new Set<string>();
  const sortOrders = new Set<number>();
  for (const [index, task] of tasks.entries()) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(task.id) || ids.has(task.id)) return `Task ${index + 1} needs a unique valid ID.`;
    ids.add(task.id);
    if (!Number.isInteger(task.sortOrder) || task.sortOrder < 1 || task.sortOrder > 1000 || sortOrders.has(task.sortOrder)) {
      return "Each task needs a unique display order from 1–1000.";
    }
    sortOrders.add(task.sortOrder);
    if (!task.titleZh.trim() || task.titleZh.length > 80 || !task.titleEn.trim() || task.titleEn.length > 80) {
      return `Task ${index + 1} needs Chinese and English names (up to 80 characters).`;
    }
    if (!Number.isInteger(task.threshold) || !Number.isInteger(task.points) || task.threshold < 1 || task.threshold > 1000 || task.points < 0 || task.points > 1000) {
      return `Task ${index + 1} needs a target from 1–1000 and points from 0–1000.`;
    }
  }
  return null;
}
