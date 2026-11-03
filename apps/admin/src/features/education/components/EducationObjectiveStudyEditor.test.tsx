import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from 'antd';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AdminLanguageProvider } from '../../../i18n/adminLanguage';
import { StudyItemEditor } from './EducationObjectiveStudyEditor';
import type { EducationStudyItemAuthorDto } from '../../../types/educationAuthoring';

const mocks = vi.hoisted(() => ({
  useEducationStudyItems: vi.fn(), useLearnerStudyItems: vi.fn(), apiImportCsv: vi.fn(), apiImportJson: vi.fn(),
}));
vi.mock('../hooks/useEducationStudyItems', () => ({ useEducationStudyItems: mocks.useEducationStudyItems, useLearnerStudyItems: mocks.useLearnerStudyItems }));
vi.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner-1' } }) }));
vi.mock('../../../api/educationAuthoringApi', () => ({ educationAuthoringApi: { importCsv: mocks.apiImportCsv, importJson: mocks.apiImportJson } }));

const item: EducationStudyItemAuthorDto = { id: 'item-1', objectiveId: 'objective-1', stableKey: 'private-key', position: 1, kind: 'LanguageItem', primary: '春天', secondary: 'Spring', phonetic: 'chūntiān', extra: '作者拆解提示', hint: '作者私有提示', mediaRef: 'media:private', languageCode: 'zh-Hans', status: 'Draft', contentVersion: 1, notConfidentialExamContentConfirmedByUserId: null, notConfidentialExamContentConfirmedAtUtc: null, createdAtUtc: '', updatedAtUtc: '' };

const mutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });
function setup({ rows = [], loading = false, error = false }: { rows?: EducationStudyItemAuthorDto[]; loading?: boolean; error?: boolean } = {}) {
  mocks.useEducationStudyItems.mockReturnValue({
    items: { data: rows, isPending: loading, isError: error, refetch: vi.fn() },
    create: mutation(), update: mutation(), remove: mutation(), reorder: mutation(), publish: mutation(), retract: mutation(), setMetadata: mutation(),
  });
  mocks.useLearnerStudyItems.mockReturnValue({ data: [], isPending: false, isError: false });
  return render(<AdminLanguageProvider><App><StudyItemEditor courseId="course-1" objective={{ id: 'objective-1', courseId: 'course-1', title: 'Spring', createdAt: '', recommendedMemorySetId: null, memoryContentType: 'LanguageItem', languageCode: 'zh-Hans', contentOrigin: 'Original', reviewStatus: 'Unreviewed' }} isPublic /></App></AdminLanguageProvider>);
}
async function chooseCsv(content = 'key,kind,primary,secondary,phonetic,extra,hint,position,language\nspring,LanguageItem,春天,季节,chūntiān,,,1,zh-Hans') {
  const file = new File([content], 'items.csv', { type: 'text/csv' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(input.files?.[0]).toBe(file));
}

describe('EducationObjectiveStudyEditor', () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks(); localStorage.removeItem('memopal.admin.language'); });

  it('renders loading, empty, and error states accessibly', () => {
    const { unmount } = setup({ loading: true }); expect(screen.getByRole('status')).toBeInTheDocument(); unmount();
    const empty = setup(); expect(screen.getByText(/No study items yet/)).toBeInTheDocument(); empty.unmount();
    setup({ error: true }); expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows an import preflight row error and disables confirmation for a rejected plan', async () => {
    mocks.apiImportCsv.mockResolvedValue({ imported: false, canImport: false, created: 0, updated: 0, unchanged: 0, rejectedRows: 1,
      errors: [{ row: 3, field: 'primary', reasonCode: 'PublishedItemConflict', message: 'do not expose raw server detail' }] });
    setup(); fireEvent.click(screen.getAllByRole('button', { name: 'Import' })[0]); await chooseCsv();
    fireEvent.click(screen.getByRole('button', { name: 'Preflight' }));
    expect(await screen.findByText('Students can only see published content. Publish drafts first.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm import' })).toBeDisabled();
    expect(screen.queryByText('do not expose raw server detail')).not.toBeInTheDocument();
  });

  it('warns when the commit plan differs from the successful preflight', async () => {
    mocks.apiImportCsv.mockResolvedValueOnce({ imported: false, canImport: true, created: 1, updated: 0, unchanged: 0, rejectedRows: 0, errors: [] })
      .mockResolvedValueOnce({ imported: true, canImport: true, created: 0, updated: 1, unchanged: 0, rejectedRows: 0, errors: [] });
    setup(); fireEvent.click(screen.getAllByRole('button', { name: 'Import' })[0]); await chooseCsv();
    fireEvent.click(screen.getByRole('button', { name: 'Preflight' })); await screen.findByText('Preflight summary');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm import' }));
    expect(await screen.findByText('Data changed after preflight. Please preflight again.')).toBeInTheDocument();
  });

  it('requires the public exam declaration before publishing', async () => {
    setup({ rows: [item] }); fireEvent.click(screen.getByRole('button', { name: /^Publish$/ }));
    const dialog = await screen.findByRole('dialog');
    const publishButton = within(dialog).getByRole('button', { name: /^Publish$/ });
    expect(publishButton).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'This content is not confidential exam material.' }));
    expect(publishButton).toBeEnabled();
  });

  it('uses the learner projection for preview and never renders author-only fields there', async () => {
    setup({ rows: [item] });
    mocks.useLearnerStudyItems.mockReturnValue({ data: [{ id: 'learner-1', position: 1, kind: 'LanguageItem', primary: '春天', secondary: 'Spring', phonetic: 'chūntiān', extra: null, languageCode: 'zh-Hans', contentVersion: 1, reviewStatus: 'Unreviewed', contentOrigin: 'Original' }], isPending: false, isError: false });
    fireEvent.click(screen.getByRole('button', { name: 'Learner preview' }));
    const preview = within(await screen.findByRole('dialog'));
    expect(preview.getByText('Spring')).toBeInTheDocument();
    expect(preview.getByText('春天')).toBeInTheDocument();
    expect(preview.queryByText('private-key')).not.toBeInTheDocument();
    expect(preview.queryByText('作者私有提示')).not.toBeInTheDocument();
  });

  it('does not submit while an input method editor is composing', async () => {
    const view = setup(); fireEvent.click(screen.getByRole('button', { name: /^Add item$/ }));
    const input = screen.getByLabelText('Content'); fireEvent.compositionStart(input); fireEvent.change(input, { target: { value: '春'.repeat(501) } }); fireEvent.blur(input);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.queryByText('This field is over the character limit.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mocks.useEducationStudyItems.mock.results.at(-1)?.value.create.mutateAsync).not.toHaveBeenCalled();
    view.unmount();
  });
});
