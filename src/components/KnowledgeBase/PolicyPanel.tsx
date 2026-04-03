import React, { useState, useEffect, useCallback } from 'react';
import { Document, Discipline } from '../../types';
import { logger } from '../../lib/logger';

interface PolicyPanelProps {
  discipline?: Discipline;
  documentType?: string;
  onPolicySelect: (policy: Document) => void;
}

export function PolicyPanel({
  discipline,
  documentType,
  onPolicySelect,
}: PolicyPanelProps) {
  const [policies, setPolicies] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  const loadRelevantPolicies = useCallback(async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (discipline) {
        params.append('discipline', discipline);
      }
      if (documentType) {
        params.append('documentType', documentType);
      }

      const response = await fetch(`/api/knowledge-base/documents?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load policies');
      }

      const result = await response.json();
      setPolicies(result.documents || []);
    } catch (error) {
      logger.error({
        message: 'Failed to load relevant policies',
        error,
      });
    } finally {
      setIsLoading(false);
    }
  }, [discipline, documentType]);

  useEffect(() => {
    loadRelevantPolicies();
  }, [loadRelevantPolicies]);

  return (
    <div className="policy-panel">
      <div className="panel-header">
        <h3>Applicable Policies</h3>
        {discipline && <span className="discipline-badge">{discipline}</span>}
        {documentType && <span className="doc-type-badge">{documentType}</span>}
      </div>

      {isLoading ? (
        <div className="loading">Loading policies...</div>
      ) : policies.length === 0 ? (
        <div className="empty-state">
          <p>No applicable policies found</p>
          <p className="hint">Upload policies to see them here</p>
        </div>
      ) : (
        <div className="policies-list">
          {policies.map((policy) => (
            <div key={policy.id} className="policy-item">
              <div
                className="policy-header"
                onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
              >
                <div className="policy-title-section">
                  <span className="expand-icon">
                    {expandedPolicy === policy.id ? '▼' : '▶'}
                  </span>
                  <h4>{policy.title}</h4>
                  <span className="category-badge">{policy.category}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPolicySelect(policy);
                  }}
                  className="view-btn"
                  title="View full policy"
                >
                  👁️
                </button>
              </div>

              {expandedPolicy === policy.id && (
                <div className="policy-content">
                  <p className="description">{policy.description}</p>

                  {policy.tags.length > 0 && (
                    <div className="tags">
                      {policy.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="policy-preview">
                    {policy.content.substring(0, 300)}
                    {policy.content.length > 300 && '...'}
                  </div>

                  {policy.effectiveDate && (
                    <div className="meta">
                      <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .policy-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 16px;
          color: #111827;
        }

        .discipline-badge,
        .doc-type-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 20px;
          color: #6b7280;
        }

        .empty-state .hint {
          font-size: 12px;
          color: #9ca3af;
        }

        .policies-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .policy-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .policy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .policy-header:hover {
          background: #f3f4f6;
        }

        .policy-title-section {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .expand-icon {
          font-size: 12px;
          color: #6b7280;
          width: 16px;
          text-align: center;
        }

        .policy-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .category-badge {
          display: inline-block;
          padding: 2px 6px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        .view-btn {
          width: 28px;
          height: 28px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .view-btn:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .policy-content {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          background: #fafbfc;
        }

        .description {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.4;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 8px;
        }

        .tag {
          display: inline-block;
          padding: 2px 6px;
          background: #f3f4f6;
          color: #374151;
          border-radius: 3px;
          font-size: 11px;
        }

        .policy-preview {
          padding: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
          max-height: 100px;
          overflow-y: auto;
          margin-bottom: 8px;
        }

        .meta {
          font-size: 11px;
          color: #9ca3af;
        }

        @media (max-width: 640px) {
          .policy-panel {
            padding: 12px;
          }

          .policy-header {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}
