import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminPalaceScenesApi } from '../../../api/adminPalaceScenesApi';
import type { PalaceSceneDto } from '../../../types/palaceScene';
import PalaceScenesPage from './PalaceScenesPage';

vi.mock('../../../api/adminPalaceScenesApi', () => ({ adminPalaceScenesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
const scene: PalaceSceneDto = { id: 'scene', name: 'Quiet library', description: 'A familiar space', imageUrl: '/test-scene.png', status: 'draft', isPremium: false, isTemplate: true, version: 4, createdAt: '', updatedAt: '',
  loci: [1, 2].map(i => ({ id: `point-${i}`, position: i, name: `Point ${i}`, nameZh: `点${i}`, descriptionEn: `Description ${i}`, descriptionZh: `描述${i}`, xPercent: i * 25, yPercent: 50, radiusPercent: 7, createdAt: '', updatedAt: '' })) };
function mount(path = '/admin/content/palace-scenes') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><App><MemoryRouter initialEntries={[path]}><Routes><Route path='/admin/content/palace-scenes' element={<PalaceScenesPage />} /><Route path='/admin/content/palace-scenes/:sceneId' element={<PalaceScenesPage />} /></Routes></MemoryRouter></App></QueryClientProvider>);
}
configure({ asyncUtilTimeout: 4000 });
beforeEach(() => { vi.resetAllMocks(); vi.mocked(adminPalaceScenesApi.list).mockResolvedValue([scene]); });
afterEach(cleanup);

describe('Palace scene studio', () => {
  it('shows status in the gallery, searches, and opens the scene workspace', async () => {
    mount();
    expect(await screen.findByRole('button', { name: 'Open Quiet library' })).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search scenes' }), { target: { value: 'missing' } });
    expect(await screen.findByText('No scenes match your filters')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open Quiet library' }));
    expect(await screen.findByRole('heading', { name: 'Scene canvas' })).toBeInTheDocument();
    expect(screen.getByLabelText('Scene name')).toHaveValue('Quiet library');
  });

  it('prevents saving an empty draft', async () => {
    mount('/admin/content/palace-scenes/new');
    expect(await screen.findByRole('button', { name: 'Save scene' })).toBeDisabled();
    expect(adminPalaceScenesApi.create).not.toHaveBeenCalled();
  });

  it('preserves bilingual point data when reordering and supports keyboard positioning', async () => {
    vi.mocked(adminPalaceScenesApi.update).mockResolvedValue(scene);
    mount('/admin/content/palace-scenes/scene');
    fireEvent.click(await screen.findByRole('button', { name: 'Move point 2 up' }));
    expect(screen.getByLabelText('Chinese point description')).toHaveValue('描述2');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Memory point 1: Point 2' }), { key: 'ArrowRight' });
    fireEvent.click(screen.getByRole('button', { name: 'Save scene' }));
    await waitFor(() => expect(adminPalaceScenesApi.update).toHaveBeenCalledWith('scene', expect.objectContaining({ expectedVersion: 4,
      loci: [expect.objectContaining({ id: 'point-2', position: 1, xPercent: 51, descriptionEn: 'Description 2', descriptionZh: '描述2' }), expect.objectContaining({ id: 'point-1', position: 2 })],
    })));
  });

  it('keeps unsaved changes when a save fails and confirms before leaving', async () => {
    vi.mocked(adminPalaceScenesApi.update).mockRejectedValue(new Error('Save rejected'));
    mount('/admin/content/palace-scenes/scene');
    fireEvent.change(await screen.findByLabelText('Scene name'), { target: { value: 'Updated library' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save scene' }));
    await waitFor(() => expect(adminPalaceScenesApi.update).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled());
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Scene name')).toHaveValue('Updated library');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('dialog', { name: 'Discard scene changes?' })).toBeInTheDocument();
  });
});
