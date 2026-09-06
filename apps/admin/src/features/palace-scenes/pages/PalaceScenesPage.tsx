import {
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App,
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
  Segmented,
} from "antd";
import {
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { adminPalaceScenesApi } from "../../../api/adminPalaceScenesApi";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import { ImageUploadField } from "../../../components/media/ImageUploadField";
import { useAdminMediaApi } from "../../../hooks/useAdminMediaApi";
import type {
  PalaceLocusInput,
  PalaceSceneDto,
  PalaceSceneUpsertRequest,
} from "../../../types/palaceScene";

const queryKey = ["admin-palace-scenes"] as const;
type SceneViewMode = "cards" | "table";
const blankDraft = (): PalaceSceneUpsertRequest => ({
  name: "",
  description: "",
  imageUrl: "",
  status: "draft",
  isPremium: false,
  loci: [],
});

export default function PalaceScenesPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const { resolveMediaPath } = useAdminMediaApi();
  const scenesQuery = useQuery({
    queryKey,
    queryFn: adminPalaceScenesApi.list,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PalaceSceneDto | null>(null);
  const [draft, setDraft] = useState<PalaceSceneUpsertRequest>(blankDraft);
  const [selectedLocus, setSelectedLocus] = useState(0);
  const [viewMode, setViewMode] = useState<SceneViewMode>("cards");
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingLocus = useRef<number | null>(null);

  const openEditor = (scene?: PalaceSceneDto) => {
    setEditing(scene ?? null);
    setDraft(
      scene
        ? {
            name: scene.name,
            description: scene.description,
            imageUrl: scene.imageUrl,
            status: scene.status,
            isPremium: scene.isPremium,
            expectedVersion: scene.version,
            loci: scene.loci.map(
              ({
                id,
                position,
                name,
                description,
                nameEn,
                nameZh,
                descriptionEn,
                descriptionZh,
                xPercent,
                yPercent,
                radiusPercent,
              }) => ({
                id,
                position,
                name,
                description: description ?? undefined,
                nameEn: nameEn ?? undefined,
                nameZh: nameZh ?? undefined,
                descriptionEn: descriptionEn ?? undefined,
                descriptionZh: descriptionZh ?? undefined,
                xPercent,
                yPercent,
                radiusPercent,
              }),
            ),
          }
        : blankDraft(),
    );
    setSelectedLocus(0);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? adminPalaceScenesApi.update(editing.id, draft)
        : adminPalaceScenesApi.create(draft),
    retry: false,
    onSuccess: () => {
      message.success(
        editing ? "Palace scene updated." : "Palace scene created.",
      );
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: adminPalaceScenesApi.delete,
    retry: false,
    onSuccess: () => {
      message.success("Palace scene deleted.");
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const imageUrl = useMemo(
    () => (draft.imageUrl ? resolveMediaPath(draft.imageUrl) : ""),
    [draft.imageUrl, resolveMediaPath],
  );
  const canPublish = Boolean(
    draft.name.trim() &&
    draft.imageUrl.trim() &&
    draft.loci.length > 0 &&
    draft.loci.every((locus) => locus.name.trim()),
  );
  const saveScene = () => {
    const isPublishing = draft.status === "published" && editing?.status !== "published";
    if (!isPublishing) {
      saveMutation.mutate();
      return;
    }

    modal.confirm({
      title: "Publish this Palace scene now?",
      content: "It will become available to mobile users immediately after it is saved.",
      okText: "Publish scene",
      onOk: async () => { await saveMutation.mutateAsync(); },
    });
  };
  const getLocusPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      xPercent: Math.max(
        0,
        Math.min(100, ((clientX - bounds.left) / bounds.width) * 100),
      ),
      yPercent: Math.max(
        0,
        Math.min(100, ((clientY - bounds.top) / bounds.height) * 100),
      ),
    };
  };

  const placeLocus = (event: MouseEvent<HTMLDivElement>) => {
    if (!draft.imageUrl) return;
    const position = getLocusPosition(event.clientX, event.clientY);
    if (!position) return;
    setDraft((current) => {
      const loci = [...current.loci];
      if (loci[selectedLocus])
        loci[selectedLocus] = { ...loci[selectedLocus], ...position };
      else
        loci.push({
          position: loci.length + 1,
          name: `Locus ${loci.length + 1}`,
          ...position,
          radiusPercent: 7,
        });
      return { ...current, loci };
    });
  };

  const moveDraggedLocus = (event: PointerEvent<HTMLDivElement>) => {
    const index = draggingLocus.current;
    if (index === null) return;
    const position = getLocusPosition(event.clientX, event.clientY);
    if (position) updateLocus(index, position);
  };

  const stopDragging = () => {
    draggingLocus.current = null;
  };

  const updateLocus = (index: number, values: Partial<PalaceLocusInput>) =>
    setDraft((current) => ({
      ...current,
      loci: current.loci.map((locus, i) =>
        i === index ? { ...locus, ...values } : locus,
      ),
    }));
  const removeLocus = (index: number) => {
    setDraft((current) => ({
      ...current,
      loci: current.loci
        .filter((_, i) => i !== index)
        .map((locus, i) => ({ ...locus, position: i + 1 })),
    }));
    setSelectedLocus((current) =>
      current > index
        ? current - 1
        : Math.min(current, Math.max(0, draft.loci.length - 2)),
    );
  };
  const moveLocus = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draft.loci.length) return;

    setDraft((current) => {
      const loci = [...current.loci];
      [loci[index], loci[targetIndex]] = [loci[targetIndex], loci[index]];
      return {
        ...current,
        // Reordering only changes the persisted position. Every other locus
        // field, including both descriptions, is carried over unchanged.
        loci: loci.map((locus, position) => ({ ...locus, position: position + 1 })),
      };
    });
    setSelectedLocus(targetIndex);
  };

  return (
    <PortalPageContainer>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Palace Scene Studio
          </Typography.Title>
          <Typography.Text type="secondary">
            Publish one responsive image with ordered loci for the mobile Memory
            Palace.
          </Typography.Text>
        </div>
        <Space wrap>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as SceneViewMode)}
            options={[
              { value: "cards", label: "Cards", icon: <AppstoreOutlined /> },
              { value: "table", label: "Table", icon: <TableOutlined /> },
            ]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openEditor()}
          >
            New scene
          </Button>
        </Space>
      </Flex>
      {scenesQuery.isError ? (
        <Alert type="error" showIcon message="Could not load Palace scenes."
          action={<Button onClick={() => void scenesQuery.refetch()}>Retry</Button>} />
      ) : scenesQuery.isLoading ? (
        <Spin />
      ) : scenesQuery.data?.length ? (
        viewMode === "table" ? (
          <Table<PalaceSceneDto>
            rowKey="id"
            dataSource={scenesQuery.data}
            scroll={{ x: 900 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            columns={[
              {
                title: "Scene",
                key: "scene",
                width: 320,
                render: (_, scene) => (
                  <Space align="start">
                    <img
                      src={resolveMediaPath(scene.imageUrl)}
                      alt={scene.name}
                      style={{
                        width: 104,
                        height: 68,
                        borderRadius: 8,
                        objectFit: "cover",
                        flex: "none",
                      }}
                    />
                    <div>
                      <Typography.Text strong>{scene.name}</Typography.Text>
                      <Typography.Paragraph
                        type="secondary"
                        ellipsis={{ rows: 2 }}
                        style={{ margin: "4px 0 0", maxWidth: 185 }}
                      >
                        {scene.description || "No description"}
                      </Typography.Paragraph>
                    </div>
                  </Space>
                ),
              },
              {
                title: "Loci",
                dataIndex: "loci",
                key: "loci",
                width: 90,
                render: (loci: PalaceSceneDto["loci"]) => `${loci.length} loci`,
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                width: 130,
                render: (status: string) => (
                  <Tag color={status === "published" ? "green" : status === "archived" ? "default" : "blue"}>
                    {status}
                  </Tag>
                ),
              },
              {
                title: "Premium",
                dataIndex: "isPremium",
                key: "isPremium",
                width: 100,
                render: (isPremium: boolean) =>
                  isPremium ? <Tag color="gold">Premium</Tag> : <Typography.Text type="secondary">No</Typography.Text>,
              },
              { title: "Version", dataIndex: "version", key: "version", width: 90 },
              {
                title: "Actions",
                key: "actions",
                fixed: "right",
                width: 120,
                render: (_, scene) => (
                  <Space>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={`Edit ${scene.name}`}
                      onClick={() => openEditor(scene)}
                    />
                    <Popconfirm
                      title="Delete this scene?"
                      description="Scenes in use must be archived instead."
                      onConfirm={() => deleteMutation.mutate(scene.id)}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`Delete ${scene.name}`}
                      />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {scenesQuery.data.map((scene) => (
              <Col xs={24} md={12} xl={8} key={scene.id}>
                <Card
                  cover={
                    <img
                      src={resolveMediaPath(scene.imageUrl)}
                      alt={scene.name}
                      style={{ height: 190, objectFit: "cover" }}
                    />
                  }
                  actions={[
                    <EditOutlined key="edit" onClick={() => openEditor(scene)} />,
                    <Popconfirm
                      key="delete"
                      title="Delete this scene?"
                      description="Scenes in use must be archived instead."
                      onConfirm={() => deleteMutation.mutate(scene.id)}
                    >
                      <DeleteOutlined />
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        {scene.name}
                        {scene.isPremium && <Tag color="gold">Premium</Tag>}
                      </Space>
                    }
                    description={`${scene.loci.length} loci · Version ${scene.version}`}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )
      ) : (
        <Empty description="No Palace scenes yet" />
      )}

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        width={1320}
        style={{ top: 16 }}
        styles={{
          body: {
            maxHeight: "calc(100vh - 150px)",
            overflowY: "auto",
            paddingRight: 8,
          },
        }}
        title={editing ? `Edit ${editing.name}` : "Create Palace scene"}
        okText={saveMutation.isPending ? "Saving…" : "Save scene"}
        okButtonProps={{ loading: saveMutation.isPending, disabled: draft.status === "published" && !canPublish }}
        onOk={saveScene}
      >
        <Row gutter={20}>
          <Col xs={24} lg={8}>
            <Form layout="vertical">
              <Form.Item label="Name" required>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Description">
                <Input.TextArea
                  rows={3}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </Form.Item>
              <Form.Item label="Scene image" required>
                <ImageUploadField
                  category="palace"
                  value={draft.imageUrl}
                  onChange={(imageUrl) => setDraft({ ...draft, imageUrl })}
                />
              </Form.Item>
              <Row gutter={12}>
                <Col span={14}>
                  <Form.Item label="Status">
                    <Select
                      value={draft.status}
                      onChange={(status) => setDraft({ ...draft, status })}
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "published", label: "Published" },
                        { value: "archived", label: "Archived" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item label="Premium">
                    <Switch
                      checked={draft.isPremium}
                      onChange={(isPremium) =>
                        setDraft({ ...draft, isPremium })
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Col>
          <Col xs={24} lg={16}>
            <Row gutter={20} align="top">
              <Col xs={24} xl={14}>
                <div style={{ position: "sticky", top: 0, zIndex: 2 }}>
                  <Typography.Title level={5}>Locus canvas</Typography.Title>
                  <Typography.Paragraph type="secondary">
                    Click the image to place or move the selected locus. Drag
                    any marker for fine positioning, or use the X/Y fields in
                    the panel beside it.
                  </Typography.Paragraph>
                  <div
                    ref={canvasRef}
                    onClick={placeLocus}
                    onPointerMove={moveDraggedLocus}
                    onPointerUp={stopDragging}
                    onPointerCancel={stopDragging}
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "4 / 3",
                      borderRadius: 16,
                      overflow: "hidden",
                      cursor: draft.imageUrl ? "crosshair" : "default",
                      background: "#f1f5f9",
                      border: "2px solid #ddd6fe",
                      touchAction: "none",
                    }}
                  >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Locus canvas"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Flex
                  align="center"
                  justify="center"
                  style={{ height: "100%" }}
                >
                  <Typography.Text type="secondary">
                    Upload an image to start placing loci
                  </Typography.Text>
                </Flex>
              )}
              {draft.loci.map((locus, index) => (
                <button
                  type="button"
                  key={locus.id ?? index}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    draggingLocus.current = index;
                    setSelectedLocus(index);
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocus(index);
                  }}
                  style={{
                    position: "absolute",
                    left: `${locus.xPercent}%`,
                    top: `${locus.yPercent}%`,
                    transform: "translate(-50%, -50%)",
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border:
                      selectedLocus === index
                        ? "4px solid #facc15"
                        : "3px solid white",
                    color: "white",
                    background: "#8b5cf6",
                    fontWeight: 800,
                    boxShadow: "0 4px 10px rgba(0,0,0,.3)",
                    cursor: "grab",
                    touchAction: "none",
                  }}
                >
                  {index + 1}
                </button>
              ))}
                  </div>
                  <Flex
                    justify="space-between"
                    align="center"
                    style={{ marginTop: 14, marginBottom: 8 }}
                  >
                    <Typography.Text strong>{draft.loci.length} loci</Typography.Text>
                    <Button
                      icon={<EnvironmentOutlined />}
                      onClick={() => setSelectedLocus(draft.loci.length)}
                    >
                      Add locus, then click image
                    </Button>
                  </Flex>
                </div>
              </Col>
              <Col xs={24} xl={10}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  Locus details
                </Typography.Title>
                <Typography.Paragraph type="secondary">
                  Select a marker or row to edit its details. The canvas stays
                  visible while this list scrolls.
                </Typography.Paragraph>
                <Space
                  direction="vertical"
                  style={{
                    width: "100%",
                    maxHeight: "calc(100vh - 335px)",
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
              {draft.loci.map((locus, index) => (
                <Card
                  key={locus.id ?? index}
                  size="small"
                  style={{
                    borderColor:
                      selectedLocus === index ? "#8b5cf6" : undefined,
                  }}
                  onClick={() => setSelectedLocus(index)}
                >
                  <Flex gap={8} align="center" wrap="wrap">
                    <Tag color="purple">{index + 1}</Tag>
                    <Input
                      value={locus.nameEn ?? locus.name}
                      onChange={(e) =>
                        updateLocus(index, { name: e.target.value, nameEn: e.target.value })
                      }
                      placeholder="Locus name (English)"
                      style={{ flex: "1 1 180px" }}
                    />
                    <Input
                      value={locus.nameZh ?? ""}
                      onChange={(e) =>
                        updateLocus(index, { nameZh: e.target.value })
                      }
                      placeholder="名称（中文）"
                      style={{ flex: "1 1 150px" }}
                    />
                    <Input
                      value={locus.descriptionEn ?? locus.description ?? ""}
                      onChange={(e) =>
                        updateLocus(index, { description: e.target.value, descriptionEn: e.target.value })
                      }
                      placeholder="Description (English)"
                      style={{ flex: "1 1 220px" }}
                    />
                    <Input
                      value={locus.descriptionZh ?? ""}
                      onChange={(e) =>
                        updateLocus(index, { descriptionZh: e.target.value })
                      }
                      placeholder="描述（中文）"
                      style={{ flex: "1 1 180px" }}
                    />
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      value={locus.xPercent}
                      onChange={(value) =>
                        updateLocus(index, {
                          xPercent: value ?? locus.xPercent,
                        })
                      }
                      addonBefore="X"
                      addonAfter="%"
                      style={{ width: 105 }}
                    />
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      value={locus.yPercent}
                      onChange={(value) =>
                        updateLocus(index, {
                          yPercent: value ?? locus.yPercent,
                        })
                      }
                      addonBefore="Y"
                      addonAfter="%"
                      style={{ width: 105 }}
                    />
                    <InputNumber
                      min={2}
                      max={25}
                      precision={1}
                      value={locus.radiusPercent}
                      onChange={(value) =>
                        updateLocus(index, { radiusPercent: value ?? 7 })
                      }
                      addonAfter="%"
                      style={{ width: 105 }}
                    />
                    <Space.Compact>
                      <Button
                        type="text"
                        icon={<ArrowUpOutlined />}
                        aria-label={`Move locus ${index + 1} up`}
                        title="Move up"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLocus(index, -1);
                        }}
                      />
                      <Button
                        type="text"
                        icon={<ArrowDownOutlined />}
                        aria-label={`Move locus ${index + 1} down`}
                        title="Move down"
                        disabled={index === draft.loci.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLocus(index, 1);
                        }}
                      />
                    </Space.Compact>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLocus(index);
                      }}
                    />
                  </Flex>
                </Card>
              ))}
            </Space>
          </Col>
        </Row>
          </Col>
        </Row>
        {saveMutation.isError && (
          <Typography.Text type="danger">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "Save failed."}
          </Typography.Text>
        )}
      </Modal>
    </PortalPageContainer>
  );
}
