import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUpload } from './DocumentUpload';

const originalFileReader = global.FileReader;
const originalFetch = global.fetch;

class MockFileReader {
  public result: string | ArrayBuffer | null = null;
  public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

  readAsDataURL(file: File) {
    this.result = 'data:' + file.type + ';base64,ZmFrZUJhc2U2NA==';
    this.onload?.call(this as unknown as FileReader, {
      target: { result: this.result },
    } as ProgressEvent<FileReader>);
  }
}

describe('DocumentUpload', () => {
  beforeAll(() => {
    global.FileReader = MockFileReader as any;
  });

  afterAll(() => {
    global.FileReader = originalFileReader;
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unsupported file types before hitting the network', () => {
    const onError = vi.fn();
    const { container } = render(
      <DocumentUpload onUploadComplete={vi.fn()} onError={onError} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['data'], 'malware.exe', { type: 'application/octet-stream' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toMatch(/invalid file type/i);
  });

  it('uploads a valid document once required metadata is provided', async () => {
    const onUploadComplete = vi.fn();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ document: { id: 'doc-25', title: 'Security Policy' } }),
    })) as unknown as typeof fetch;
    global.fetch = fetchMock;

    const { container } = render(
      <DocumentUpload onUploadComplete={onUploadComplete} onError={vi.fn()} />
    );

    await userEvent.type(screen.getByLabelText(/title/i), 'Security Policy');
    const validFile = new File(['policy'], 'policy.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(onUploadComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'doc-25' })
    );
    expect((screen.getByLabelText(/title/i) as HTMLInputElement).value).toBe('');
  });
});
