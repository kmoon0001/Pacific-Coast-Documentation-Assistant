import React, { useState, useRef } from 'react';
import { Document, DocumentCategory, DocumentMetadata } from '../../types';
import { logger } from '../../lib/logger';

interface DocumentUploadProps {
  onUploadComplete: (document: Document) => void;
  onError: (error: Error) => void;
  category?: DocumentCategory;
}

export function DocumentUpload({
  onUploadComplete,
  onError,
  category,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: category || ('Policy' as DocumentCategory),
    tags: '',
    effectiveDate: '',
    expiryDate: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      // Validate file type
      const validTypes = ['text/plain', 'text/markdown', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Supported: TXT, MD, PDF, DOCX');
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit');
      }

      // Validate form data
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!formData.category) {
        throw new Error('Category is required');
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(',')[1];

          const metadata: DocumentMetadata = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
            effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : undefined,
            expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
          };

          const response = await fetch('/api/knowledge-base/documents/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: {
                name: file.name,
                type: file.type,
                data: base64,
              },
              metadata,
            }),
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          setUploadProgress(100);

          // Reset form
          setFormData({
            title: '',
            description: '',
            category: category || ('Policy' as DocumentCategory),
            tags: '',
            effectiveDate: '',
            expiryDate: '',
          });

          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          onUploadComplete(result.document);

          logger.info({
            message: 'Document uploaded successfully',
            documentId: result.document.id,
          });
        } catch (error) {
          clearInterval(progressInterval);
          const err = error instanceof Error ? error : new Error('Upload failed');
          onError(err);
          logger.error({
            message: 'Document upload error',
            error,
          });
        } finally {
          clearInterval(progressInterval);
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('File selection failed');
      onError(err);
      logger.error({
        message: 'File selection error',
        error,
      });
    }
  };

  return (
    <div className="document-upload">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <h3>Drag and drop your document here</h3>
          <p>or click to select a file</p>
          <p className="file-types">Supported: PDF, DOCX, TXT, MD (max 50MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.txt,.md"
            disabled={isUploading}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="select-button"
          >
            {isUploading ? 'Uploading...' : 'Select File'}
          </button>
        </div>

        {isUploading && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      <form className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Document title"
            disabled={isUploading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Document description"
            disabled={isUploading}
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as DocumentCategory })}
              disabled={isUploading}
              required
            >
              <option value="Policy">Policy</option>
              <option value="Procedure">Procedure</option>
              <option value="Guidance">Guidance</option>
              <option value="Regulation">Regulation</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Comma-separated tags"
              disabled={isUploading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="effectiveDate">Effective Date</label>
            <input
              id="effectiveDate"
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              disabled={isUploading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date</label>
            <input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              disabled={isUploading}
            />
          </div>
        </div>
      </form>

      <style>{`
        .document-upload {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .upload-area.dragging {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .upload-area.uploading {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .upload-icon {
          width: 48px;
          height: 48px;
          color: #6b7280;
        }

        .upload-area h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .upload-area p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .file-types {
          font-size: 12px;
          color: #9ca3af;
        }

        .select-button {
          margin-top: 12px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .select-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .select-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 12px;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input:disabled,
        .form-group textarea:disabled,
        .form-group select:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .upload-area {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}
