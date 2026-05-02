import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import Dashboard from '@/pages/dashboard/page';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';
import { useRouter } from 'next/navigation';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';

beforeAll(() => server.listen());
afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    cleanup();
});
afterAll(() => server.close());

describe('Dashboard Page', () => {
    it('renders and fetches users with correct info', async () => {
        render(<Dashboard />);

        // Initial loading state
        expect(screen.getAllByText('載入中...')[0]).toBeInTheDocument();

        // Verify data is displayed correctly
        expect(await screen.findByText('Test Customer 1')).toBeInTheDocument();
        expect(screen.getByText('2025-12-31')).toBeInTheDocument();

        // Verify expired customer
        const expiredCust = screen.getByText('Expired Customer');
        expect(expiredCust).toBeInTheDocument();
        // Check if it has the expired class
        const tr = expiredCust.closest('tr');
        expect(tr?.className).toContain('expired');
    });

    it('filters users by search term', async () => {
        render(<Dashboard />);

        expect(await screen.findByText('Test Customer 1')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('搜尋姓名或電話...'), {
            target: { value: 'Expired' }
        });

        await waitFor(() => {
            expect(screen.queryByText('Test Customer 1')).not.toBeInTheDocument();
            expect(screen.getByText('Expired Customer')).toBeInTheDocument();
        });
    });

    it('handles delete customer confirmation and success', async () => {
        const alertMock = vi.spyOn(window, 'alert');
        const confirmMock = vi.spyOn(window, 'confirm');

        render(<Dashboard />);

        const customerRow = await screen.findByText('Test Customer 1');
        const row = customerRow.closest('tr');
        const deleteButtons = screen.getAllByText('刪除', { selector: 'button' });
        const targetBtn = deleteButtons.find(btn => row?.contains(btn));

        if (!targetBtn) throw new Error('Delete button not found');
        fireEvent.click(targetBtn);

        expect(confirmMock).toHaveBeenCalledWith('確定要刪除客戶「Test Customer 1」嗎？');

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('客戶已刪除');
        });
    });

    it('navigates to create customer page', async () => {
        const router = useRouter();
        render(<Dashboard />);

        const addBtn = await screen.findByText(/新增客戶/i);
        fireEvent.click(addBtn);

        expect(router.push).toHaveBeenCalledWith('/pages/customer/new');
    });

    it('navigates to edit customer page', async () => {
        const router = useRouter();
        render(<Dashboard />);

        const editBtn = await screen.findAllByText('編輯');
        fireEvent.click(editBtn[0]);

        expect(router.push).toHaveBeenCalledWith('/pages/customer/1');
    });
});
