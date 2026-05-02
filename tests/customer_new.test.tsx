import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import CreateCustomer from '@/pages/customer/new/page';
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

describe('Create Customer Page', () => {
    it('renders create customer form', () => {
        render(<CreateCustomer />);
        expect(screen.getByLabelText('客戶 LINE：')).toBeInTheDocument();
        expect(screen.getByLabelText('金額：')).toBeInTheDocument();
        expect(screen.getByLabelText('加入日期：')).toBeInTheDocument();
    });

    it('shows alert if LINE ID is empty', () => {
        const alertMock = vi.spyOn(window, 'alert');
        render(<CreateCustomer />);
        fireEvent.click(screen.getByText('儲存'));
        expect(alertMock).toHaveBeenCalledWith('請輸入客戶 LINE');
    });

    it('creates customer and redirects on success', async () => {
        const router = useRouter();
        const alertMock = vi.spyOn(window, 'alert');

        server.use(
            http.post(`${env.apiBaseUrl}customer/create`, () => {
                return HttpResponse.json({ status: 200 });
            })
        );

        render(<CreateCustomer />);

        fireEvent.change(screen.getByLabelText('客戶 LINE：'), {
            target: { value: 'NewCustomer' }
        });
        fireEvent.change(screen.getByLabelText('金額：'), {
            target: { value: '1500' }
        });

        fireEvent.click(screen.getByText('儲存'));

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('客戶新增成功');
            expect(router.push).toHaveBeenCalledWith('/pages/dashboard');
        });
    });

    it('handles cancel button', () => {
        const router = useRouter();
        render(<CreateCustomer />);
        fireEvent.click(screen.getByText('返回清單'));
        expect(router.push).toHaveBeenCalledWith('/pages/dashboard');
    });
});
