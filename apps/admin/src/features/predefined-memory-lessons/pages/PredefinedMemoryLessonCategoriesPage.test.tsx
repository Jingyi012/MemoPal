import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminMemoryCollectionsApi } from '../../../api/adminMemoryCollectionsApi';
import { adminPredefinedMemoryLessonCategoriesApi, adminPredefinedMemoryLessonsApi } from '../../../api/adminPredefinedMemoryLessonsApi';
import type { PredefinedMemoryLessonCategoryDto } from '../../../types/predefinedMemoryLesson';
import PredefinedMemoryLessonCategoriesPage from './PredefinedMemoryLessonCategoriesPage';

vi.mock('../../../api/adminMemoryCollectionsApi', () => ({ adminMemoryCollectionsApi: { list: vi.fn() } }));
vi.mock('../../../api/adminPredefinedMemoryLessonsApi', () => ({ adminPredefinedMemoryLessonsApi: { list: vi.fn() }, adminPredefinedMemoryLessonCategoriesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
const category: PredefinedMemoryLessonCategoryDto = { id: 'languages', key: 'languages', nameEn: 'Languages', nameZh: '语言', descriptionEn: '', descriptionZh: '', emoji: '🌏', sortOrder: 1, isActive: true, version: 2, createdAt: '', updatedAt: '' };
function mount() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><App><MemoryRouter><PredefinedMemoryLessonCategoriesPage /></MemoryRouter></App></QueryClientProvider>); }
configure({ asyncUtilTimeout: 4000 });
beforeEach(() => { vi.resetAllMocks(); vi.mocked(adminPredefinedMemoryLessonCategoriesApi.list).mockResolvedValue([category]); vi.mocked(adminPredefinedMemoryLessonsApi.list).mockResolvedValue([]); vi.mocked(adminMemoryCollectionsApi.list).mockResolvedValue([]); });
afterEach(cleanup);

describe('Categories', () => {
  it('protects categories used only by collections and links to filtered lessons', async () => {
    vi.mocked(adminMemoryCollectionsApi.list).mockResolvedValue([{ id: 'collection', categoryId: category.id, titleEn: 'Test', titleZh: '测试', descriptionEn: '', descriptionZh: '', emoji: '📚', isPublished: false, sortOrder: 1, version: 1, lessons: [] }]);
    mount();
    expect(await screen.findByRole('button', { name: 'Delete Languages' })).toBeDisabled();
    expect(screen.getByRole('link', { name: '0 lessons' })).toHaveAttribute('href', '/admin/content/memory-collections?category=languages');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search categories' }), { target: { value: '语言' } });
    expect(screen.getByRole('heading', { name: 'Languages' })).toBeInTheDocument();
  });

  it('validates required fields and creates a bilingual category', async () => {
    vi.mocked(adminPredefinedMemoryLessonCategoriesApi.create).mockResolvedValue(category);
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'New category' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save category' }));
    expect(adminPredefinedMemoryLessonCategoriesApi.create).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText('Stable key'), { target: { value: 'new-topic' } });
    fireEvent.change(within(dialog).getByLabelText('English name'), { target: { value: 'New topic' } });
    fireEvent.change(within(dialog).getByLabelText('Chinese name'), { target: { value: '新主题' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save category' }));
    await waitFor(() => expect(adminPredefinedMemoryLessonCategoriesApi.create).toHaveBeenCalledWith(expect.objectContaining({ key: 'new-topic', nameEn: 'New topic', nameZh: '新主题' })));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('confirms hiding an active category before updating', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit category' }));
    const editor = await screen.findByRole('dialog');
    fireEvent.click(within(editor).getByRole('switch'));
    fireEvent.click(within(editor).getByRole('button', { name: 'Save category' }));
    expect(await screen.findByRole('button', { name: 'Hide category' })).toBeEnabled();
    expect(adminPredefinedMemoryLessonCategoriesApi.update).not.toHaveBeenCalled();
  });
});
