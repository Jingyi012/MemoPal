import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminMemoryCollectionsApi, type MemoryCollectionDto } from '../../../api/adminMemoryCollectionsApi';
import { adminPredefinedMemoryLessonCategoriesApi, adminPredefinedMemoryLessonsApi } from '../../../api/adminPredefinedMemoryLessonsApi';
import type { PredefinedMemoryLessonCategoryDto, PredefinedMemoryLessonDto } from '../../../types/predefinedMemoryLesson';
import MemoryCollectionsPage from './MemoryCollectionsPage';

vi.mock('../../../api/adminMemoryCollectionsApi', () => ({ adminMemoryCollectionsApi: { list: vi.fn(), moveLesson: vi.fn(), delete: vi.fn(), save: vi.fn() } }));
vi.mock('../../../api/adminPredefinedMemoryLessonsApi', () => ({ adminPredefinedMemoryLessonsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }, adminPredefinedMemoryLessonCategoriesApi: { list: vi.fn() } }));
const category: PredefinedMemoryLessonCategoryDto = { id: 'category', key: 'languages', nameEn: 'Languages', nameZh: '语言', descriptionEn: '', descriptionZh: '', emoji: '🌏', sortOrder: 1, isActive: true, version: 1, createdAt: '', updatedAt: '' };
const lesson: PredefinedMemoryLessonDto = { id: 'lesson', key: 'spring-words', titleEn: 'Spring words', titleZh: '春天词汇', descriptionEn: '', descriptionZh: '', emoji: '🌱', categoryId: category.id, category, techniqueKey: 'number-peg', goalType: 'spelling', sortOrder: 1, isPublished: false, isStarterLesson: false, version: 3,
  items: [{ id: 'item', position: 1, contentEn: 'Spring', contentZh: '春', createdAt: '', updatedAt: '' }], createdAt: '', updatedAt: '' };
const collection: MemoryCollectionDto = { id: 'collection', titleEn: 'Language basics', titleZh: '基础语言', descriptionEn: '', descriptionZh: '', emoji: '📚', categoryId: category.id, isPublished: false, sortOrder: 1, version: 4, lessons: [] };
function mount(path = '/admin/content/memory-collections') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><App><MemoryRouter initialEntries={[path]}><Routes>
    <Route path='/admin/content/memory-collections' element={<MemoryCollectionsPage />} />
    <Route path='/admin/content/memory-collections/:collectionId/lessons' element={<MemoryCollectionsPage />} />
    <Route path='/admin/content/memory-collections/:collectionId/lessons/:lessonId' element={<MemoryCollectionsPage />} />
    <Route path='/admin/content/predefined-memory-lessons/:lessonId' element={<MemoryCollectionsPage />} />
  </Routes></MemoryRouter></App></QueryClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(adminMemoryCollectionsApi.list).mockResolvedValue([collection]);
  vi.mocked(adminPredefinedMemoryLessonsApi.list).mockResolvedValue([lesson]);
  vi.mocked(adminPredefinedMemoryLessonCategoriesApi.list).mockResolvedValue([category]);
  vi.mocked(adminMemoryCollectionsApi.moveLesson).mockResolvedValue(true);
});
afterEach(cleanup);

describe('Content library', () => {
  it('searches bilingual titles and opens a lesson directly from the library', async () => {
    mount();
    expect(await screen.findByRole('button', { name: 'Spring words' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search lessons' }), { target: { value: '春天' } });
    expect(screen.getByRole('button', { name: 'Spring words' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Spring words' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByDisplayValue('Spring words')).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue('春')).toBeInTheDocument();
  });

  it('moves an unassigned lesson with its version and refreshes the folder counts', async () => {
    mount();
    await screen.findByRole('button', { name: 'Spring words' });
    vi.mocked(adminMemoryCollectionsApi.list).mockResolvedValue([{ ...collection, version: 5, lessons: [lesson] }]);
    const target = screen.getByRole('button', { name: /Language basics/ });
    fireEvent.drop(target, { dataTransfer: { getData: () => lesson.id } });
    await waitFor(() => expect(adminMemoryCollectionsApi.moveLesson).toHaveBeenCalledWith('lesson', {
      sourceCollectionId: null, targetCollectionId: 'collection', expectedSourceVersion: undefined, expectedTargetVersion: 4, expectedLessonVersion: 3,
    }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Language basics/ })).toHaveTextContent('1'));
  });

  it('creates a lesson in its collection with one atomic request', async () => {
    vi.mocked(adminPredefinedMemoryLessonsApi.create).mockResolvedValue(lesson);
    mount('/admin/content/memory-collections/collection/lessons/new');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('New lesson in Language basics')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save lesson' })).toBeDisabled();
    expect(adminPredefinedMemoryLessonsApi.create).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText('Stable key'), { target: { value: 'new-lesson' } });
    fireEvent.change(within(dialog).getByLabelText('English title'), { target: { value: 'New lesson' } });
    fireEvent.change(within(dialog).getByLabelText('Chinese title'), { target: { value: '新课程' } });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Item 1 English content' }), { target: { value: 'One' } });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Item 1 Chinese content' }), { target: { value: '一' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save lesson' }));
    await waitFor(() => expect(adminPredefinedMemoryLessonsApi.create).toHaveBeenCalledWith(expect.objectContaining({ collectionId: 'collection', expectedCollectionVersion: 4, key: 'new-lesson' })));
    expect(adminMemoryCollectionsApi.save).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps an edited draft open after a rejected save', async () => {
    vi.mocked(adminPredefinedMemoryLessonsApi.update).mockRejectedValue(new Error('Conflict'));
    mount('/admin/content/predefined-memory-lessons/lesson');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByDisplayValue('Spring words'), { target: { value: 'Updated title' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save lesson' }));
    await waitFor(() => expect(adminPredefinedMemoryLessonsApi.update).toHaveBeenCalledWith('lesson', expect.objectContaining({ titleEn: 'Updated title', expectedVersion: 3 })));
    expect(within(dialog).getByDisplayValue('Updated title')).toBeInTheDocument();
  });

  it('requires confirmation before deleting a lesson', async () => {
    vi.mocked(adminPredefinedMemoryLessonsApi.delete).mockResolvedValue(true);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Spring words' }));
    expect(adminPredefinedMemoryLessonsApi.delete).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete lesson' }));
    await waitFor(() => expect(adminPredefinedMemoryLessonsApi.delete).toHaveBeenCalledWith('lesson', expect.anything()));
  });

  it('shows a retry action when collection loading fails', async () => {
    vi.mocked(adminMemoryCollectionsApi.list).mockRejectedValue(new Error('Unavailable'));
    mount();
    expect(await screen.findByText('Could not load the content library')).toBeInTheDocument();
    vi.mocked(adminMemoryCollectionsApi.list).mockResolvedValue([collection]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('button', { name: 'Spring words' })).toBeInTheDocument();
  });
});
