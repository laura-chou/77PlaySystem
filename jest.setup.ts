import '@testing-library/jest-dom';
import { server } from './tests/mocks/server';
import axios from 'axios';

// Force axios to use fetch adapter which works better with MSW 2 in JSDOM
axios.defaults.adapter = 'fetch';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.alert
window.alert = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
