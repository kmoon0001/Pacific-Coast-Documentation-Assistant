import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentManager } from './DocumentManager';

const mockDocument = {
  id: 'doc-1',
  title: 'HIPAA Security Policy',
  description: 'Updated security guidance',
  category: 'Policy',
  fileType: 'pdf',
  fileSize: 2048,
  uploadedAt: new Date('2024-01-15').toISOString(),
  tags: ['HIPAA', 'Security'],
};

const originalFetch = global.fetch;
let fetchMock: ReturnType<typeof vi.fn>;

describe('DocumentManager', () => {
  vi.setConfig({ testTimeout: 15000 });
  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({ documents: [mockDocument], total: 1 }),
      } as Response;
    });

    global.fetch = fetchMock as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const renderManager = () =>
    render(
      <DocumentManager onDocumentSelect={vi.fn()} onDocumentDelete={vi.fn()} />
    );

  it('loads documents on mount and displays their metadata', async () => {
    renderManager();

    expect(fetchMock).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('heading', { name: /hipaa security policy/i })).toBeInTheDocument());
    expect(screen.getByText(/Policy/, { selector: '.category-badge' as any })).toBeInTheDocument();
    expect(screen.getByText(/1\s+documents/i)).toBeInTheDocument();
  });

  it('requests a filtered list when the user types in the search box', async () => {
    renderManager();

    const searchBox = screen.getByPlaceholderText(/search documents/i);
    await waitFor(() => expect(searchBox).not.toBeDisabled());
    await userEvent.type(searchBox, 'security');

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map(call => call[0].toString());
      expect(urls.some(url => url.includes('q=security'))).toBe(true);
    });
  });

  it('shows the delete confirmation and removes the card when confirmed', async () => {
    const onDocumentDelete = vi.fn();
    render(<DocumentManager onDocumentSelect={vi.fn()} onDocumentDelete={onDocumentDelete} />);

    await waitFor(() => screen.getByText(/HIPAA Security Policy/));

    const deleteToggle = screen.getByTitle(/delete/i);
    await userEvent.click(deleteToggle);

    const confirmButton = await screen.findByRole('button', { name: /delete/i });
    await userEvent.click(confirmButton);

    await waitFor(() => expect(onDocumentDelete).toHaveBeenCalledWith('doc-1'));
    expect(screen.queryByText(/HIPAA Security Policy/)).not.toBeInTheDocument();
  });

  it('calls the selection callback from the preview action', async () => {
    const onSelect = vi.fn();
    render(<DocumentManager onDocumentSelect={onSelect} onDocumentDelete={vi.fn()} />);

    const previewButton = await screen.findByTitle(/preview/i);
    await userEvent.click(previewButton);

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc-1' }));
  });
});
