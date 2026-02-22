import { http, HttpResponse } from 'msw';
import { env } from '../../app/config/env';

export const handlers = [
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
        {
          status: 401,
          headers
        }
      );
    }
  }),
];
