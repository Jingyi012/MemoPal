import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from 'antd';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminLanguageProvider } from '../../../i18n/adminLanguage';
import ClassroomDetailPage from './ClassroomDetailPage';

const mocks = vi.hoisted(() => ({ relationships: vi.fn(), members: vi.fn(), courses: vi.fn(), classroomCourses: vi.fn() }));
vi.mock('../hooks/useEducationRelationships', () => ({ useEducationRelationships: mocks.relationships, useClassroomMembers: mocks.members }));
vi.mock('../hooks/useEducationAuthoring', () => ({ useEducationCourses: mocks.courses }));
vi.mock('../hooks/useEducationStudyItems', () => ({ useClassroomCourses: mocks.classroomCourses }));
vi.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('../components/RelationshipForms', () => ({ InviteMemberForm: () => null }));
vi.mock('../components/ClassroomAssignments', () => ({ ClassroomAssignments: () => null }));
vi.mock('../components/ClassroomObjectiveProgress', () => ({ ClassroomObjectiveProgress: () => null }));

function setup(role: 'teacher' | 'student') {
  mocks.relationships.mockReturnValue({ classrooms: { data: [{ id: 'class-1', name: 'Class A', role }] }, invite: { isPending: false } });
  mocks.members.mockReturnValue({ data: [], isPending: false, isError: false });
  mocks.courses.mockReturnValue({ courses: { data: [{ id: 'course-1', title: 'Science' }], isPending: false, isError: false } });
  const setGuidedPractice = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false };
  mocks.classroomCourses.mockReturnValue({
    courses: { data: [{ courseId: 'course-linked', title: 'Linked Science', guidedPracticeEnabled: false, canManageGuidedPractice: role === 'teacher', objectives: [{ id: 'o-1', title: 'Plants', publishedStudyItemCount: 2 }] }], isPending: false, isError: false },
    attach: { mutate: vi.fn(), isPending: false }, detach: { mutate: vi.fn(), isPending: false }, setGuidedPractice,
  });
  const view = render(<AdminLanguageProvider><App><MemoryRouter initialEntries={['/education/classrooms/class-1']}>
    <Routes><Route path="/education/classrooms/:classroomId" element={<ClassroomDetailPage />} /></Routes>
  </MemoryRouter></App></AdminLanguageProvider>);
  return { view, setGuidedPractice };
}

describe('ClassroomDetailPage course links', () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks(); localStorage.removeItem('memopal.admin.language'); });

  it('shows educator link controls and requires confirmation before unlinking', async () => {
    setup('teacher');
    fireEvent.click(screen.getByRole('tab', { name: 'Courses' }));
    expect(screen.getByRole('combobox', { name: 'Select one of your courses' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unlink' }));
    expect(await screen.findByText('Students will no longer be able to read this course’s study content.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Unlink' }).length).toBeGreaterThan(1);
  });

  it('hides link and unlink controls from students', () => {
    setup('student');
    fireEvent.click(screen.getByRole('tab', { name: 'Courses' }));
    expect(screen.queryByRole('combobox', { name: 'Select one of your courses' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unlink' })).not.toBeInTheDocument();
    expect(screen.getByText('Students can only see published content. Publish drafts first.')).toBeInTheDocument();
  });

  it('requires explicit confirmation before opening classroom guided practice', async () => {
    const { setGuidedPractice } = setup('teacher');
    fireEvent.click(screen.getByRole('tab', { name: 'Courses' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Classroom guided practice' }));
    expect(await screen.findByText(/opens current published assessments explicitly marked for self-practice/i)).toBeInTheDocument();
    expect(screen.getByText(/Do not enable it for confidential exam content/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open guided practice' }));
    expect(setGuidedPractice.mutateAsync).toHaveBeenCalledWith({ courseId: 'course-linked', enabled: true });
  });
});
