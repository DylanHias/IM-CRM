import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../page';

const signIn = vi.fn();
vi.mock('@/lib/auth/authHelpers', () => ({ signIn: () => signIn() }));
vi.mock('@/components/layout/WindowFrame', () => ({ WindowFrame: () => null }));

beforeEach(() => {
  signIn.mockReset();
});

describe('Login page', () => {
  it('shows the sign-in form with app version and connection', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Use your Ingram Micro work account.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Microsoft' })).toBeEnabled();
    expect(screen.getByText(/^(Online|Offline)$/)).toBeInTheDocument();
  });

  it('explains when signing in was cancelled', async () => {
    signIn.mockResolvedValue(null);
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Microsoft' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Login was cancelled or failed. Please try again.');
  });
});
