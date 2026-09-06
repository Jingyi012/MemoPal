import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { adminDashboardApi } from '../../../api/adminDashboardApi';
import DashboardPage from './DashboardPage';

vi.mock('../../../api/adminDashboardApi', () => ({
  adminDashboardApi: { get: vi.fn() },
}));

describe('DashboardPage', () => {
  it('shows operational attention counts returned by the server', async () => {
    vi.mocked(adminDashboardApi.get).mockResolvedValue({
      totalUsers: 120,
      newUsersLast7Days: 8,
      activePremiumUsers: 21,
      reportedCommunityMemorySets: 3,
      draftPredefinedLessons: 5,
      draftPalaceScenes: 2,
      pastDueSubscriptions: 4,
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Reported sets awaiting action')).toBeInTheDocument();
    expect(screen.getByText('Operations overview')).toBeInTheDocument();
    expect(screen.getByText('Past-due subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Draft predefined lessons')).toBeInTheDocument();
    expect(screen.getByText('Draft Palace scenes')).toBeInTheDocument();
  });
});
