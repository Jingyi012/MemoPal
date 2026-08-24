import { DeleteOutlined, EditOutlined, EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Col, Empty, Flex, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Spin, Switch, Tag, Typography } from 'antd';
import { useMemo, useState, type MouseEvent } from 'react';
import { adminPalaceScenesApi } from '../../../api/adminPalaceScenesApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { ImageUploadField } from '../../content/components/ImageUploadField';
import { useAdminMediaApi } from '../../content/hooks/useAdminMediaApi';
import type { PalaceLocusInput, PalaceSceneDto, PalaceSceneUpsertRequest } from '../../../types/palaceScene';

const queryKey = ['admin-palace-scenes'] as const;
const blankDraft = (): PalaceSceneUpsertRequest => ({ name: '', description: '', imageUrl: '', status: 'draft', isPremium: false, loci: [] });

export default function PalaceScenesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { resolveMediaPath } = useAdminMediaApi();
  const scenesQuery = useQuery({ queryKey, queryFn: adminPalaceScenesApi.list });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PalaceSceneDto | null>(null);
  const [draft, setDraft] = useState<PalaceSceneUpsertRequest>(blankDraft);
  const [selectedLocus, setSelectedLocus] = useState(0);

  const openEditor = (scene?: PalaceSceneDto) => {
    setEditing(scene ?? null);
    setDraft(scene ? {
      name: scene.name, description: scene.description, imageUrl: scene.imageUrl,
      status: scene.status, isPremium: scene.isPremium, expectedVersion: scene.version,
      loci: scene.loci.map(({ id, position, name, description, xPercent, yPercent, radiusPercent }) => ({ id, position, name, description: description ?? undefined, xPercent, yPercent, radiusPercent })),
    } : blankDraft());
    setSelectedLocus(0);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => editing ? adminPalaceScenesApi.update(editing.id, draft) : adminPalaceScenesApi.create(draft),
    retry: false,
    onSuccess: () => { message.success(editing ? 'Palace scene updated.' : 'Palace scene created.'); setOpen(false); void queryClient.invalidateQueries({ queryKey }); },
  });
  const deleteMutation = useMutation({
    mutationFn: adminPalaceScenesApi.delete,
    retry: false,
    onSuccess: () => { message.success('Palace scene deleted.'); void queryClient.invalidateQueries({ queryKey }); },
  });

  const imageUrl = useMemo(() => draft.imageUrl ? resolveMediaPath(draft.imageUrl) : '', [draft.imageUrl, resolveMediaPath]);
  const placeLocus = (event: MouseEvent<HTMLDivElement>) => {
    if (!draft.imageUrl) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const xPercent = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    const yPercent = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
    setDraft((current) => {
      const loci = [...current.loci];
      if (loci[selectedLocus]) loci[selectedLocus] = { ...loci[selectedLocus], xPercent, yPercent };
      else loci.push({ position: loci.length + 1, name: `Locus ${loci.length + 1}`, xPercent, yPercent, radiusPercent: 7 });
      return { ...current, loci };
    });
  };

  const updateLocus = (index: number, values: Partial<PalaceLocusInput>) => setDraft((current) => ({ ...current, loci: current.loci.map((locus, i) => i === index ? { ...locus, ...values } : locus) }));
  const removeLocus = (index: number) => setDraft((current) => ({ ...current, loci: current.loci.filter((_, i) => i !== index).map((locus, i) => ({ ...locus, position: i + 1 })) }));

  return (
    <PortalPageContainer>
      <Flex justify='space-between' align='center' style={{ marginBottom: 20 }}>
        <div><Typography.Title level={2} style={{ margin: 0 }}>Palace Scene Studio</Typography.Title><Typography.Text type='secondary'>Publish one responsive image with ordered loci for the mobile Memory Palace.</Typography.Text></div>
        <Button type='primary' icon={<PlusOutlined />} onClick={() => openEditor()}>New scene</Button>
      </Flex>
      {scenesQuery.isLoading ? <Spin /> : scenesQuery.data?.length ? (
        <Row gutter={[16, 16]}>{scenesQuery.data.map((scene) => (
          <Col xs={24} md={12} xl={8} key={scene.id}><Card cover={<img src={resolveMediaPath(scene.imageUrl)} alt={scene.name} style={{ height: 190, objectFit: 'cover' }} />} actions={[
            <EditOutlined key='edit' onClick={() => openEditor(scene)} />,
            <Popconfirm key='delete' title='Delete this scene?' description='Scenes in use must be archived instead.' onConfirm={() => deleteMutation.mutate(scene.id)}><DeleteOutlined /></Popconfirm>,
          ]}>
            <Card.Meta title={<Space>{scene.name}{scene.isPremium && <Tag color='gold'>Premium</Tag>}</Space>} description={`${scene.loci.length} loci · Version ${scene.version}`} />
          </Card></Col>
        ))}</Row>
      ) : <Empty description='No Palace scenes yet' />}

      <Modal open={open} onCancel={() => setOpen(false)} width={1100} title={editing ? `Edit ${editing.name}` : 'Create Palace scene'} okText={saveMutation.isPending ? 'Saving…' : 'Save scene'} okButtonProps={{ loading: saveMutation.isPending }} onOk={() => saveMutation.mutate()}>
        <Row gutter={20}>
          <Col xs={24} lg={9}>
            <Form layout='vertical'>
              <Form.Item label='Name' required><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Form.Item>
              <Form.Item label='Description'><Input.TextArea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Form.Item>
              <Form.Item label='Scene image' required><ImageUploadField category='palace' value={draft.imageUrl} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} /></Form.Item>
              <Row gutter={12}><Col span={14}><Form.Item label='Status'><Select value={draft.status} onChange={(status) => setDraft({ ...draft, status })} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} /></Form.Item></Col><Col span={10}><Form.Item label='Premium'><Switch checked={draft.isPremium} onChange={(isPremium) => setDraft({ ...draft, isPremium })} /></Form.Item></Col></Row>
            </Form>
          </Col>
          <Col xs={24} lg={15}>
            <Typography.Title level={5}>Locus canvas</Typography.Title>
            <Typography.Paragraph type='secondary'>Select a locus below, then click the image to move it. Choose “Add locus” and click to place a new one.</Typography.Paragraph>
            <div onClick={placeLocus} style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', borderRadius: 16, overflow: 'hidden', cursor: draft.imageUrl ? 'crosshair' : 'default', background: '#f1f5f9', border: '2px solid #ddd6fe' }}>
              {imageUrl ? <img src={imageUrl} alt='Locus canvas' style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Flex align='center' justify='center' style={{ height: '100%' }}><Typography.Text type='secondary'>Upload an image to start placing loci</Typography.Text></Flex>}
              {draft.loci.map((locus, index) => <button type='button' key={locus.id ?? index} onClick={(e) => { e.stopPropagation(); setSelectedLocus(index); }} style={{ position: 'absolute', left: `${locus.xPercent}%`, top: `${locus.yPercent}%`, transform: 'translate(-50%, -50%)', width: 34, height: 34, borderRadius: '50%', border: selectedLocus === index ? '4px solid #facc15' : '3px solid white', color: 'white', background: '#8b5cf6', fontWeight: 800, boxShadow: '0 4px 10px rgba(0,0,0,.3)', cursor: 'pointer' }}>{index + 1}</button>)}
            </div>
            <Flex justify='space-between' align='center' style={{ marginTop: 14, marginBottom: 8 }}><Typography.Text strong>{draft.loci.length} loci</Typography.Text><Button icon={<EnvironmentOutlined />} onClick={() => setSelectedLocus(draft.loci.length)}>Add locus, then click image</Button></Flex>
            <Space direction='vertical' style={{ width: '100%', maxHeight: 240, overflowY: 'auto' }}>
              {draft.loci.map((locus, index) => <Card key={locus.id ?? index} size='small' style={{ borderColor: selectedLocus === index ? '#8b5cf6' : undefined }} onClick={() => setSelectedLocus(index)}>
                <Flex gap={8} align='center'><Tag color='purple'>{index + 1}</Tag><Input value={locus.name} onChange={(e) => updateLocus(index, { name: e.target.value })} placeholder='Locus name' /><InputNumber min={2} max={25} value={locus.radiusPercent} onChange={(value) => updateLocus(index, { radiusPercent: value ?? 7 })} addonAfter='%' style={{ width: 115 }} /><Button danger type='text' icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); removeLocus(index); }} /></Flex>
              </Card>)}
            </Space>
          </Col>
        </Row>
        {saveMutation.isError && <Typography.Text type='danger'>{saveMutation.error instanceof Error ? saveMutation.error.message : 'Save failed.'}</Typography.Text>}
      </Modal>
    </PortalPageContainer>
  );
}
