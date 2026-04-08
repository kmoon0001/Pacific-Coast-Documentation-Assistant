import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

/**
 * Mock Service Worker setup for API mocking in tests
 */

export const mockGeminiHandler = http.post(
  '*/models/gemini-3-flash-preview:generateContent',
  () => {
    return HttpResponse.json({
      text: 'Mock generated note content',
    });
  }
);

export const mockGeminiErrorHandler = http.post(
  '*/models/gemini-3-flash-preview:generateContent',
  () => {
    return HttpResponse.json(
      {
        error: {
          code: 429,
          message: 'Quota exceeded',
        },
      },
      { status: 429 }
    );
  }
);

export const server = setupServer(mockGeminiHandler);

// Enable API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Disable API mocking after the tests are done
afterAll(() => server.close());
