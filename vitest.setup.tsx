import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';
import { fetch, Headers, Request, Response } from 'undici';
import axios from 'axios';

// Polyfills for Node.js
Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  fetch: { value: fetch, writable: true },
  Headers: { value: Headers, writable: true },
  Request: { value: Request, writable: true },
  Response: { value: Response, writable: true },
});

// Mock window functions
window.alert = vi.fn();
window.confirm = vi.fn(() => true);

// Fix axios for MSW in Node environment
// @ts-ignore
axios.defaults.adapter = 'http';

// Stable mock objects for Next.js
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: '1' }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image to avoid width/height requirements in tests
vi.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} />;
    },
}));

// Suppress known warnings
const originalError = console.error;
console.error = (...args) => {
    if (typeof args[0] === 'string' && (
        args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: React.createFactory')
    )) {
        return;
    }
    originalError(...args);
};
