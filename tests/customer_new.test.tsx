import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCustomer from '@/pages/customer/new/page';
import { useRouter } from 'next/navigation';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';
import { setToken, clearToken } from '@/lib/api';

const mockRouter = {
  push: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('CreateCustomer Page Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setToken('mocked_token');
  });

  afterEach(() => {
    clearToken();
  });

  it('應正確渲染新增客戶表單', () => {
    render(<CreateCustomer />);

    expect(screen.getByText('新增客戶')).toBeInTheDocument();
    expect(screen.getByLabelText(/客戶 LINE/)).toBeInTheDocument();
    expect(screen.getByLabelText(/金額/)).toBeInTheDocument();
    expect(screen.getByLabelText(/加入日期/)).toBeInTheDocument();
  });

  it('成功新增客戶後應顯示 alert 並導回 dashboard', async () => {
    const user = userEvent.setup();
    render(<CreateCustomer />);

    await user.type(screen.getByLabelText(/客戶 LINE/), 'NewCustomer');
    await user.clear(screen.getByLabelText(/金額/));
    await user.type(screen.getByLabelText(/金額/), '2000');

    await user.click(screen.getByText('儲存'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('客戶新增成功');
      expect(mockRouter.push).toHaveBeenCalledWith('/pages/dashboard');
    });
  });

  it('未輸入客戶 LINE 時應顯示 alert', async () => {
    const user = userEvent.setup();
    render(<CreateCustomer />);

    await user.click(screen.getByText('儲存'));

    expect(window.alert).toHaveBeenCalledWith('請輸入客戶 LINE');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('點擊返回清單應導回 dashboard', async () => {
    const user = userEvent.setup();
    render(<CreateCustomer />);

    await user.click(screen.getByText('返回清單'));
    expect(mockRouter.push).toHaveBeenCalledWith('/pages/dashboard');
  });
});
