import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from './templateService';

describe('TemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    (global.localStorage.getItem as any).mockReturnValue('[]');
  });

  describe('getTemplates', () => {
    it('should return default templates', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should include Standard Daily Note template', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      const standardTemplate = templates.find((t) => t.name === 'Standard Daily Note');
      expect(standardTemplate).toBeDefined();
      expect(standardTemplate?.state.customNote).toBeDefined();
    });

    it('should include Safety Focused template', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      const safetyTemplate = templates.find((t) => t.name === 'Safety Focused');
      expect(safetyTemplate).toBeDefined();
    });

    it('should include Cognitive Maintenance template', () => {
      const templates = TemplateService.getTemplates('ST', 'Daily');
      const cognitiveTemplate = templates.find((t) => t.name === 'Cognitive Maintenance');
      expect(cognitiveTemplate).toBeDefined();
    });

    it('should include Mobility/Transfer Focus template', () => {
      const templates = TemplateService.getTemplates('OT', 'Daily');
      const mobilityTemplate = templates.find((t) => t.name === 'Mobility/Transfer Focus');
      expect(mobilityTemplate).toBeDefined();
    });

    it('should include custom templates from localStorage', () => {
      const customTemplate = {
        name: 'Custom Template',
        state: { customNote: 'Custom note content' },
      };
      (global.localStorage.getItem as any).mockReturnValue(JSON.stringify([customTemplate]));

      const templates = TemplateService.getTemplates('PT', 'Daily');
      const found = templates.find((t) => t.name === 'Custom Template');
      expect(found).toBeDefined();
    });

    it('should handle empty custom templates', () => {
      (global.localStorage.getItem as any).mockReturnValue('[]');
      const templates = TemplateService.getTemplates('PT', 'Daily');
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should handle invalid JSON in localStorage', () => {
      (global.localStorage.getItem as any).mockReturnValue('invalid json');
      expect(() => {
        TemplateService.getTemplates('PT', 'Daily');
      }).toThrow();
    });
  });

  describe('saveTemplate', () => {
    it('should save template to localStorage', () => {
      const template = {
        name: 'New Template',
        state: { customNote: 'New template content' },
      };

      (global.localStorage.getItem as any).mockReturnValue('[]');
      TemplateService.saveTemplate(template);

      expect(global.localStorage.setItem).toHaveBeenCalled();
    });

    it('should append to existing templates', () => {
      const existingTemplate = {
        name: 'Existing Template',
        state: { customNote: 'Existing content' },
      };
      (global.localStorage.getItem as any).mockReturnValue(JSON.stringify([existingTemplate]));

      const newTemplate = {
        name: 'New Template',
        state: { customNote: 'New content' },
      };

      TemplateService.saveTemplate(newTemplate);

      expect(global.localStorage.setItem).toHaveBeenCalled();
      const callArgs = (global.localStorage.setItem as any).mock.calls[0];
      const savedData = JSON.parse(callArgs[1]);
      expect(savedData.length).toBe(2);
    });

    it('should preserve template structure', () => {
      const template = {
        name: 'Test Template',
        state: {
          customNote: 'Test content',
          discipline: 'PT',
          documentType: 'Daily',
        },
      };

      (global.localStorage.getItem as any).mockReturnValue('[]');
      TemplateService.saveTemplate(template);

      const callArgs = (global.localStorage.setItem as any).mock.calls[0];
      const savedData = JSON.parse(callArgs[1]);
      expect(savedData[0]).toEqual(template);
    });
  });

  describe('Template Structure', () => {
    it('should have name property', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      templates.forEach((template) => {
        expect(template.name).toBeDefined();
        expect(typeof template.name).toBe('string');
      });
    });

    it('should have state property', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      templates.forEach((template) => {
        expect(template.state).toBeDefined();
        expect(typeof template.state).toBe('object');
      });
    });

    it('should have customNote in state', () => {
      const templates = TemplateService.getTemplates('PT', 'Daily');
      templates.forEach((template) => {
        expect(template.state.customNote).toBeDefined();
      });
    });
  });
});
