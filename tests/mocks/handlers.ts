import { http, HttpResponse } from 'msw';
import { env } from '../../app/config/env';

const mockCustomers = [
  {
    custId: '1',
    custName: '王小明',
    createDate: '2023-01-01',
    history: [
      {
        spendDate: '2023-01-01',
        amount: 1500,
        currentBalance: 1500,
        expiryDate: '2023-04-01',
      },
    ],
  },
  {
    custId: '2',
    custName: '李小華',
    createDate: '2023-02-01',
    history: [
      {
        spendDate: '2023-02-01',
        amount: 3000,
        currentBalance: 3000,
        expiryDate: '2023-08-01',
      },
    ],
  },
];

export const handlers = [
  // Login
  http.post(`${env.apiBaseUrl}user/login`, async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const { account, password } = body as any;

    const origin = request.headers.get('origin') || 'http://localhost';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };

    if (account === 'testuser' && password === 'password123') {
      return HttpResponse.json(
        { message: 'Login successful' },
        {
          status: 200,
          headers: {
            ...headers,
            'Set-Cookie': 'token=mocked_token; Path=/; HttpOnly',
          },
        }
      );
    } else {
      return HttpResponse.json(
        { message: '帳號或密碼錯誤' },
        { status: 401, headers }
      );
    }
  }),

  // Logout
  http.post(`${env.apiBaseUrl}user/logout`, ({ request }) => {
    const origin = request.headers.get('origin') || 'http://localhost';
    return HttpResponse.json(
      { message: 'Logout successful' },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }),

  // Get all customers
  http.get(`${env.apiBaseUrl}customer`, ({ request }) => {
    const origin = request.headers.get('origin') || 'http://localhost';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };

    // Simulate 401 if needed (uncomment for specific tests if desired,
    // but usually we want success here)
    // return HttpResponse.json({ message: 'Unauthorized' }, { status: 401, headers });

    return HttpResponse.json(
      { data: mockCustomers.map(c => ({
        custId: c.custId,
        custName: c.custName,
        expiryDate: c.history[0].expiryDate
      })) },
      { status: 200, headers }
    );
  }),

  // Get single customer
  http.get(`${env.apiBaseUrl}customer/:id`, ({ params, request }) => {
    const { id } = params;
    const origin = request.headers.get('origin') || 'http://localhost';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };

    const customer = mockCustomers.find(c => c.custId === id);

    if (customer) {
      return HttpResponse.json({ data: customer }, { status: 200, headers });
    } else {
      return HttpResponse.json({ message: 'Customer not found' }, { status: 404, headers });
    }
  }),

  // Create customer
  http.post(`${env.apiBaseUrl}customer/create`, async ({ request }) => {
    const origin = request.headers.get('origin') || 'http://localhost';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };

    return HttpResponse.json({ message: 'Customer created' }, { status: 201, headers });
  }),

  // Update customer
  http.patch(`${env.apiBaseUrl}customer/update`, async ({ request }) => {
    const origin = request.headers.get('origin') || 'http://localhost';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };

    return HttpResponse.json({ message: 'Customer updated' }, { status: 200, headers });
  }),
];
