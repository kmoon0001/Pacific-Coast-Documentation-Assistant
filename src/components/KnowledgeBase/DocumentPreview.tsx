import React, { useState, useEffect, useCallback } from 'react';
import { Document, UsageStats } from '../../types';
import { logger } from '../../lib/logger';

interface DocumentPreviewProps {
  document: Document;
  onClose: () => void;
}

export function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'usage'>('content');

  const loadUsageStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const response = await fetch(`/api/knowledge-base/documents/${document.id}/usage`);
      if (!response.ok) {
        throw new Error('Failed to load usage stats');
      }
      const result = await response.json();
      setUsageStats(result.stats);
    } catch (error) {
      logger.error({
        message: 'Failed to load usage stats',
        error,
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [document.id]);

  useEffect(() => {
    loadUsageStats();
  }, [loadUsageStats]);

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="document-preview-overlay">
      <div className="document-preview">
        <div className="preview-header">
          <div className="preview-title-section">
            <h2>{document.title}</h2>
            <span className="category-badge">{document.category}</span>
          </div>
          <button onClick={onClose} className="close-btn" title="Close">
            ✕
          </button>
        </div>

        <div className="preview-tabs">
          <button
            className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
          <button
            className={`tab-btn ${activeTab === 'metadata' ? 'active' : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            Metadata
          </button>
          <button
            className={`tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            Usage
          </button>
        </div>

        <div className="preview-content">
          {activeTab === 'content' && (
            <div className="content-tab">
              <div className="content-preview">
                {document.content.substring(0, 2000)}
                {document.content.length > 2000 && (
                  <p className="content-truncated">... (content truncated)</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="metadata-tab">
              <div className="metadata-grid">
                <div className="metadata-item">
                  <label>Title</label>
                  <p>{document.title}</p>
                </div>

                <div className="metadata-item">
                  <label>Category</label>
                  <p>{document.category}</p>
                </div>

                <div className="metadata-item">
                  <label>Description</label>
                  <p>{document.description || 'N/A'}</p>
                </div>

                <div className="metadata-item">
                  <label>File Type</label>
                  <p>{document.fileType.toUpperCase()}</p>
                </div>

                <div className="metadata-item">
                  <label>File Size</label>
                  <p>{formatFileSize(document.fileSize)}</p>
                </div>

                <div className="metadata-item">
                  <label>Version</label>
                  <p>{document.version}</p>
                </div>

                <div className="metadata-item">
                  <label>Uploaded</label>
                  <p>{formatDate(document.uploadedAt)}</p>
                </div>

                <div className="metadata-item">
                  <label>Last Updated</label>
                  <p>{formatDate(document.updatedAt)}</p>
                </div>

                {document.effectiveDate && (
                  <div className="metadata-item">
                    <label>Effective Date</label>
                    <p>{formatDate(document.effectiveDate)}</p>
                  </div>
                )}

                {document.expiryDate && (
                  <div className="metadata-item">
                    <label>Expiry Date</label>
                    <p>{formatDate(document.expiryDate)}</p>
                  </div>
                )}

                {document.tags.length > 0 && (
                  <div className="metadata-item full-width">
                    <label>Tags</label>
                    <div className="tags-list">
                      {document.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="usage-tab">
              {isLoadingStats ? (
                <p className="loading">Loading usage statistics...</p>
              ) : usageStats ? (
                <div className="usage-stats">
                  <div className="stat-card">
                    <div className="stat-value">{usageStats.totalUsages}</div>
                    <div className="stat-label">Total Uses</div>
                  </div>

                  {usageStats.lastUsed && (
                    <div className="stat-card">
                      <div className="stat-value">{formatDate(usageStats.lastUsed)}</div>
                      <div className="stat-label">Last Used</div>
                    </div>
                  )}

                  {Object.keys(usageStats.usageByDiscipline).length > 0 && (
                    <div className="stat-section">
                      <h4>Usage by Discipline</h4>
                      <div className="stat-breakdown">
                        {Object.entries(usageStats.usageByDiscipline).map(([discipline, count]) => (
                          <div key={discipline} className="breakdown-item">
                            <span>{discipline}</span>
                            <span className="count">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(usageStats.usageByDocumentType).length > 0 && (
                    <div className="stat-section">
                      <h4>Usage by Document Type</h4>
                      <div className="stat-breakdown">
                        {Object.entries(usageStats.usageByDocumentType).map(([type, count]) => (
                          <div key={type} className="breakdown-item">
                            <span>{type}</span>
                            <span className="count">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {usageStats.recentNotes.length > 0 && (
                    <div className="stat-section">
                      <h4>Recent Notes Using This Document</h4>
                      <div className="recent-notes">
                        {usageStats.recentNotes.slice(0, 5).map((noteId) => (
                          <div key={noteId} className="note-item">
                            {noteId}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="no-stats">No usage statistics available</p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .document-preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .document-preview {
          background: white;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .preview-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .preview-header h2 {
          margin: 0;
          font-size: 20px;
          color: #111827;
          word-break: break-word;
        }

        .category-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f3f4f6;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          color: #6b7280;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .close-btn:hover {
          background: #e5e7eb;
          color: #111827;
        }

        .preview-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: #374151;
        }

        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .preview-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .content-preview {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
          word-break: break-word;
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .content-truncated {
          margin-top: 12px;
          color: #9ca3af;
          font-style: italic;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .metadata-item.full-width {
          grid-column: 1 / -1;
        }

        .metadata-item label {
          font-weight: 600;
          color: #374151;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metadata-item p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag {
          display: inline-block;
          padding: 4px 10px;
          background: #f3f4f6;
          color: #374151;
          border-radius: 4px;
          font-size: 12px;
        }

        .usage-stats {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background: #f0f9ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e40af;
        }

        .stat-label {
          font-size: 12px;
          color: #1e40af;
          margin-top: 4px;
        }

        .stat-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-section h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .stat-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 14px;
        }

        .breakdown-item span:first-child {
          color: #374151;
          font-weight: 500;
        }

        .breakdown-item .count {
          color: #3b82f6;
          font-weight: 600;
        }

        .recent-notes {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .note-item {
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 13px;
          color: #6b7280;
          font-family: 'Monaco', 'Courier New', monospace;
          word-break: break-all;
        }

        .loading,
        .no-stats {
          text-align: center;
          color: #6b7280;
          padding: 20px;
        }

        @media (max-width: 640px) {
          .document-preview-overlay {
            padding: 0;
          }

          .document-preview {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .metadata-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
