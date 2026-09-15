import { DeleteOutlined, EditOutlined, FolderAddOutlined, FolderOpenOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, App, Breadcrumb, Button, Flex, Input, Select, Skeleton, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { ContentStudioNav } from '../../../components/content/ContentStudioNav';
import { adminPaths } from '../../../navigation/adminPaths';
import type { PredefinedMemoryLessonDto } from '../../../types/predefinedMemoryLesson';
import { CollectionSidebar } from '../components/CollectionSidebar';
import { LessonEditor } from '../components/LessonEditor';
import { LessonTable } from '../components/LessonTable';
import { MoveLessonDialog } from '../components/MoveLessonDialog';
import { useContentLibrary } from '../hooks/useContentLibrary';
import './contentLibrary.css';

export default function MemoryCollectionsPage() {
  const library = useContentLibrary();
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const { collectionId, lessonId } = useParams();
  const [params, setParams] = useSearchParams();
  const selected = collectionId ?? params.get('folder') ?? 'all';
  const search = params.get('q') ?? '';
  const status = params.get('status') ?? 'all';
  const category = params.get('category') ?? 'all';
  const [moving, setMoving] = useState<{ lesson: PredefinedMemoryLessonDto; targetId?: string }>();
  const collections = library.collections.data ?? [];
  const lessons = library.lessons.data ?? [];
  const collection = collections.find(c => c.id === selected);
  const assigned = new Set(collections.flatMap(c => c.lessons.map(l => l.id)));
  const unassigned = lessons.filter(l => !assigned.has(l.id));
  const folderLessons = collection ? collection.lessons.map(l => lessons.find(item => item.id === l.id)).filter((l): l is PredefinedMemoryLessonDto => Boolean(l)) : selected === 'unassigned' ? unassigned : lessons;
  const visible = folderLessons.filter(l => `${l.titleEn} ${l.titleZh} ${l.key}`.toLowerCase().includes(search.toLowerCase())
    && (status === 'all' || l.isPublished === (status === 'published')) && (category === 'all' || l.categoryId === category));
  const title = collection?.titleEn ?? (selected === 'unassigned' ? 'Unassigned lessons' : 'All lessons');
  const base = collection ? adminPaths.memoryCollectionLessons(collection.id) : adminPaths.memoryCollections;
  const suffix = params.toString() ? `?${params}` : '';
  const openLesson = (id: string) => navigate(`${collection ? adminPaths.memoryCollectionLessons(collection.id) : adminPaths.predefinedMemoryLessons}/${id}${suffix}`);
  const editLesson = lessonId && lessonId !== 'new' && (!collection || collection.lessons.some(l => l.id === lessonId)) ? lessons.find(l => l.id === lessonId) : undefined;
  const setFilter = (name: string, value: string) => setParams(previous => { const next = new URLSearchParams(previous); if (!value || value === 'all') next.delete(name); else next.set(name, value); return next; });
  const selectFolder = (id: string) => navigate(id === 'all' ? adminPaths.memoryCollections : id === 'unassigned' ? `${adminPaths.memoryCollections}?folder=unassigned` : adminPaths.memoryCollectionLessons(id));
  const drop = (id: string, targetId: string) => {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson || library.busy) return;
    const parents = collections.filter(c => c.lessons.some(l => l.id === id));
    const source = collection ?? parents[0];
    if (source?.id === targetId || (!source && targetId === 'unassigned')) return;
    if (parents.length > 1 && !collection) { setMoving({ lesson, targetId }); return; }
    if (parents.length > 1 && targetId === 'unassigned') { message.info('This lesson belongs to multiple collections. Use Move to and choose a source collection.'); return; }
    const target = collections.find(c => c.id === targetId);
    library.move.mutate({ lessonId: id, input: { sourceCollectionId: source?.id ?? null, targetCollectionId: target?.id ?? null,
      expectedSourceVersion: source?.version, expectedTargetVersion: target?.version, expectedLessonVersion: lesson.version } });
  };

  return <PortalPageContainer><div className='content-library'>
    <ContentStudioNav />
    <header className='library-header'>
      <div><div className='library-eyebrow'>MEMOPAL / CONTENT STUDIO</div><Typography.Title level={2}>Content library</Typography.Title><Typography.Paragraph type='secondary'>A home for every lesson. Create, organize, and publish your learning content.</Typography.Paragraph></div>
      <Space wrap><Link to={`${adminPaths.memoryCollections}/new`}><Button size='large' icon={<FolderAddOutlined />}>New collection</Button></Link><Button size='large' type='primary' icon={<PlusOutlined />} disabled={library.loading || library.error} onClick={() => openLesson('new')}>New lesson</Button></Space>
    </header>
    <div className='library-summary'>
      {[['Collections', collections.length], ['Total lessons', lessons.length], ['Published lessons', lessons.filter(l => l.isPublished).length], ['Draft lessons', lessons.filter(l => !l.isPublished).length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{library.loading ? '—' : value}</strong></div>)}
    </div>
    {!library.loading && !library.error && !library.categories.data?.length && <Alert showIcon type='info' style={{ marginBottom: 16 }} message='Create a category to start adding content' action={<Link to={adminPaths.predefinedMemoryLessonCategories}><Button>Manage categories</Button></Link>} />}
    {library.error ? <Alert showIcon type='error' message='Could not load the content library' description='Check your connection and permissions, then try again.' action={<Button onClick={() => void library.retry()}>Retry</Button>} /> : library.loading ? <Skeleton active paragraph={{ rows: 10 }} /> : selected !== 'all' && selected !== 'unassigned' && !collection ? <Alert type='warning' showIcon message='Collection not found' action={<Button onClick={() => selectFolder('all')}>Back to library</Button>} /> : <div className='library-workspace'>
      <CollectionSidebar collections={collections} selected={selected} total={lessons.length} unassigned={unassigned.length} busy={library.busy}
        onSelect={selectFolder} onCreate={() => navigate(`${adminPaths.memoryCollections}/new`)} onDrop={drop} />
      <main className='library-main'>
        <Breadcrumb items={[{ title: <Link to={adminPaths.memoryCollections}>Library</Link> }, { title }]} />
        <Flex justify='space-between' align='start' gap={12} wrap style={{ marginTop: 20, marginBottom: 22 }}>
          <div><Space><FolderOpenOutlined className='library-section-icon' /><Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>{collection && <Tag color={collection.isPublished ? 'green' : 'default'}>{collection.isPublished ? 'Published' : 'Draft'}</Tag>}</Space>
            <Typography.Paragraph type='secondary' style={{ margin: '8px 0 0' }}>{collection?.descriptionEn || (collection ? `${collection.titleZh} · Drag lessons here from another folder, or create a new lesson.` : 'Your bilingual lesson catalogue, ready to organize.')}</Typography.Paragraph></div>
          {collection && <Space><Button icon={<EditOutlined />} onClick={() => navigate(`${adminPaths.memoryCollections}/${collection.id}`)}>Edit collection</Button><Button danger disabled={library.busy} icon={<DeleteOutlined />} aria-label='Delete collection' onClick={() => modal.confirm({ title: `Delete ${collection.titleEn}?`, content: 'The collection will be removed from the catalogue. Lessons and users’ downloaded copies will be kept.', okText: 'Delete collection', okButtonProps: { danger: true }, onOk: async () => { await library.deleteCollection.mutateAsync(collection); selectFolder('all'); } })} /></Space>}
        </Flex>
        <div className='library-toolbar'>
          <Input allowClear prefix={<SearchOutlined />} aria-label='Search lessons' placeholder='Search lessons by title or key…' value={search} onChange={e => setFilter('q', e.target.value)} />
          <Select aria-label='Filter status' value={status} onChange={value => setFilter('status', value)} options={[{ value: 'all', label: 'All statuses' }, { value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]} />
          <Select aria-label='Filter category' value={category} onChange={value => setFilter('category', value)} options={[{ value: 'all', label: 'All categories' }, ...(library.categories.data ?? []).map(c => ({ value: c.id, label: `${c.emoji} ${c.nameEn}` }))]} />
          <Button aria-label='Refresh library' icon={<ReloadOutlined />} loading={library.collections.isFetching || library.lessons.isFetching} onClick={() => void library.retry()} />
        </div>
        <div className='library-results'><Typography.Text type='secondary'>{visible.length} {visible.length === 1 ? 'lesson' : 'lessons'}{collection ? ' · Collection order' : ''}</Typography.Text>{(search || status !== 'all' || category !== 'all') && <Button type='link' size='small' onClick={() => setParams(selected === 'unassigned' ? { folder: 'unassigned' } : {})}>Clear filters</Button>}</div>
        <LessonTable lessons={visible} collections={collections} collection={collection} busy={library.busy}
          onEdit={l => openLesson(l.id)} onCreate={() => openLesson('new')} onMove={lesson => setMoving({ lesson })}
          onDelete={lesson => modal.confirm({ title: `Delete ${lesson.titleEn}?`, content: 'This removes the lesson from the catalogue and every collection. Collections left empty become drafts. Users keep their downloaded copies.', okText: 'Delete lesson', okButtonProps: { danger: true }, onOk: () => library.deleteLesson.mutateAsync(lesson.id) })}
          onReorder={(lesson, offset) => { if (!collection) return; const ids = collection.lessons.map(l => l.id); const index = ids.indexOf(lesson.id); [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]]; library.reorder.mutate({ collection, lessonIds: ids }); }} />
      </main>
    </div>}
    {!library.loading && !library.error && lessonId && (!collectionId || collection) && (lessonId === 'new' || editLesson
      ? <LessonEditor key={`${collectionId ?? 'all'}:${lessonId}`} editing={editLesson} collection={collection} categories={library.categories.data ?? []} onClose={() => navigate(`${base}${suffix}`)} />
      : <Alert type='warning' showIcon message='Lesson not found' action={<Button onClick={() => navigate(base)}>Back to library</Button>} />)}
    {moving && <MoveLessonDialog key={moving.lesson.id} lesson={moving.lesson} collections={collections} sourceId={collection?.id} targetId={moving.targetId} pending={library.move.isPending}
      onClose={() => setMoving(undefined)} onMove={input => library.move.mutateAsync({ lessonId: moving.lesson.id, input })} />}
  </div></PortalPageContainer>;
}
