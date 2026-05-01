import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerEdit from '@/pages/customer/[id]/page';
import { useRouter, useParams } from 'next/navigation';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';
import { setToken, clearToken } from '@/lib/api';

const mockRouter = {
  push: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: jest.fn(),
}));

describe('CustomerEdit Page Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    setToken('mocked_token');
  });

  afterEach(() => {
    clearToken();
  });

  it('應正確渲染客戶編輯頁面並載入資料', async () => {
    render(<CustomerEdit />);

    expect(screen.getByText('載入中...')).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));

    expect(screen.getByDisplayValue('王小明')).toBeInTheDocument();
    // 餘額輸入框的值是 1500
    expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
  });

  it('應正確顯示並禁用達到上限或尚未到期的延展選項', async () => {
    // Mock a customer with 3 extended times
    server.use(
      http.get(`${env.apiBaseUrl}customer/3`, () => {
        return HttpResponse.json({
          data: {
            custId: '3',
            custName: '三延人',
            createDate: '2023-01-01',
            extendedTimes: 3,
            history: [{ spendDate: '2023-01-01', amount: 1500, currentBalance: 1500, expiryDate: '2023-04-01' }]
          }
        });
      })
    );

    (useParams as jest.Mock).mockReturnValue({ id: '3' });
    const { unmount } = render(<CustomerEdit />);
    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));
    await userEvent.click(screen.getByText('編輯'));
    const extendOptionMax = screen.getByText(/延長到期日 \(已達上限 3 次\)/);
    expect(extendOptionMax).toBeDisabled();
    unmount();

    // Mock a customer who is NOT expired
    const farExpiryDate = '2099-12-31';
    server.use(
      http.get(`${env.apiBaseUrl}customer/4`, () => {
        return HttpResponse.json({
          data: {
            custId: '4',
            custName: '未到期人',
            createDate: '2023-01-01',
            extendedTimes: 1,
            history: [{ spendDate: '2023-01-01', amount: 1500, currentBalance: 1500, expiryDate: farExpiryDate }]
          }
        });
      })
    );
    (useParams as jest.Mock).mockReturnValue({ id: '4' });
    render(<CustomerEdit />);
    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));
    await userEvent.click(screen.getByText('編輯'));
    const extendOptionNotExpired = screen.getByText(/尚未到期，2099\/12\/31 後可選，目前 1 次/);
    expect(extendOptionNotExpired).toBeDisabled();
  });

  it('切換分頁應顯示歷史紀錄', async () => {
    const user = userEvent.setup();
    render(<CustomerEdit />);

    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));

    await user.click(screen.getByText('歷史紀錄'));

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    // 1,500 現在僅在餘額欄位出現一次
    expect(screen.getAllByText('1,500').length).toBeGreaterThanOrEqual(1);
    // 檢查星星數量 (1500 / 80 = 18.75 -> 19)
    expect(screen.getAllByText('19').length).toBeGreaterThanOrEqual(1);
  });

  it('檢查星星顯示格式', async () => {
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
              { spendDate: '2023-01-01', amount: -200, currentBalance: 1300, expiryDate: '2023-04-01', serviceName: 'Charge' },
              { spendDate: '2023-01-02', amount: 1500, currentBalance: 1500, expiryDate: '2023-07-01', serviceName: 'Initial' },
              { spendDate: '2023-01-03', amount: 80, currentBalance: 1580, expiryDate: '2023-07-01', serviceName: 'Refill' },
              { spendDate: '2023-01-04', amount: 120, currentBalance: 1700, expiryDate: '2023-07-01', serviceName: 'Refill' },
              { spendDate: '2023-01-05', amount: 40, currentBalance: 1740, expiryDate: '2023-07-01', serviceName: 'Refill' },
              { spendDate: '2023-01-06', amount: -120, currentBalance: 1620, expiryDate: '2023-07-01', serviceName: 'Charge' },
              { spendDate: '2023-01-07', amount: -40, currentBalance: 1580, expiryDate: '2023-07-01', serviceName: 'Charge' },
              { spendDate: '2023-01-08', amount: 1600, currentBalance: 3180, expiryDate: '2023-10-01', serviceName: 'Refill' }
            ]
          }
        });
      })
    );

    render(<CustomerEdit />);
    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));
    await user.click(screen.getByText('歷史紀錄'));

    // 初始 1500 (amount === currentBalance) -> +15 星
    expect(screen.getByText('+15')).toBeInTheDocument();

    // 80 -> +1 星
    // 40 -> 40/80 = 0.5 -> +1 星
    expect(screen.getAllByText('+1').length).toBe(2);

    // 120 -> 120/80 = 1.5 -> +2 星
    expect(screen.getByText('+2')).toBeInTheDocument();

    // -200 -> -200/80 = -2.5 -> -3 星
    expect(screen.getByText('-3')).toBeInTheDocument();

    // -120 -> -120/80 = -1.5 -> -2 星
    expect(screen.getByText('-2')).toBeInTheDocument();

    // -40 -> -40/80 = -0.5 -> -1 星
    expect(screen.getByText('-1')).toBeInTheDocument();

    // 1600 -> 1600/80 = 20 -> +20 星 (只有初始有15上限)
    expect(screen.getByText('+20')).toBeInTheDocument();
  });

  it('進入編輯模式並修改姓名', async () => {
    const user = userEvent.setup();
    render(<CustomerEdit />);

    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));

    // 點擊編輯按鈕
    await user.click(screen.getByText('編輯'));

    // 預設操作應為 "改客戶 LINE" (ActionEnum.NAME = 'name')
    const nameInput = screen.getByDisplayValue('王小明');
    await user.clear(nameInput);
    await user.type(nameInput, '王大明');

    await user.click(screen.getByText('儲存'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('客戶資料已更新！');
    });
  });

  it('未輸入客戶 LINE 時應顯示 alert', async () => {
    const user = userEvent.setup();
    render(<CustomerEdit />);

    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));

    await user.click(screen.getByText('編輯'));

    const nameInput = screen.getByDisplayValue('王小明');
    await user.clear(nameInput);

    await user.click(screen.getByText('儲存'));

    expect(window.alert).toHaveBeenCalledWith('請輸入客戶 LINE');
  });

  it('進行消費操作', async () => {
    const user = userEvent.setup();
    render(<CustomerEdit />);

    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));

    await user.click(screen.getByText('編輯'));

    // 切換操作類型為消費
    const actionSelect = screen.getByLabelText('操作類型：');
    await user.selectOptions(actionSelect, 'charge');

    // 輸入金額
    const amountInput = screen.getByLabelText('金額：');
    await user.clear(amountInput);
    await user.type(amountInput, '160');

    await user.click(screen.getByText('儲存'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('客戶資料已更新！');
    });
  });

  it('當客戶不存在時應顯示錯誤訊息', async () => {
    (useParams as jest.Mock).mockReturnValue({ id: '999' });
    render(<CustomerEdit />);

    await waitFor(() => {
      expect(screen.getByText('找不到客戶資料')).toBeInTheDocument();
    });
  });

  it('當 API 回傳 401 時應顯示 alert 並導向首頁', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}customer/1`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    render(<CustomerEdit />);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('驗證失效，請重新登入');
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('歷史紀錄日期過濾功能', async () => {
    const user = userEvent.setup();
    render(<CustomerEdit />);

    await waitForElementToBeRemoved(() => screen.queryByText('載入中...'));

    await user.click(screen.getByText('歷史紀錄'));

    expect(screen.getByText('2023-01-01')).toBeInTheDocument();

    const startDateInput = screen.getByLabelText('開始日期');
    await user.type(startDateInput, '2023-01-02');

    expect(screen.queryByText('2023-01-01')).not.toBeInTheDocument();
    expect(screen.getByText('無符合條件的紀錄')).toBeInTheDocument();
  });
});
