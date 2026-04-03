import React, { useState, useEffect, useCallback } from 'react';
import { Document, DocumentCategory } from '../../types';
import { logger } from '../../lib/logger';

interface DocumentManagerProps {
  onDocumentSelect: (document: Document) => void;
  onDocumentDelete: (documentId: string) => void;
}

export function DocumentManager({
  onDocumentSelect,
  onDocumentDelete,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | ''>('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'usage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const endpoint = searchQuery
        ? `/api/knowledge-base/documents/search?${params}`
        : `/api/knowledge-base/documents?${params}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to load documents');
      }

      const result = await response.json();
      setDocuments(result.documents);
      setTotal(result.total);
    } catch (error) {
      logger.error({
        message: 'Failed to load documents',
        error,
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/knowledge-base/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(documents.filter(doc => doc.id !== documentId));
      setDeleteConfirm(null);
      onDocumentDelete(documentId);

      logger.info({
        message: 'Document deleted',
        documentId,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete document',
        error,
      });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="document-manager">
      <div className="manager-header">
        <h2>Document Library</h2>
        <div className="manager-stats">
          <span>{total} documents</span>
        </div>
      </div>

      <div className="manager-controls">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as DocumentCategory | '');
              setPage(1);
            }}
            disabled={isLoading}
          >
            <option value="">All Categories</option>
            <option value="Policy">Policy</option>
            <option value="Procedure">Procedure</option>
            <option value="Guidance">Guidance</option>
            <option value="Regulation">Regulation</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as 'name' | 'date' | 'usage');
              setPage(1);
            }}
            disabled={isLoading}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="usage">Sort by Usage</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            disabled={isLoading}
            className="sort-order-btn"
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <p>No documents found</p>
          <p className="empty-hint">Upload your first document to get started</p>
        </div>
      ) : (
        <>
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="card-header">
                  <div className="card-title-section">
                    <h3 className="card-title">{doc.title}</h3>
                    <span className="category-badge">{doc.category}</span>
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={() => onDocumentSelect(doc)}
                      className="action-btn preview-btn"
                      title="Preview"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(doc.id)}
                      className="action-btn delete-btn"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p className="card-description">{doc.description}</p>

                <div className="card-meta">
                  <span className="meta-item">
                    <strong>Type:</strong> {doc.fileType.toUpperCase()}
                  </span>
                  <span className="meta-item">
                    <strong>Size:</strong> {(doc.fileSize / 1024).toFixed(1)} KB
                  </span>
                  <span className="meta-item">
                    <strong>Uploaded:</strong> {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>

                {doc.tags.length > 0 && (
                  <div className="card-tags">
                    {doc.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {deleteConfirm === doc.id && (
                  <div className="delete-confirmation">
                    <p>Are you sure you want to delete this document?</p>
                    <div className="confirmation-actions">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="confirm-btn"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || isLoading}
                className="pagination-btn"
              >
                ← Previous
              </button>

              <div className="pagination-info">
                Page {page} of {totalPages}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || isLoading}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .document-manager {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .manager-header h2 {
          margin: 0;
          font-size: 24px;
          color: #111827;
        }

        .manager-stats {
          font-size: 14px;
          color: #6b7280;
        }

        .manager-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 200px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          width: 18px;
          height: 18px;
          color: #9ca3af;
          pointer-events: none;
        }

        .search-box input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .search-box input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-controls {
          display: flex;
          gap: 8px;
        }

        .filter-controls select,
        .sort-order-btn {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .filter-controls select:focus,
        .sort-order-btn:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .sort-order-btn {
          width: 40px;
          padding: 8px;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .empty-hint {
          font-size: 14px;
          color: #9ca3af;
        }

        .documents-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .document-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s;
        }

        .document-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .card-title-section {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .card-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          word-break: break-word;
        }

        .category-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .action-btn.delete-btn:hover {
          border-color: #ef4444;
          background: #fee2e2;
        }

        .card-description {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }

        .card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
        }

        .meta-item {
          display: flex;
          gap: 4px;
        }

        .meta-item strong {
          color: #374151;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag {
          display: inline-block;
          padding: 2px 8px;
          background: #f3f4f6;
          color: #374151;
          border-radius: 4px;
          font-size: 12px;
        }

        .delete-confirmation {
          padding: 12px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          margin-top: 8px;
        }

        .delete-confirmation p {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #991b1b;
        }

        .confirmation-actions {
          display: flex;
          gap: 8px;
        }

        .confirm-btn,
        .cancel-btn {
          flex: 1;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .confirm-btn {
          background: #ef4444;
          color: white;
        }

        .confirm-btn:hover {
          background: #dc2626;
        }

        .cancel-btn {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .cancel-btn:hover {
          background: #f9fafb;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
        }

        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          font-size: 14px;
          color: #6b7280;
          min-width: 100px;
          text-align: center;
        }

        @media (max-width: 640px) {
          .manager-controls {
            flex-direction: column;
          }

          .search-box {
            min-width: auto;
          }

          .documents-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
