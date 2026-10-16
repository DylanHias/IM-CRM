import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPage from '../page';
import { useAuthStore } from '@/store/authStore';

// Each tab body has its own data loading; only the page shell is under test.
vi.mock('@/components/admin/AnalyticsReports', () => ({ AnalyticsReports: () => <div>Analytics body</div> }));
vi.mock('@/components/admin/UserManagement', () => ({ UserManagement: () => <div>Users body</div> }));
vi.mock('@/components/admin/DataManagement', () => ({ DataManagement: () => <div>Data body</div> }));
vi.mock('@/components/admin/DatabaseExplorer', () => ({ DatabaseExplorer: () => <div>Database body</div> }));
vi.mock('@/components/admin/PowerBiSchemaViewer', () => ({ PowerBiSchemaViewer: () => <div>PowerBI body</div> }));
vi.mock('@/components/admin/PowerBiDiscovery', () => ({ PowerBiDiscovery: () => <div>Discovery body</div> }));
vi.mock('@/components/admin/RevenueAdmin', () => ({ RevenueAdmin: () => <div>Revenue body</div> }));

beforeEach(() => {
  useAuthStore.setState({ isAdmin: true });
});

describe('Admin page', () => {
  it('opens on Analytics with the tabs in the toolbar', () => {
    render(<AdminPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analytics' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Analytics body')).toBeInTheDocument();
  });

  it('switches tabs', async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Database' }));
    expect(await screen.findByText('Database body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analytics' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('blocks people without admin rights', () => {
    useAuthStore.setState({ isAdmin: false });
    render(<AdminPage />);
    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Analytics' })).not.toBeInTheDocument();
  });
});
