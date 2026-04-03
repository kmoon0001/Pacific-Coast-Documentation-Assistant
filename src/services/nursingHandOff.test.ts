import { describe, expect, it } from 'vitest';
import { generateNursingHandOff } from './nursingHandOff';
import { createMockTherapyState } from '../__tests__/fixtures';

describe('generateNursingHandOff', () => {
  it('returns an SBAR-formatted summary that references the discipline and activity', () => {
    const state = createMockTherapyState({ discipline: 'PT', activity: 'gait training' });
    const summary = generateNursingHandOff('Patient ambulated with CGA.', state);

    expect(summary).toContain('NURSING HAND-OFF SUMMARY');
    expect(summary).toContain('PT');
    expect(summary).toContain('gait training');
  });

  it('includes the beginning of the generated note in the Assessment section', () => {
    const longNote = 'Patient tolerated therapy without pain. Plan to progress ambulation and balance goals tomorrow.';
    const state = createMockTherapyState({ discipline: 'OT', activity: 'therapeutic activities' });
    const summary = generateNursingHandOff(longNote, state);

    expect(summary).toContain('Patient tolerated therapy without pain');
  });

  it('falls back gracefully when optional therapy state fields are missing', () => {
    const summary = generateNursingHandOff('Clinical note content', {
      documentType: 'Daily',
      details: {},
      customNote: '',
    } as any);

    expect(summary).toContain('S: Patient therapy session completed.');
    expect(summary).toContain('skilled intervention');
  });
});
