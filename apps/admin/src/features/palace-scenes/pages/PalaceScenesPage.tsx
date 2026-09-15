import { AppstoreOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, TableOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Empty, Input, Pagination, Segmented, Select, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { adminPalaceScenesApi } from '../../../api/adminPalaceScenesApi';
import { ContentStudioNav } from '../../../components/content/ContentStudioNav';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import { adminPaths } from '../../../navigation/adminPaths';
import type { PalaceSceneDto } from '../../../types/palaceScene';
import { PalaceSceneEditor } from '../components/PalaceSceneEditor';
import { SceneImage } from '../components/SceneImage';

const queryKey = ['admin-palace-scenes'];
export default function PalaceScenesPage() {
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const navigate = useNavigate();
  const { sceneId } = useParams();
  const [params, setParams] = useSearchParams();
  const query = useQuery({ queryKey, queryFn: adminPalaceScenesApi.list });
  const search = params.get('q') ?? '';
  const status = params.get('status') ?? 'all';
  const access = params.get('access') ?? 'all';
  const view = params.get('view') === 'table' ? 'table' : 'cards';
  const scenes = query.data ?? [];
  const filtered = scenes.filter(s => `${s.name} ${s.description}`.toLowerCase().includes(search.toLowerCase()) && (status === 'all' || s.status === status) && (access === 'all' || s.isPremium === (access === 'premium')));
  const page = Math.min(Math.max(1, Number(params.get('page')) || 1), Math.max(1, Math.ceil(filtered.length / 12)));
  const scene = scenes.find(s => s.id === sceneId);
  const suffix = params.toString() ? `?${params}` : '';
  const edit = (id: string) => navigate(`${adminPaths.palaceSceneEditor(id)}${suffix}`);
  const back = () => navigate(`${adminPaths.palaceScenes}${suffix}`);
  const filter = (key: string, value: string) => setParams(previous => { const next = new URLSearchParams(previous); next.delete('page'); if (!value || value === 'all') next.delete(key); else next.set(key, value); return next; });
  const remove = useMutation({ mutationFn: adminPalaceScenesApi.delete, retry: false, meta: { suppressGlobalErrorToast: true },
    onSuccess: async () => { await client.invalidateQueries({ queryKey }); message.success('Scene deleted.'); },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not delete scene.')) });
  const deleteScene = (item: PalaceSceneDto) => modal.confirm({ title: `Delete ${item.name}?`, content: 'Scenes used by learners cannot be deleted. Open the editor and archive them instead.', okText: 'Delete scene', okButtonProps: { danger: true }, onOk: () => remove.mutateAsync(item.id) });
  const statusTag = (item: PalaceSceneDto) => <Tag color={item.status === 'published' ? 'green' : item.status === 'draft' ? 'blue' : 'default'}>{item.status === 'published' ? 'Published' : item.status === 'draft' ? 'Draft' : 'Archived'}</Tag>;
  if (sceneId) return <PortalPageContainer>{query.isPending ? <Skeleton active /> : query.isError ? <Alert type='error' showIcon message='Could not load scene' action={<Button onClick={() => void query.refetch()}>Retry</Button>} /> : sceneId !== 'new' && !scene ? <Alert type='warning' showIcon message='Scene not found' action={<Button onClick={back}>Back to scenes</Button>} /> : <PalaceSceneEditor key={sceneId} scene={scene} onClose={back} />}</PortalPageContainer>;
  return <PortalPageContainer>
    <ContentStudioNav />
    <header className='studio-header'><div><div className='studio-eyebrow'>CONTENT STUDIO / VISUAL ASSETS</div><Typography.Title level={2}>Palace scenes</Typography.Title><Typography.Paragraph type='secondary'>Turn memorable places into learning spaces. Curate scenes and their memory routes.</Typography.Paragraph></div><Button type='primary' size='large' icon={<PlusOutlined />} onClick={() => edit('new')}>New scene</Button></header>
    <div className='studio-stats'>{[['Total scenes', scenes.length], ['Published', scenes.filter(s => s.status === 'published').length], ['Drafts', scenes.filter(s => s.status === 'draft').length]].map(([label, value]) => <div className='studio-stat' key={label}><span>{label}</span><strong>{query.isPending ? '—' : value}</strong></div>)}</div>
    <div className='studio-toolbar'><Input allowClear prefix={<SearchOutlined />} aria-label='Search scenes' placeholder='Search scenes…' value={search} onChange={e => filter('q', e.target.value)} /><Select aria-label='Scene status' value={status} onChange={value => filter('status', value)} options={[{ value: 'all', label: 'All statuses' }, { value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }, { value: 'archived', label: 'Archived' }]} /><Select aria-label='Scene access' value={access} onChange={value => filter('access', value)} options={[{ value: 'all', label: 'All access' }, { value: 'free', label: 'Free' }, { value: 'premium', label: 'Premium' }]} /><Segmented value={view} onChange={value => filter('view', String(value))} options={[{ value: 'cards', label: 'Gallery', icon: <AppstoreOutlined /> }, { value: 'table', label: 'Table', icon: <TableOutlined /> }]} /><Button aria-label='Refresh scenes' icon={<ReloadOutlined />} loading={query.isFetching} onClick={() => void query.refetch()} /></div>
    {query.isError ? <Alert showIcon type='error' message='Could not load Palace scenes' action={<Button onClick={() => void query.refetch()}>Retry</Button>} /> : query.isPending ? <Skeleton active /> : !filtered.length ? <Empty description={scenes.length ? 'No scenes match your filters' : 'Create your first Palace scene'}><Button onClick={() => scenes.length ? setParams({}) : edit('new')}>{scenes.length ? 'Clear filters' : 'New scene'}</Button></Empty> : <>
      <Typography.Paragraph type='secondary'>{filtered.length} scenes · Open a scene to edit its image and memory route.</Typography.Paragraph>
      {view === 'cards' ? <><div className='studio-card-grid'>{filtered.slice((page - 1) * 12, page * 12).map(item => <article className='studio-card' key={item.id}>
        <button className='studio-scene-cover' aria-label={`Open ${item.name}`} onClick={() => edit(item.id)}><SceneImage path={item.imageUrl} name={item.name} /></button>
        <div className='studio-card-body'><Space wrap>{statusTag(item)}<Tag color={item.isPremium ? 'gold' : 'default'}>{item.isPremium ? 'Premium' : 'Free'}</Tag></Space><Typography.Title level={4} style={{ margin: '12px 0 4px' }}>{item.name}</Typography.Title><Typography.Paragraph className='studio-card-description' ellipsis={{ rows: 2 }}>{item.description || 'Add a description to introduce this learning space.'}</Typography.Paragraph><Typography.Text type='secondary'>{item.loci.length} memory points</Typography.Text></div>
        <div className='studio-card-footer'><Button icon={<EditOutlined />} onClick={() => edit(item.id)}>Edit scene</Button><Button type='text' danger icon={<DeleteOutlined />} aria-label={`Delete ${item.name}`} disabled={remove.isPending} onClick={() => deleteScene(item)} /></div>
      </article>)}</div><Pagination current={page} total={filtered.length} pageSize={12} showSizeChanger={false} hideOnSinglePage onChange={value => setParams(previous => { const next = new URLSearchParams(previous); next.set('page', String(value)); return next; })} style={{ marginTop: 24, justifyContent: 'flex-end' }} /></> : <Table<PalaceSceneDto> rowKey='id' dataSource={filtered} pagination={{ defaultPageSize: 12, showSizeChanger: true }} scroll={{ x: 780 }} columns={[
        { title: 'Scene', width: 360, render: (_, item) => <Space size={14}><button className='studio-scene-cover' style={{ width: 100, flexShrink: 0, borderRadius: 8 }} aria-label={`Open ${item.name}`} onClick={() => edit(item.id)}><SceneImage path={item.imageUrl} name={item.name} /></button><Button type='link' onClick={() => edit(item.id)}>{item.name}</Button></Space> },
        { title: 'Memory points', render: (_, item) => item.loci.length }, { title: 'Status', render: (_, item) => statusTag(item) }, { title: 'Access', render: (_, item) => item.isPremium ? <Tag color='gold'>Premium</Tag> : 'Free' },
        { title: 'Actions', fixed: 'right', width: 110, render: (_, item) => <Space><Button type='text' icon={<EditOutlined />} aria-label={`Edit ${item.name}`} onClick={() => edit(item.id)} /><Button type='text' danger icon={<DeleteOutlined />} aria-label={`Delete ${item.name}`} disabled={remove.isPending} onClick={() => deleteScene(item)} /></Space> },
      ]} />}
    </>}
  </PortalPageContainer>;
}
