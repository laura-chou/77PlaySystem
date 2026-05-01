import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '@/pages/login';
import { useRouter } from 'next/navigation';

// Mock useRouter
const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

describe('Login Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login elements correctly', () => {
    render(<Login />);
    expect(screen.getByText('77Play 會員系統')).toBeInTheDocument();
    expect(screen.getByLabelText('帳號')).toBeInTheDocument();
    expect(screen.getByLabelText('密碼')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
  });

  it('shows alerts for empty credentials', async () => {
    const user = userEvent.setup();
    render(<Login />);
    const loginButton = screen.getByRole('button', { name: '登入' });

    // Test empty account
    await user.click(loginButton);
    expect(window.alert).toHaveBeenCalledWith('請輸入帳號');

    // Test empty password
    await user.type(screen.getByLabelText('帳號'), 'testuser');
    await user.click(loginButton);
    expect(window.alert).toHaveBeenCalledWith('請輸入密碼');
  });

  it('redirects to dashboard on successful login', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('帳號'), 'testuser');
    await user.type(screen.getByLabelText('密碼'), 'password123');
    await user.click(screen.getByRole('button', { name: '登入' }));

    expect(screen.getByText('登入中...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/pages/dashboard');
    });
  });

  it('shows alert on login failure', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('帳號'), 'wronguser');
    await user.type(screen.getByLabelText('密碼'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: '登入' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('帳號或密碼錯誤');
    });
    expect(screen.getByRole('button', { name: '登入' })).not.toBeDisabled();
  });
});
