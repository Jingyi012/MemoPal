import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, HolderOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Empty, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { MemoryCollectionDto } from '../../../api/adminMemoryCollectionsApi';
import type { PredefinedMemoryLessonDto } from '../../../types/predefinedMemoryLesson';
import { lessonDragType } from './CollectionSidebar';

export function LessonTable({ lessons, collections, collection, busy, onEdit, onDelete, onMove, onReorder, onCreate }: {
  lessons: PredefinedMemoryLessonDto[]; collections: MemoryCollectionDto[]; collection?: MemoryCollectionDto; busy: boolean;
  onEdit: (lesson: PredefinedMemoryLessonDto) => void; onDelete: (lesson: PredefinedMemoryLessonDto) => void;
  onMove: (lesson: PredefinedMemoryLessonDto) => void; onReorder: (lesson: PredefinedMemoryLessonDto, offset: number) => void; onCreate: () => void;
}) {
  return <Table<PredefinedMemoryLessonDto> rowKey='id' dataSource={lessons} className='library-table'
    pagination={{ defaultPageSize: 12, showSizeChanger: true, showTotal: total => `${total} lessons` }} scroll={{ x: 880 }}
    onRow={lesson => ({ draggable: !busy, onDragStart: event => { event.dataTransfer.setData(lessonDragType, lesson.id); event.dataTransfer.effectAllowed = 'move'; } })}
    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No lessons here yet, or no matches for these filters.'><Button type='primary' onClick={onCreate}>Create a lesson</Button></Empty> }}
    columns={[
      { title: '', width: 34, render: () => <Tooltip title='Drag to a collection'><HolderOutlined className='library-drag-handle' /></Tooltip> },
      { title: 'Lesson', key: 'title', width: 310, render: (_, lesson) => <Space size={12}>
        <span className='library-lesson-emoji'>{lesson.emoji}</span><div>
          <Button type='link' className='library-lesson-title' onClick={() => onEdit(lesson)}>{lesson.titleEn}</Button>
          <Typography.Text type='secondary' style={{ display: 'block' }}>{lesson.titleZh}</Typography.Text>
        </div></Space> },
      { title: 'Category & technique', width: 170, render: (_, l) => <Space direction='vertical' size={3}><Typography.Text>{l.category.emoji} {l.category.nameEn}</Typography.Text><Typography.Text type='secondary'>{l.techniqueKey === 'palace' ? 'Memory Palace' : 'Number Peg'}</Typography.Text></Space> },
      { title: 'Items', width: 70, render: (_, l) => l.items.length },
      { title: 'Status', width: 115, render: (_, l) => <Space direction='vertical' size={3}><Tag color={l.isPublished ? 'green' : 'default'}>{l.isPublished ? 'Published' : 'Draft'}</Tag>{l.isStarterLesson && <Tag color='gold'>Starter</Tag>}</Space> },
      ...(collection ? [{ title: 'Order', width: 105, render: (_: unknown, l: PredefinedMemoryLessonDto) => {
        const index = collection.lessons.findIndex(item => item.id === l.id);
        return <Space size={0}><Button size='small' type='text' disabled={busy || index === 0} aria-label={`Move ${l.titleEn} up`} icon={<ArrowUpOutlined />} onClick={() => onReorder(l, -1)} /><Button size='small' type='text' disabled={busy || index === collection.lessons.length - 1} aria-label={`Move ${l.titleEn} down`} icon={<ArrowDownOutlined />} onClick={() => onReorder(l, 1)} /></Space>;
      } }] : [{ title: 'Collection', width: 160, render: (_: unknown, l: PredefinedMemoryLessonDto) => {
        const parents = collections.filter(c => c.lessons.some(item => item.id === l.id));
        return <Typography.Text type='secondary'>{parents.map(c => c.titleEn).join(', ') || 'Unassigned'}</Typography.Text>;
      } }]),
      { title: 'Actions', width: 125, fixed: 'right', render: (_, l) => <Space size={0}>
        <Tooltip title='Edit lesson'><Button type='text' disabled={busy} aria-label={`Edit ${l.titleEn}`} icon={<EditOutlined />} onClick={() => onEdit(l)} /></Tooltip>
        <Tooltip title='Move to'><Button type='text' disabled={busy} aria-label={`Move ${l.titleEn}`} icon={<SwapOutlined />} onClick={() => onMove(l)} /></Tooltip>
        <Tooltip title='Delete lesson'><Button type='text' danger disabled={busy} aria-label={`Delete ${l.titleEn}`} icon={<DeleteOutlined />} onClick={() => onDelete(l)} /></Tooltip>
      </Space> },
    ]} />;
}
