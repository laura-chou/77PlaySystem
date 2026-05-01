import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/pages/dashboard/page';
import { useRouter } from 'next/navigation';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';
import { setToken, clearToken } from '@/lib/api';

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

describe('Dashboard Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setToken('mocked_token');
  });

  afterEach(() => {
    clearToken();
  });

  it('renders customer list and handles search', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    expect(screen.getAllByText('載入中...')[0]).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    expect(screen.getByText('王小明')).toBeInTheDocument();
    expect(screen.getByText('李小華')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('搜尋姓名或電話...');
    await user.type(searchInput, '王');

    expect(screen.getByText('王小明')).toBeInTheDocument();
    expect(screen.queryByText('李小華')).not.toBeInTheDocument();
  });

  it('navigates to create and edit pages', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    await user.click(screen.getByText('新增客戶'));
    expect(mockPush).toHaveBeenCalledWith('/pages/customer/new');

    const editButtons = screen.getAllByText('編輯');
    await user.click(editButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/pages/customer/1');
  });

  it('handles logout', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    await user.click(screen.getByText('登出'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('handles customer deletion', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);

    server.use(
      http.delete(`${env.apiBaseUrl}customer/1`, () => {
        return HttpResponse.json({ message: 'Success' }, { status: 200 });
      })
    );

    render(<Dashboard />);
    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    const deleteButtons = screen.getAllByText('刪除');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('客戶已刪除');
    });
  });

  it('highlights expired customers', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}customer`, () => {
        return HttpResponse.json({
          data: [{ custId: '3', custName: '過期人', expiryDate: '2000-01-01' }]
        });
      })
    );

    render(<Dashboard />);
    await waitForElementToBeRemoved(() => screen.queryAllByText('載入中...'));

    const row = screen.getByText('過期人').closest('tr');
    // Using style module check - it should have a class that contains 'expired'
    expect(row?.className).toMatch(/expired/);
  });

  it('handles 401 Unauthorized', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}customer`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('驗證失效，請重新登入');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
