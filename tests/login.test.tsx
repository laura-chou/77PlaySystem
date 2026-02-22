import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '@/pages/login';
import { useRouter } from 'next/navigation';

// Mock useRouter
const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

describe('LoginPage Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應正確渲染登入頁面元素', () => {
    render(<Login />);

    expect(screen.getByText('77Play 會員系統')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('帳號')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密碼')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
  });

  it('當帳號或密碼為空時應顯示 alert', async () => {
    render(<Login />);
    const loginButton = screen.getByRole('button', { name: '登入' });

    // 測試空帳號
    fireEvent.click(loginButton);
    expect(window.alert).toHaveBeenCalledWith('請輸入帳號');

    // 輸入帳號但未輸入密碼
    const accountInput = screen.getByPlaceholderText('帳號');
    await userEvent.type(accountInput, 'testuser');
    fireEvent.click(loginButton);
    expect(window.alert).toHaveBeenCalledWith('請輸入密碼');
  });

  it('登入成功時應導向至 dashboard', async () => {
    render(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('帳號'), 'testuser');
    await user.type(screen.getByPlaceholderText('密碼'), 'password123');

    await user.click(screen.getByRole('button', { name: '登入' }));

    // 檢查是否有顯示登入中狀態
    expect(screen.getByText('登入中...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/pages/dashboard');
    });
  });

  it('登入失敗時應顯示錯誤訊息', async () => {
    render(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('帳號'), 'wronguser');
    await user.type(screen.getByPlaceholderText('密碼'), 'wrongpass');

    await user.click(screen.getByRole('button', { name: '登入' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('帳號或密碼錯誤');
    });

    // 登入失敗後應恢復按鈕狀態
    expect(screen.getByRole('button', { name: '登入' })).not.toBeDisabled();
  });
});
