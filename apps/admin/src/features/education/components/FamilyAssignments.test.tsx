import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FamilyAssignments } from './FamilyAssignments';

const state = vi.hoisted(() => ({ status: 'published', loadError: false, refetch: vi.fn(), children: [] as { studentUserId: string; studentName: string }[] }));
vi.mock('../hooks/useEducationAuthoring', () => ({
  useEducationCourses: () => ({ courses: { data: [{ id: 'course', title: 'School words', isPlatformCourse: false }], isPending: false, isSuccess: true } }),
  useEducationCourse: () => ({ assessments: { data: state.loadError ? undefined : [{ id: 'lesson', title: 'My vocabulary lesson', status: state.status }], isSuccess: !state.loadError, isError: state.loadError, refetch: state.refetch } }),
}));
vi.mock('../hooks/useEducationFamilyAssignments', () => ({ useEducationFamilyAssignments: () => ({
  children: { data: state.children, isPending: false, isError: false },
  assignments: { data: [], isPending: false, isError: false },
  createAssignment: { isPending: false, mutate: vi.fn() },
}) }));
vi.mock('./EducationAssignmentGradebook', () => ({ EducationAssignmentGradebook: () => null }));
vi.mock('./PublishedAssessmentSelect', () => ({ PublishedAssessmentSelect: ({ value }: { value?: string }) => <input aria-label="Selected assessment" value={value ?? ''} readOnly /> }));
afterEach(() => { cleanup(); state.status = 'published'; state.children = []; state.loadError = false; state.refetch.mockClear(); });

it('opens the verified published lesson from the course link, but cannot assign without verified children', async () => {
  render(<MemoryRouter><FamilyAssignments userId="parent" initialCourseId="course" initialAssessmentId="lesson" /></MemoryRouter>);
  const dialog = within(await screen.findByRole('dialog'));
  expect(dialog.getByLabelText('Practice title')).toHaveValue('My vocabulary lesson');
  expect(dialog.getByLabelText('Selected assessment')).toHaveValue('lesson');
  expect(dialog.getByRole('button', { name: 'Create assignment' })).toBeDisabled();
});

it('does not open or preselect an unpublished assessment supplied in the URL', () => {
  state.status = 'draft';
  render(<MemoryRouter><FamilyAssignments userId="parent" initialCourseId="course" initialAssessmentId="lesson" /></MemoryRouter>);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('This lesson is unavailable for assignment. Choose one of your published lessons instead.')).toBeInTheDocument();
});

it('explains an inaccessible course link instead of silently ignoring it', () => {
  render(<MemoryRouter><FamilyAssignments userId="parent" initialCourseId="other-course" initialAssessmentId="lesson" /></MemoryRouter>);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('This lesson is unavailable for assignment. Choose one of your published lessons instead.')).toBeInTheDocument();
});

it('offers retry when the linked lesson cannot be loaded', () => {
  state.loadError = true;
  render(<MemoryRouter><FamilyAssignments userId="parent" initialCourseId="course" initialAssessmentId="lesson" /></MemoryRouter>);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('Could not load the linked lesson.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(state.refetch).toHaveBeenCalledOnce();
});
