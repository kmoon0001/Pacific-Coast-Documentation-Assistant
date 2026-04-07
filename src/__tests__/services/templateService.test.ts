import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TemplateService } from '../../services/templateService';

describe('TemplateService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getTemplates', () => {
    it('should return default templates', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');

      expect(templates.length).toBeGreaterThanOrEqual(4);
      expect(templates[0].name).toBe('Standard Daily Note');
      expect(templates[1].name).toBe('Safety Focused');
      expect(templates[2].name).toBe('Cognitive Maintenance');
      expect(templates[3].name).toBe('Mobility/Transfer Focus');
    });

    it('should include custom templates from localStorage', () => {
      const customTemplate = {
        name: 'Custom Template',
        state: { customNote: 'Custom note content' },
      };

      localStorage.setItem('customTemplates', JSON.stringify([customTemplate]));

      const templates = TemplateService.getTemplates('PT', 'Daily');

      expect(templates.length).toBeGreaterThanOrEqual(5);
      expect(templates[templates.length - 1].name).toBe('Custom Template');
    });

    it('should handle empty localStorage', () => {
      localStorage.removeItem('customTemplates');

      const templates = TemplateService.getTemplates('PT', 'Daily');

      expect(templates.length).toBe(4);
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('customTemplates', 'invalid-json');

      expect(() => {
        TemplateService.getTemplates('PT', 'Daily');
      }).toThrow();
    });
  });

  describe('saveTemplate', () => {
    it('should save a new template to localStorage', () => {
      const newTemplate = {
        name: 'New Template',
        state: { customNote: 'New template content' },
      };

      TemplateService.saveTemplate(newTemplate);

      const saved = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      expect(saved.length).toBe(1);
      expect(saved[0].name).toBe('New Template');
    });

    it('should append to existing templates', () => {
      const existingTemplate = {
        name: 'Existing Template',
        state: { customNote: 'Existing content' },
      };

      localStorage.setItem('customTemplates', JSON.stringify([existingTemplate]));

      const newTemplate = {
        name: 'New Template',
        state: { customNote: 'New content' },
      };

      TemplateService.saveTemplate(newTemplate);

      const saved = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      expect(saved.length).toBe(2);
      expect(saved[0].name).toBe('Existing Template');
      expect(saved[1].name).toBe('New Template');
    });

    it('should handle empty localStorage when saving', () => {
      localStorage.removeItem('customTemplates');

      const newTemplate = {
        name: 'First Template',
        state: { customNote: 'First content' },
      };

      TemplateService.saveTemplate(newTemplate);

      const saved = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      expect(saved.length).toBe(1);
    });
  });

  describe('Template Content', () => {
    it('should have correct content for Standard Daily Note', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      const standardTemplate = templates.find(t => t.name === 'Standard Daily Note');

      expect(standardTemplate).toBeDefined();
      expect(standardTemplate?.state.customNote).toContain('Pt tolerated tx well');
    });

    it('should have correct content for Safety Focused', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      const safetyTemplate = templates.find(t => t.name === 'Safety Focused');

      expect(safetyTemplate).toBeDefined();
      expect(safetyTemplate?.state.customNote).toContain('safety awareness');
    });

    it('should have correct content for Cognitive Maintenance', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      const cognitiveTemplate = templates.find(t => t.name === 'Cognitive Maintenance');

      expect(cognitiveTemplate).toBeDefined();
      expect(cognitiveTemplate?.state.customNote).toContain('cognitive-communication');
    });

    it('should have correct content for Mobility/Transfer Focus', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      const mobilityTemplate = templates.find(t => t.name === 'Mobility/Transfer Focus');

      expect(mobilityTemplate).toBeDefined();
      expect(mobilityTemplate?.state.customNote).toContain('transfers and functional mobility');
    });
  });
});
