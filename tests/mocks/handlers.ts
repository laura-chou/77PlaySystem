import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';

const baseUrl = env.apiBaseUrl;

export const handlers = [
    // Login
    http.post(`${baseUrl}user/login`, async({ request }) => {
        const body: any = await request.json();
        if (body.account === 'admin' && body.password === 'password') {
            return HttpResponse.json({ data: { token: 'mock-token' } });
        }
        return new HttpResponse(null, { status: 401 });
    }),
    http.post(`${baseUrl}user/logout`, () => HttpResponse.json({ status: 200 })),
    http.get(`${baseUrl}customer`, () => HttpResponse.json({
        data: [
            { custId: '1', custName: 'Test Customer 1', expiryDate: '2025-12-31' },
            { custId: '2', custName: 'Expired Customer', expiryDate: '2020-01-01' }
        ]
    })),
    http.get(`${baseUrl}customer/:id`, ({ params }) => HttpResponse.json({
        data: {
            custId: params.id,
            custName: params.id === '1' ? 'Test Customer' : `Customer ${params.id}`,
            expiryDate: '2025-12-31',
            createDate: '2025-01-01',
            history: [
                { spendDate: '2025-01-01', amount: 1200, currentBalance: 1200, expiryDate: '2025-12-31' }
            ]
        }
    })),
    http.post(`${baseUrl}customer/create`, () => HttpResponse.json({ status: 200 })),
    http.patch(`${baseUrl}customer/update`, () => HttpResponse.json({ status: 200 })),
    http.delete(`${baseUrl}customer/:id`, () => HttpResponse.json({ status: 200 })),
];
