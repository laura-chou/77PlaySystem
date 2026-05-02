import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Login from '@/pages/login';
import { server } from './mocks/server';
import { useRouter } from 'next/navigation';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';

beforeAll(() => server.listen());
afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    cleanup();
});
afterAll(() => server.close());

describe('Login Page', () => {
    it('renders login form', () => {
        render(<Login />);
        expect(screen.getByPlaceholderText('帳號')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('密碼')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
    });

    it('performs login and redirects on success', async () => {
        const router = useRouter();
        render(<Login />);

        fireEvent.change(screen.getByPlaceholderText('帳號'), { target: { value: 'admin' } });
        fireEvent.change(screen.getByPlaceholderText('密碼'), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: '登入' }));

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('/pages/dashboard');
        });
    });

    it('shows error on failed login', async () => {
        render(<Login />);

        fireEvent.change(screen.getByPlaceholderText('帳號'), { target: { value: 'wrong' } });
        fireEvent.change(screen.getByPlaceholderText('密碼'), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button', { name: '登入' }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('帳號或密碼錯誤');
        });
    });
});
