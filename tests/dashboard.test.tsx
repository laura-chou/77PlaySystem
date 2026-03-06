import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/pages/dashboard/page';
import { useRouter } from 'next/navigation';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';
import { setToken, clearToken } from '@/lib/api';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('Dashboard Page Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setToken('mocked_token');
  });

  afterEach(() => {
    clearToken();
  });

  it('應顯示載入中狀態', () => {
    render(<Dashboard />);
    expect(screen.getAllByText('載入中...')[0]).toBeInTheDocument();
  });

  it('應正確渲染客戶列表', async () => {
    render(<Dashboard />);

    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    expect(screen.getByText('王小明')).toBeInTheDocument();
    expect(screen.getByText('李小華')).toBeInTheDocument();
  });

  it('搜尋功能應能過濾客戶', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    const searchInput = screen.getByPlaceholderText('搜尋姓名或電話...');
    await user.type(searchInput, '王');

    expect(screen.getByText('王小明')).toBeInTheDocument();
    expect(screen.queryByText('李小華')).not.toBeInTheDocument();
  });

  it('點擊新增客戶應導向至新增頁面', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    await user.click(screen.getByText('新增客戶'));
    expect(mockRouter.push).toHaveBeenCalledWith('/pages/customer/new');
  });

  it('點擊編輯應導向至編輯頁面', async () => {
    render(<Dashboard />);

    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    const editButtons = screen.getAllByRole('button', { name: '編輯' });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/pages/customer/1');
    });
  });

  it('點擊登出應呼叫登出 API 並導向首頁', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    await user.click(screen.getByText('登出'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('當 API 回傳 401 時應顯示 alert 並導向首頁', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}customer`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('驗證失效，請重新登入');
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('當 API 發生錯誤時應顯示錯誤訊息', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}customer`, () => {
        return HttpResponse.error();
      })
    );

    render(<Dashboard />);

    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    expect(screen.getByText('載入失敗')).toBeInTheDocument();
    expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
  });

  it('過期客戶應顯示紅色背景 (expired class)', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}customer`, () => {
        return HttpResponse.json(
          { data: [{ custId: '3', custName: '過期人', expiryDate: '2000-01-01' }] },
          { status: 200 }
        );
      })
    );

    render(<Dashboard />);

    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    const row = screen.getByText('過期人').closest('tr');
    expect(row).toHaveClass('expired');
  });
});
