import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Empty, Flex, Input, Select, Skeleton, Space, Tag, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminPredefinedMemoryLessonCategoriesApi } from '../../../api/adminPredefinedMemoryLessonsApi';
import { ContentStudioNav } from '../../../components/content/ContentStudioNav';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import { adminPaths } from '../../../navigation/adminPaths';
import type { PredefinedMemoryLessonCategoryDto } from '../../../types/predefinedMemoryLesson';
import { CategoryEditor } from '../components/CategoryEditor';
import { invalidateContentLibrary, useContentLibrary } from '../hooks/useContentLibrary';

export default function PredefinedMemoryLessonCategoriesPage() {
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const library = useContentLibrary();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const status = params.get('status') ?? 'all';
  const [editing, setEditing] = useState<PredefinedMemoryLessonCategoryDto | 'new'>();
  const categories = library.categories.data ?? [];
  const counts = (id: string) => ({ lessons: library.lessons.data?.filter(l => l.categoryId === id).length ?? 0, collections: library.collections.data?.filter(c => c.categoryId === id).length ?? 0 });
  const filtered = categories.filter(c => `${c.nameEn} ${c.nameZh} ${c.key}`.toLowerCase().includes(search.toLowerCase()) && (status === 'all' || c.isActive === (status === 'active')))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn));
  const filter = (key: string, value: string) => setParams(previous => { const next = new URLSearchParams(previous); if (!value || value === 'all') next.delete(key); else next.set(key, value); return next; });
  const remove = useMutation({ mutationFn: adminPredefinedMemoryLessonCategoriesApi.delete, retry: false, meta: { suppressGlobalErrorToast: true },
    onSuccess: async () => { await invalidateContentLibrary(client); message.success('Category deleted.'); },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not delete category.')) });
  return <PortalPageContainer>
    <ContentStudioNav />
    <header className='studio-header'><div><div className='studio-eyebrow'>CONTENT STUDIO / ORGANIZATION</div><Typography.Title level={2}>Categories</Typography.Title><Typography.Paragraph type='secondary'>Give your library a clear structure. Group lessons and collections by topic.</Typography.Paragraph></div><Button aria-label='New category' type='primary' size='large' icon={<PlusOutlined />} onClick={() => setEditing('new')}>New category</Button></header>
    <div className='studio-stats'>{[['Total categories', categories.length], ['Active in catalogue', categories.filter(c => c.isActive).length], ['Hidden categories', categories.filter(c => !c.isActive).length]].map(([label, value]) => <div className='studio-stat' key={label}><span>{label}</span><strong>{library.loading ? '—' : value}</strong></div>)}</div>
    <div className='studio-toolbar'><Input prefix={<SearchOutlined />} allowClear aria-label='Search categories' placeholder='Search English, Chinese, or key…' value={search} onChange={e => filter('q', e.target.value)} /><Select aria-label='Category visibility' value={status} onChange={value => filter('status', value)} options={[{ value: 'all', label: 'All visibility' }, { value: 'active', label: 'Active' }, { value: 'hidden', label: 'Hidden' }]} /><Button aria-label='Refresh categories' icon={<ReloadOutlined />} loading={library.categories.isFetching} onClick={() => void library.retry()} /></div>
    {library.error ? <Alert showIcon type='error' message='Could not load categories and their usage' action={<Button onClick={() => void library.retry()}>Retry</Button>} /> : library.loading ? <Skeleton active /> : !filtered.length ? <Empty description={categories.length ? 'No categories match your filters' : 'Create a category to organize your first lessons'}><Button onClick={() => categories.length ? setParams({}) : setEditing('new')}>{categories.length ? 'Clear filters' : 'New category'}</Button></Empty> : <div className='studio-card-grid'>
      {filtered.map(category => { const usage = counts(category.id); const inUse = usage.lessons + usage.collections > 0;
        return <article className='studio-card' key={category.id}>
          <div className='studio-card-body'><Flex gap={14} align='start'><span className='studio-category-icon'>{category.emoji}</span><div><Typography.Title level={4} style={{ margin: '0 0 4px' }}>{category.nameEn}</Typography.Title><Typography.Text type='secondary'>{category.nameZh}</Typography.Text></div></Flex>
            <Typography.Paragraph className='studio-card-description' ellipsis={{ rows: 2 }}>{category.descriptionEn || category.descriptionZh || 'Add a description to explain what belongs in this category.'}</Typography.Paragraph>
            <Space wrap><Tag color={category.isActive ? 'green' : 'default'}>{category.isActive ? 'Active' : 'Hidden'}</Tag><Typography.Text type='secondary'>Order {category.sortOrder}</Typography.Text></Space>
            <div style={{ marginTop: 16 }}><Link to={`${adminPaths.memoryCollections}?category=${category.id}`}>{usage.lessons} lessons</Link><Typography.Text type='secondary'> · {usage.collections} collections</Typography.Text></div>
          </div>
          <div className='studio-card-footer'><Button aria-label="Edit category" icon={<EditOutlined />} onClick={() => setEditing(category)}>Edit category</Button><Tooltip title={inUse ? 'Reassign its lessons and collections before deleting.' : 'Delete category'}><span><Button type='text' danger disabled={inUse || remove.isPending} aria-label={`Delete ${category.nameEn}`} icon={<DeleteOutlined />} onClick={() => modal.confirm({ title: `Delete ${category.nameEn}?`, content: 'This unused category will be removed from the catalogue.', okText: 'Delete category', okButtonProps: { danger: true }, onOk: () => remove.mutateAsync(category.id) })} /></span></Tooltip></div>
        </article>;
      })}
    </div>}
    {editing && <CategoryEditor key={editing === 'new' ? 'new' : editing.id} category={editing === 'new' ? undefined : editing} onClose={() => setEditing(undefined)} />}
  </PortalPageContainer>;
}
