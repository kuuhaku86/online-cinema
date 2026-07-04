import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

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

function renderWithRouter(isAuthenticated: boolean) {
  vi.mocked(useAuth).mockReturnValue({ ...defaultAuthMock, isAuthenticated });
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nested routes when authenticated', () => {
    renderWithRouter(true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to / when not authenticated', () => {
    renderWithRouter(false);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
