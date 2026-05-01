import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCustomer from '@/pages/customer/new/page';
import { useRouter } from 'next/navigation';
import { setToken, clearToken } from '@/lib/api';

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

describe('CreateCustomer Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setToken('mocked_token');
  });

  afterEach(() => {
    clearToken();
  });

  it('renders correctly and handles successful creation', async () => {
    const user = userEvent.setup();
    render(<CreateCustomer />);

    expect(screen.getByText('新增客戶')).toBeInTheDocument();

    await user.type(screen.getByLabelText('客戶 LINE：'), 'NewTestUser');
    await user.clear(screen.getByLabelText('金額：'));
    await user.type(screen.getByLabelText('金額：'), '2400');

    await user.click(screen.getByText('儲存'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('客戶新增成功');
      expect(mockPush).toHaveBeenCalledWith('/pages/dashboard');
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<CreateCustomer />);

    await user.click(screen.getByText('儲存'));

    expect(window.alert).toHaveBeenCalledWith('請輸入客戶 LINE');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('cancels and returns to dashboard', async () => {
    const user = userEvent.setup();
    render(<CreateCustomer />);

    await user.click(screen.getByText('返回清單'));
    expect(mockPush).toHaveBeenCalledWith('/pages/dashboard');
  });
});
