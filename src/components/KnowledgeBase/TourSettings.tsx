import React, { useState, useEffect } from 'react';
import './TourSettings.css';

export interface TourSettingsProps {
  onStartTour: () => void;
  onClose: () => void;
}

export const TourSettings: React.FC<TourSettingsProps> = ({ onStartTour, onClose }) => {
  const [showTourOnStartup, setShowTourOnStartup] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const settings = localStorage.getItem('tourSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setShowTourOnStartup(parsed.showOnStartup || false);
      setTourCompleted(parsed.completed || false);
    }
  }, []);

  const handleToggleTourOnStartup = () => {
    const newValue = !showTourOnStartup;
    setShowTourOnStartup(newValue);

    // Save to localStorage
    const settings = {
      showOnStartup: newValue,
      completed: tourCompleted,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem('tourSettings', JSON.stringify(settings));
  };

  const handleRestartTour = () => {
    // Reset tour completion
    const settings = {
      showOnStartup: showTourOnStartup,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem('tourSettings', JSON.stringify(settings));
    onStartTour();
  };

  const handleResetTourSettings = () => {
    localStorage.removeItem('tourSettings');
    setShowTourOnStartup(false);
    setTourCompleted(false);
  };

  return (
    <div className="tour-settings">
      <div className="tour-settings-header">
        <h3>Guided Tour Settings</h3>
        <button className="tour-settings-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="tour-settings-content">
        <div className="tour-settings-section">
          <h4>Tour Options</h4>

          <div className="tour-settings-option">
            <label className="tour-settings-label">
              <input
                type="checkbox"
                checked={showTourOnStartup}
                onChange={handleToggleTourOnStartup}
              />
              <span>Show tour on startup</span>
            </label>
            <p className="tour-settings-description">
              Display the guided tour automatically when you first open the Knowledge Base.
            </p>
          </div>

          <div className="tour-settings-buttons">
            <button
              className="tour-settings-btn tour-settings-btn-primary"
              onClick={handleRestartTour}
            >
              🎬 Restart Tour
            </button>

            <button
              className="tour-settings-btn tour-settings-btn-secondary"
              onClick={handleResetTourSettings}
            >
              ↻ Reset Settings
            </button>
          </div>
        </div>

        <div className="tour-settings-section">
          <h4>Tour Information</h4>

          <div className="tour-settings-info">
            <div className="tour-info-item">
              <span className="tour-info-label">Status:</span>
              <span className="tour-info-value">
                {tourCompleted ? '✓ Completed' : '○ Not Started'}
              </span>
            </div>

            <div className="tour-info-item">
              <span className="tour-info-label">Tour Steps:</span>
              <span className="tour-info-value">14 steps</span>
            </div>

            <div className="tour-info-item">
              <span className="tour-info-label">Duration:</span>
              <span className="tour-info-value">~5-10 minutes</span>
            </div>
          </div>

          <div className="tour-settings-features">
            <h5>What You&apos;ll Learn:</h5>
            <ul>
              <li>How to upload and manage documents</li>
              <li>Search and filter capabilities</li>
              <li>Document preview and metadata</li>
              <li>Policy integration and compliance</li>
              <li>Document versioning and relationships</li>
              <li>Bulk operations for efficiency</li>
              <li>Analytics and reporting features</li>
              <li>Semantic search capabilities</li>
              <li>Settings and preferences</li>
            </ul>
          </div>
        </div>

        <div className="tour-settings-section">
          <h4>Keyboard Shortcuts</h4>

          <div className="tour-settings-shortcuts">
            <div className="tour-shortcut">
              <kbd>→</kbd>
              <span>Next step</span>
            </div>

            <div className="tour-shortcut">
              <kbd>←</kbd>
              <span>Previous step</span>
            </div>

            <div className="tour-shortcut">
              <kbd>Esc</kbd>
              <span>Skip tour</span>
            </div>

            <div className="tour-shortcut">
              <kbd>1-9</kbd>
              <span>Jump to step</span>
            </div>
          </div>
        </div>

        <div className="tour-settings-section">
          <h4>Tips</h4>

          <div className="tour-settings-tips">
            <div className="tour-tip">
              <span className="tour-tip-icon">💡</span>
              <p>You can click on any progress dot to jump to that step in the tour.</p>
            </div>

            <div className="tour-tip">
              <span className="tour-tip-icon">💡</span>
              <p>
                The tour highlights relevant UI elements and scrolls them into view automatically.
              </p>
            </div>

            <div className="tour-tip">
              <span className="tour-tip-icon">💡</span>
              <p>You can restart the tour anytime from the settings menu.</p>
            </div>

            <div className="tour-tip">
              <span className="tour-tip-icon">💡</span>
              <p>The tour is responsive and works on mobile devices too.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="tour-settings-footer">
        <button className="tour-settings-btn tour-settings-btn-primary" onClick={onClose}>
          Close Settings
        </button>
      </div>
    </div>
  );
};

export default TourSettings;
