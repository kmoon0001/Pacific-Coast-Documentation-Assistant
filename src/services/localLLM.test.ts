import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerator = vi.fn(async () => [{ generated_text: '<|assistant|>\nMock generated note' }]);

const mockPipeline = vi.fn(async (_task: string, _model: string, options?: any) => {
  if (options?.progress_callback) {
    options.progress_callback({ status: 'progress', progress: 42 });
    options.progress_callback({ status: 'done' });
  }
  return mockGenerator;
});

vi.mock('@xenova/transformers', () => ({
  pipeline: mockPipeline,
  env: { allowLocalModels: false, useBrowserCache: true },
}));

describe('localLLM service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('initializes the local generator only once', async () => {
    const { initLocalLLM } = await import('./localLLM');
    await initLocalLLM();
    await initLocalLLM();

    expect(mockPipeline).toHaveBeenCalledTimes(1);
  });

  it('reports download progress through the callback', async () => {
    const { initLocalLLM, setProgressCallback } = await import('./localLLM');
    const progressSpy = vi.fn();

    setProgressCallback(progressSpy);
    await initLocalLLM();

    expect(progressSpy).toHaveBeenCalledWith(42);
    expect(progressSpy).toHaveBeenCalledWith(100);
  });

  it('generates a local note using the cached pipeline', async () => {
    const { generateLocalNote } = await import('./localLLM');

    const result = await generateLocalNote('Clinical prompt');

    expect(result).toBe('Mock generated note');
    expect(mockGenerator).toHaveBeenCalledWith(
      expect.stringContaining('Clinical prompt'),
      expect.objectContaining({ 
        max_new_tokens: 800,
        temperature: 0.7,
        do_sample: true,
        top_k: 50,
        top_p: 0.9
      })
    );
  });
});
