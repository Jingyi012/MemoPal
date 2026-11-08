import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AdminLanguageProvider } from '../../../i18n/adminLanguage';
import { EducationStudyCourseDraftButton } from './EducationStudyCourseDraftButton';

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('../../../api/educationAuthoringApi', () => ({ educationAuthoringApi: { createStudyCourseDraft: mocks.create } }));
vi.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 'parent' } }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('requires preview before saving and retains the word list after a save error', async () => {
  localStorage.setItem('memopal.admin.language', 'en');
  mocks.create.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ courseId: 'draft-1', studyItemCount: 2, practiceQuestionCount: 1, alreadyExists: false });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><AdminLanguageProvider><App><EducationStudyCourseDraftButton /></App></AdminLanguageProvider></MemoryRouter>
  </QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Turn a word list into lessons' }));
  fireEvent.change(screen.getByLabelText('Course title'), { target: { value: 'Words for school' } });
  fireEvent.change(screen.getByLabelText(/One word per line/), { target: { value: 'school\t学校\nbook' } });
  fireEvent.click(screen.getByRole('button', { name: 'Preview lessons' }));
  expect(await screen.findByText('1 units · 2 study cards · 1 written recall questions')).toBeInTheDocument();
  expect(mocks.create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save and edit lessons' }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(screen.getByLabelText(/One word per line/)).toHaveValue('school\t学校\nbook');
  fireEvent.click(screen.getByRole('button', { name: 'Save and edit lessons' }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2));
  expect(mocks.create.mock.calls[1][0]).toEqual({ title: 'Words for school', languageCode: 'en', groupSize: null, entries: [{ text: 'school', meaning: '学校' }, { text: 'book', meaning: null }] });
});

it('previews the selected grouping and sends the same size when saving', async () => {
  localStorage.setItem('memopal.admin.language', 'en');
  mocks.create.mockResolvedValueOnce({ courseId: 'grouped-1', studyItemCount: 7, practiceQuestionCount: 0, alreadyExists: false });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><AdminLanguageProvider><App><EducationStudyCourseDraftButton /></App></AdminLanguageProvider></MemoryRouter>
  </QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Turn a word list into lessons' }));
  fireEvent.change(screen.getByLabelText('Course title'), { target: { value: 'Seven words' } });
  fireEvent.change(screen.getByLabelText(/One word per line/), { target: { value: 'one\ntwo\nthree\nfour\nfive\nsix\nseven' } });
  fireEvent.click(screen.getByRole('button', { name: 'Preview lessons' }));
  expect(await screen.findByText('1 units · 7 study cards · 0 written recall questions')).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByLabelText('Study arrangement'));
  fireEvent.click(await screen.findByText('3 words per unit'));
  fireEvent.click(screen.getByRole('button', { name: 'Preview lessons' }));
  expect(await screen.findByText('3 units · 7 study cards · 0 written recall questions')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save and edit lessons' }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
  expect(mocks.create.mock.calls[0][0]).toEqual(expect.objectContaining({ groupSize: 3, entries: expect.any(Array) }));
});
