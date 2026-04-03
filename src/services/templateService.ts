import { TherapyState } from '../types';

export interface Template {
  name: string;
  state: Partial<TherapyState>;
}

export const TemplateService = {
  getTemplates: (_discipline: string, _documentType: string): Template[] => {
    const defaultTemplates: Template[] = [
      {
        name: 'Standard Daily Note',
        state: {
          customNote: 'Pt tolerated tx well. Pt participated in skilled activities with min cues.'
        }
      },
      {
        name: 'Safety Focused',
        state: {
          customNote: 'Pt demonstrated improved safety awareness. Pt required verbal cues for safety.'
        }
      },
      {
        name: 'Cognitive Maintenance',
        state: {
          customNote: 'Pt participated in cognitive-communication tasks to maintain functional status and safety.'
        }
      },
      {
        name: 'Mobility/Transfer Focus',
        state: {
          customNote: 'Pt required skilled intervention for safe transfers and functional mobility.'
        }
      }
    ];

    const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    return [...defaultTemplates, ...customTemplates];
  },

  saveTemplate: (template: Template) => {
    const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    customTemplates.push(template);
    localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
  }
};
