import { AppstoreOutlined, FolderOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Typography } from 'antd';
import { useState } from 'react';
import type { MemoryCollectionDto } from '../../../api/adminMemoryCollectionsApi';

export const lessonDragType = 'application/x-memopal-lesson';
export function CollectionSidebar({ collections, selected, total, unassigned, busy, onSelect, onCreate, onDrop }: {
  collections: MemoryCollectionDto[]; selected: string; total: number; unassigned: number; busy: boolean;
  onSelect: (id: string) => void; onCreate: () => void; onDrop: (lessonId: string, targetId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [hover, setHover] = useState<string>();
  const folder = (id: string, title: string, count: number, icon: React.ReactNode, droppable = true) => <button
    key={id} type='button' className={`library-folder ${selected === id ? 'is-selected' : ''} ${hover === id ? 'is-drop-target' : ''}`}
    aria-current={selected === id ? 'page' : undefined} onClick={() => onSelect(id)}
    onDragOver={event => {
      if (droppable && !busy && event.dataTransfer.types.includes(lessonDragType)) {
        event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setHover(id);
      }
    }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHover(undefined); }}
    onDrop={event => {
      event.preventDefault(); setHover(undefined);
      const lessonId = event.dataTransfer.getData(lessonDragType);
      if (droppable && !busy && lessonId) onDrop(lessonId, id);
    }}>
    <span className='library-folder-icon'>{icon}</span><span className='library-folder-name'>{title}</span><span className='library-folder-count'>{count}</span>
  </button>;
  return <aside className='library-sidebar' aria-label='Library folders'>
    <div className='library-sidebar-title'>WORKSPACE</div>
    {folder('all', 'All lessons', total, <AppstoreOutlined />, false)}
    {folder('unassigned', 'Unassigned', unassigned, <InboxOutlined />)}
    <div className='library-sidebar-heading'><span>COLLECTIONS</span><Button type='text' size='small' aria-label='Create collection' icon={<PlusOutlined />} onClick={onCreate} /></div>
    <Input size='small' allowClear aria-label='Find collection' placeholder='Find collection…' value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 10 }} />
    <nav aria-label='Collections' className='library-folder-list'>
      {collections.filter(c => `${c.titleEn} ${c.titleZh}`.toLowerCase().includes(search.toLowerCase())).map(c => folder(c.id, c.titleEn, c.lessons.length, <FolderOutlined />))}
      {!collections.length && <Typography.Paragraph type='secondary' style={{ padding: 12 }}>Create your first collection to start organizing.</Typography.Paragraph>}
    </nav>
    <div className='library-drag-tip'><FolderOutlined /><span>Drag a lesson onto a collection to move it. You can also use “Move to”.</span></div>
  </aside>;
}
