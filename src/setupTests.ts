import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const createStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size;
    },
  } as Storage;
};

const clipboardMock = {
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue(''),
};

if (typeof navigator !== 'undefined') {
  Object.assign(navigator, { clipboard: clipboardMock });
} else {
  (globalThis as any).navigator = { clipboard: clipboardMock } as unknown as Navigator;
}

(globalThis as any).alert = vi.fn();
(globalThis as any).prompt = vi.fn(() => 'Automation Template');

const buildMockBedrockResponse = (request?: any) => {
  const wantsJson = request?.config?.responseMimeType === 'application/json';

  if (wantsJson) {
    return {
      text: JSON.stringify({
        complianceScore: 92,
        findings: ['Mock compliance insight'],
        checklist: {
          'Skilled Intervention Demonstrated': true,
        },
      }),
      candidates: [
        {
          groundingMetadata: {},
        },
      ],
    };
  }

  return {
    text: 'Mock generated note content',
    candidates: [
      {
        groundingMetadata: {},
      },
    ],
  };
};

// Create a global mock store for generateContent
let mockGenerateContentFn = vi.fn((request?: any) => Promise.resolve(buildMockBedrockResponse(request)));

// Mock AWS Bedrock fetch
vi.stubGlobal('fetch', vi.fn((url: string, options: any) => {
  if (url.includes('bedrock-runtime')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'Mock AWS Bedrock response' }],
        completion: 'Mock AWS Bedrock response'
      })
    });
  }
  return Promise.reject(new Error('Unexpected fetch call'));
}));

// Export function to update mock in tests
export function setMockGenerateContent(fn: any) {
  mockGenerateContentFn = fn;
}

// Mock Service Worker setup
const mockBedrockHandler = http.post('*/bedrock-runtime*', () => {
  return HttpResponse.json({
    text: 'Mock generated note content',
  });
});

export const server = setupServer(mockBedrockHandler);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
  (globalThis as any).localStorage = createStorageMock();
  (globalThis as any).sessionStorage = createStorageMock();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
  mockGenerateContentFn = vi.fn((request?: any) => Promise.resolve(buildMockBedrockResponse(request)));
  (globalThis as any).localStorage?.clear();
  (globalThis as any).sessionStorage?.clear();
});

afterAll(() => {
  server.close();
});
