import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from 'antd';
import { AdminLanguageProvider } from '../../../i18n/adminLanguage';
import { EducationCourseOutlineEditor } from './EducationCourseOutlineEditor';

const api = vi.hoisted(() => ({ getCourseOutline: vi.fn(), updateCourseOutline: vi.fn() }));
vi.mock('../../../api/educationAuthoringApi', () => ({ educationAuthoringApi: api }));
const initial = { version: 3, units: [{ id: 'a', title: 'First', position: 1, objectiveIds: [] }, { id: 'b', title: 'Second', position: 2, objectiveIds: [] }] };
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><AdminLanguageProvider><App><EducationCourseOutlineEditor userId="owner" courseId="course" objectives={[]} /></App></AdminLanguageProvider></QueryClientProvider>);
}
beforeEach(() => { vi.resetAllMocks(); localStorage.setItem('memopal.admin.language', 'en'); api.getCourseOutline.mockResolvedValue(initial); });
afterEach(cleanup);
describe('course outline authoring', () => {
  it('saves author unit order with the loaded version', async () => {
    api.updateCourseOutline.mockResolvedValue({ ...initial, version: 4, units: [...initial.units].reverse() });
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Move unit down 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save learning path' }));
    await waitFor(() => expect(api.updateCourseOutline).toHaveBeenCalledWith('course', { expectedVersion: 3, units: [
      { id: 'b', title: 'Second', objectiveIds: [] }, { id: 'a', title: 'First', objectiveIds: [] },
    ] }));
  });
  it('keeps an edited draft visible after a rejected save', async () => {
    api.updateCourseOutline.mockRejectedValue(new Error('Conflict'));
    setup();
    const inputs = await screen.findAllByLabelText('Unit title');
    fireEvent.change(inputs[0], { target: { value: 'My edited unit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save learning path' }));
    await screen.findByText('Not saved. If someone changed this path, reload before editing.');
    expect(screen.getByDisplayValue('My edited unit')).toBeInTheDocument();
  });
});
