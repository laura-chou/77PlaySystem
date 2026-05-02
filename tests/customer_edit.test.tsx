import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import CustomerEdit from '@/pages/customer/[id]/page';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';
import { useRouter, useParams } from 'next/navigation';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';

beforeAll(() => server.listen());
afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    cleanup();
});
afterAll(() => server.close());

describe('Customer Edit Page', () => {
    it('renders customer details correctly', async () => {
        render(<CustomerEdit />);

        expect(await screen.findByDisplayValue('Test Customer')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1200')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2025-01-01')).toBeInTheDocument();
    });

    it('performs customer update with different actions', async () => {
        const alertMock = vi.spyOn(window, 'alert');
        let lastRequest: any = null;

        server.use(
            http.patch(`${env.apiBaseUrl}customer/update`, async ({ request }) => {
                lastRequest = await request.json();
                return HttpResponse.json({ status: 200 });
            })
        );

        render(<CustomerEdit />);

        const editBtn = await screen.findByRole('button', { name: /編輯/i });
        fireEvent.click(editBtn);

        const select = await screen.findByRole('combobox');
        fireEvent.change(select, { target: { value: 'name' } });

        const nameInput = await screen.findByDisplayValue('Test Customer');
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

        fireEvent.click(screen.getByRole('button', { name: /儲存/i }));

        await waitFor(() => {
            expect(lastRequest).toMatchObject({
                action: 'name',
                custName: 'Updated Name'
            });
            expect(alertMock).toHaveBeenCalledWith('客戶資料已更新！');
        });
    });

    it('displays history records and handles date filtering', async () => {
        render(<CustomerEdit />);

        await screen.findByDisplayValue('Test Customer');

        const historyTab = screen.getByText('歷史紀錄');
        fireEvent.click(historyTab);

        expect(await screen.findByText('日期')).toBeInTheDocument();

        // Verify star count calculation logic (1200 -> 15 stars)
        expect(screen.getByText('+15')).toBeInTheDocument();
        expect(screen.getByText('1,200')).toBeInTheDocument();

        // Filter by date
        const startDate = screen.getByLabelText('開始日期');
        fireEvent.change(startDate, { target: { value: '2026-01-01' } });

        expect(screen.getByText('無符合條件的紀錄')).toBeInTheDocument();
    });

    it('handles extension limit logic', async () => {
        // Mock customer with 3 extensions
        server.use(
            http.get(`${env.apiBaseUrl}customer/1`, () => {
                return HttpResponse.json({
                    data: {
                        custName: 'Max Extended',
                        createDate: '2025-01-01',
                        extendedTimes: 3,
                        history: [
                            { spendDate: '2025-01-01', amount: 1200, currentBalance: 1200, expiryDate: '2020-01-01' }
                        ]
                    }
                });
            })
        );

        render(<CustomerEdit />);

        const editBtn = await screen.findByRole('button', { name: /編輯/i });
        fireEvent.click(editBtn);

        const select = await screen.findByRole('combobox');
        const extendOption = within(select).getByText(/延長到期日/);
        expect(extendOption).toBeDisabled();
        expect(extendOption).toHaveTextContent('(已達上限 3 次)');
    });
});
