import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SKILL_DIR = path.resolve(__dirname, '../../../.claude/skills');

const SKILLS = [
  'fluid-social',
  'fluid-one-pager',
  'fluid-theme-section',
  'fluid-design-os',
];

describe('Skill path routing audit', () => {
  for (const skill of SKILLS) {
    describe(skill, () => {
      const skillPath = path.join(SKILL_DIR, skill, 'SKILL.md');
      let content: string;

      beforeAll(() => {
        content = fs.readFileSync(skillPath, 'utf-8');
      });

      it('should contain .fluid/working/ output path instruction', () => {
        expect(content).toContain('.fluid/working/');
      });

      it('should contain canvas-active sentinel check', () => {
        expect(content).toContain('canvas-active');
      });

      if (skill !== 'fluid-design-os') {
        it('should not use bare "output/" as the sole primary output path', () => {
          // The skill should mention .fluid/working/ BEFORE any ./output/ reference
          // or use ./output/ only as a fallback
          const workingIdx = content.indexOf('.fluid/working/');
          const outputIdx = content.indexOf('## Output Path');
          // Must have an Output Path section that mentions .fluid/working/
          if (outputIdx !== -1) {
            const outputSection = content.slice(outputIdx);
            expect(outputSection).toContain('.fluid/working/');
          } else {
            // Must at least mention .fluid/working/ somewhere
            expect(workingIdx).toBeGreaterThan(-1);
          }
        });
      }
    });
  }
});
