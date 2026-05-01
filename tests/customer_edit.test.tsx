import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerEdit from '@/pages/customer/[id]/page';
import { useRouter, useParams } from 'next/navigation';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';
import { setToken, clearToken } from '@/lib/api';

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

describe('CustomerEdit Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    setToken('mocked_token');
  });

  afterEach(() => {
    clearToken();
  });

  it('loads and displays customer data', async () => {
    render(<CustomerEdit />);
    expect(screen.getByText('載入中...')).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));

    expect(screen.getByLabelText('客戶 LINE：')).toHaveValue('王小明');
    expect(screen.getByLabelText('當前餘額：')).toHaveValue(1500);
  });

  it('edits customer name', async () => {
    const user = userEvent.setup();
    render(<CustomerEdit />);
    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));

    await user.click(screen.getByText('編輯'));

    // Default action should be 'name' (改客戶 LINE)
    const nameInput = screen.getByLabelText('客戶 LINE：');
    await user.clear(nameInput);
    await user.type(nameInput, '王大明');

    await user.click(screen.getByText('儲存'));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('客戶資料已更新！');
    });
  });

  it('performs charge operation and validates star calculation', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${env.apiBaseUrl}customer/1`, () => {
        return HttpResponse.json({
          data: {
            custId: '1',
            custName: '王小明',
            createDate: '2023-01-01',
            extendedTimes: 0,
            history: [
              { spendDate: '2023-01-03', amount: -200, currentBalance: 1300, expiryDate: '2023-04-01' },
              { spendDate: '2023-01-02', amount: 120, currentBalance: 1500, expiryDate: '2023-04-01' },
              { spendDate: '2023-01-01', amount: 1500, currentBalance: 1500, expiryDate: '2023-04-01' }, // Initial
            ]
          }
        });
      })
    );

    render(<CustomerEdit />);
    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));

    // 1. Perform a charge
    await user.click(screen.getByText('編輯'));
    await user.selectOptions(screen.getByLabelText('操作類型：'), 'charge');
    const amountInput = screen.getByLabelText('金額：');
    expect(amountInput).toHaveValue(80);
    await user.clear(amountInput);
    await user.type(amountInput, '160');
    await user.click(screen.getByText('儲存'));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('客戶資料已更新！'));

    // 2. Check history and stars
    await user.click(screen.getByText('歷史紀錄'));

    // Initial 1500 -> +15 stars (cap)
    expect(screen.getByText('+15')).toBeInTheDocument();

    // 120 -> 120/80 = 1.5 -> +2 stars
    expect(screen.getByText('+2')).toBeInTheDocument();

    // -200 -> -200/80 = -2.5 -> -3 stars
    expect(screen.getByText('-3')).toBeInTheDocument();

    // Check remaining stars (currentBalance / 80)
    // 1500 -> 19 stars
    expect(screen.getAllByText('19').length).toBeGreaterThanOrEqual(2);
    // 1300 -> 16 stars
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('handles extend expiry logic', async () => {
    const user = userEvent.setup();
    // Mock customer who reached limit
    server.use(
      http.get(`${env.apiBaseUrl}customer/3`, () => {
        return HttpResponse.json({
          data: {
            custId: '3',
            custName: '三延人',
            createDate: '2023-01-01',
            extendedTimes: 3,
            history: [{ spendDate: '2023-01-01', amount: 1200, currentBalance: 1200, expiryDate: '2000-01-01' }]
          }
        });
      })
    );
    (useParams as jest.Mock).mockReturnValue({ id: '3' });

    const { unmount } = render(<CustomerEdit />);
    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));
    await user.click(screen.getByText('編輯'));

    const extendOption = screen.getByText(/延長到期日 \(已達上限 3 次\)/);
    expect(extendOption).toBeDisabled();
    unmount();

    // Mock customer not yet expired
    server.use(
      http.get(`${env.apiBaseUrl}customer/4`, () => {
        return HttpResponse.json({
          data: {
            custId: '4',
            custName: '未過期人',
            createDate: '2023-01-01',
            extendedTimes: 0,
            history: [{ spendDate: '2023-01-01', amount: 1200, currentBalance: 1200, expiryDate: '2099-12-31' }]
          }
        });
      })
    );
    (useParams as jest.Mock).mockReturnValue({ id: '4' });
    render(<CustomerEdit />);
    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));
    await user.click(screen.getByText('編輯'));
    expect(screen.getByText(/延長到期日 \(尚未到期/)).toBeDisabled();
  });
});
