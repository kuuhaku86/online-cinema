import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));

import { useAuth } from '../hooks/useAuth';

const defaultAuthMock = {
  user: null,
  isAuthenticated: false,
  loading: 'idle' as const,
  error: null as string | null | undefined,
  signIn: vi.fn(),
  signOut: vi.fn(),
  registrationStatus: 'idle' as const,
  signUp: vi.fn(),
};

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(defaultAuthMock);
  });

  it('renders email and password fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('calls signIn on form submit', async () => {
    const signIn = vi.fn();
    vi.mocked(useAuth).mockReturnValue({ ...defaultAuthMock, signIn });
    render(<LoginForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email:'), 'test@test.com');
    await user.type(screen.getByLabelText('Password:'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(signIn).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
  });

  it('displays error message when error is set', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthMock,
      error: 'Invalid credentials',
    });
    render(<LoginForm />);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('disables button and shows loading text when loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthMock,
      loading: 'pending',
    });
    render(<LoginForm />);

    const button = screen.getByRole('button', { name: /logging in/i });
    expect(button).toBeDisabled();
  });

  it('shows already logged in message when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthMock,
      isAuthenticated: true,
    });
    render(<LoginForm />);

    expect(screen.getByText(/already logged in/i)).toBeInTheDocument();
  });
});
