import { App, ConfigProvider } from 'antd';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminLanguageProvider } from '../../../i18n/adminLanguage';
import EducationAssessmentPage from './EducationAssessmentPage';

const publish = vi.hoisted(() => vi.fn().mockResolvedValue({}));
vi.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 'author' } }) }));
vi.mock('../components/EducationQuestionEditor', () => ({ EducationQuestionEditor: () => <div>Question editor</div> }));
vi.mock('../hooks/useEducationAuthoring', () => ({
  useEducationAssessment: () => ({
    assessment: { data: { id: 'assessment', courseId: 'course', title: 'Draft test', status: 'draft', version: 2, questions: [
      { id: 'q1', type: 'single-choice', options: [], allowedTextAnswers: [], allowedNumericAnswers: [] },
    ] }, isPending: false, isError: false },
    update: { isPending: false, isError: false }, publish: { isPending: false, mutateAsync: publish },
  }),
  useEducationCourse: () => ({ objectives: { data: [], isPending: false, isError: false } }),
}));
afterEach(() => { cleanup(); publish.mockClear(); });

it('publishes with the public-practice choice selected in the dialog and links back to the course', async () => {
  localStorage.removeItem('memopal.admin.language');
  render(<MemoryRouter initialEntries={['/education/assessments/assessment']}><AdminLanguageProvider><ConfigProvider theme={{ token: { motion: false } }}><App>
    <Routes><Route path="/education/assessments/:assessmentId" element={<EducationAssessmentPage />} /></Routes>
  </App></ConfigProvider></AdminLanguageProvider></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Back to course' })).toHaveAttribute('href', '/education/courses/course');
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Include objective questions in public self-practice' }));
  const buttons = screen.getAllByRole('button', { name: 'Publish' });
  fireEvent.click(buttons[buttons.length - 1]);
  await waitFor(() => expect(publish).toHaveBeenCalledWith({ version: 2, isPublicPractice: true }));
});
