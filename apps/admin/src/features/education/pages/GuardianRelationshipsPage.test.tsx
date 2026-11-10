import { App, ConfigProvider } from 'antd';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminLanguageProvider } from '../../../i18n/adminLanguage';
import type { GuardianLinkDto } from '../../../types/educationRelationships';
import GuardianRelationshipsPage from './GuardianRelationshipsPage';

const mocks = vi.hoisted(() => ({ relationships: vi.fn() }));
vi.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 'my-id' }, isAdmin: true }) }));
vi.mock('../hooks/useEducationRelationships', () => ({ useEducationRelationships: mocks.relationships }));
const mutation = () => ({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) });
const query = (data: GuardianLinkDto[]) => ({ data, isPending: false, isError: false, refetch: vi.fn() });
const pending: GuardianLinkDto = { id: 'review', guardianUserId: 'guardian-id', studentUserId: 'learner-id', guardianDisplayName: 'Lin Parent',
  studentDisplayName: 'Amy Learner', status: 'pending', studentConfirmed: true, adminVerified: false, createdAt: '2026-11-08T00:00:00Z' };

function setup() {
  const data = {
    guardianLinks: query([{ ...pending, id: 'mine', guardianUserId: 'my-id', guardianDisplayName: 'Me', studentDisplayName: 'My Learner', studentConfirmed: false }]),
    guardianVerifications: query([pending]), createGuardianLink: mutation(), confirmGuardianLink: mutation(), verifyGuardianLink: mutation(), revokeGuardianLink: mutation(),
  };
  mocks.relationships.mockReturnValue(data);
  render(<MemoryRouter><AdminLanguageProvider><ConfigProvider theme={{ token: { motion: false } }}><App><GuardianRelationshipsPage /></App></ConfigProvider></AdminLanguageProvider></MemoryRouter>);
  return data;
}

describe('Guardian relationships', () => {
  beforeEach(() => { localStorage.removeItem('memopal.admin.language'); vi.clearAllMocks(); });
  afterEach(cleanup);

  it('separates admin review from personal links and searches by learner name', () => {
    setup();
    expect(screen.getByRole('tab', { name: 'Pending verification (1)' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Amy Learner')).toBeInTheDocument();
    expect(screen.queryByText('My Learner')).not.toBeInTheDocument();
    const search = screen.getByRole('searchbox', { name: 'Search by name or account ID' });
    fireEvent.change(search, { target: { value: 'does-not-match' } });
    expect(screen.getByText('No relationships match your search.')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'Amy' } });
    expect(screen.getByText('Amy Learner')).toBeInTheDocument();
  });

  it('shows full identities in details and does not offer unauthorized admin revocation', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText('learner-id')).toBeInTheDocument();
    expect(within(drawer).queryByRole('button', { name: 'Revoke relationship' })).not.toBeInTheDocument();
  });

  it('preserves the family-link form when the request fails and closes only on success', async () => {
    const data = setup();
    data.createGuardianLink.mutateAsync.mockRejectedValueOnce(new Error('Try again'));
    fireEvent.click(screen.getByRole('button', { name: 'Request family link' }));
    const dialog = await screen.findByRole('dialog');
    const field = within(dialog).getByLabelText('Learner account ID');
    fireEvent.change(field, { target: { value: ' student-id ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Request family link' }));
    await waitFor(() => expect(data.createGuardianLink.mutateAsync).toHaveBeenCalledWith({ studentUserId: 'student-id' }));
    expect(field).toHaveValue(' student-id ');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Request family link' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('does not offer verification before learner consent', () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'My family links (1)' }));
    expect(screen.getByText('Awaiting learner consent')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verify relationship' })).not.toBeInTheDocument();
  });

  it('closes details after successful verification removes a request from the queue', async () => {
    const data = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    const details = await screen.findByRole('dialog');
    fireEvent.click(within(details).getByRole('button', { name: 'Verify relationship' }));
    fireEvent.click(await screen.findByRole('button', { name: 'OK' }));
    await waitFor(() => expect(data.verifyGuardianLink.mutateAsync).toHaveBeenCalledWith('review'));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Details' })).not.toBeInTheDocument());
  });
});
