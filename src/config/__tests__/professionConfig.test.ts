import { describe, expect, it } from 'vitest';
import { ClinicalSetting, Difficulty } from '../../types';
import { professionConfigs } from '../professionConfig';

const difficulties: Array<Difficulty | undefined> = [undefined, 'beginner', 'intermediate', 'advanced'];
const settings: Array<ClinicalSetting | undefined> = [
  undefined,
  'clinic',
  'emergency',
  'telehealth',
  'inpatient',
  'labor_delivery',
  'home',
  'birth_center',
];

describe('professionConfigs', () => {
  it('exposes prompt builders for every profession, difficulty, and setting branch', () => {
    Object.values(professionConfigs).forEach((config) => {
      const category = config.categories[0] ?? 'General';

      difficulties.forEach((difficulty) => {
        settings.forEach((setting) => {
          const setupPrompt = config.getSetupPrompt(category, difficulty, setting);
          const systemPrompt = config.getSystemPrompt('DIAGNOSIS: Example condition', difficulty, setting);

          expect(setupPrompt).toContain(category);
          expect(systemPrompt).toContain('Example condition');
        });
      });

      const assessmentPrompt = config.getAssessmentPrompt('Example condition', 'Blood Pressure', 'vitals');
      expect(assessmentPrompt).toContain('Example condition');
      expect(assessmentPrompt).toContain('Blood Pressure');
      expect(assessmentPrompt).toContain('vitals');
    });
  });

  it('includes couples therapy-specific prompt instructions', () => {
    const config = professionConfigs.couplesTherapist;

    const setupPrompt = config.getSetupPrompt(
      'Communication & Conflict Patterns',
      'advanced',
      'telehealth',
    );
    const systemPrompt = config.getSystemPrompt(
      'PARTNER_A_NAME: Alex\nPARTNER_B_NAME: Jordan\nNEGATIVE_CYCLE: pursue-withdraw',
      'intermediate',
      'clinic',
    );
    const assessmentPrompt = config.getAssessmentPrompt(
      'pursue-withdraw cycle',
      'Cycle Mapping',
      'relationship',
    );

    expect(config.isCouplesTherapy).toBe(true);
    expect(setupPrompt).toContain('couple');
    expect(setupPrompt).toContain('PARTNER_A_NAME');
    expect(systemPrompt).toContain('Alex');
    expect(systemPrompt).toContain('Jordan');
    expect(assessmentPrompt).toContain('pursue-withdraw cycle');
  });
});
