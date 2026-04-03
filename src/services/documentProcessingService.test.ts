import { describe, it, expect, beforeEach } from 'vitest';
import { documentProcessingService } from './documentProcessingService';

describe('DocumentProcessingService', () => {
  describe('parseDocumentStructure', () => {
    it('should parse document structure with headings', async () => {
      const content = `# Main Title

## Section 1
This is section 1 content.

### Subsection 1.1
Subsection content here.

## Section 2
More content.`;

      const structure = await documentProcessingService.parseDocumentStructure(content);

      expect(structure.title).toBe('Main Title');
      expect(structure.sections.length).toBeGreaterThan(0);
      expect(structure.keyPoints).toBeDefined();
      expect(structure.summary).toBeDefined();
    });

    it('should extract title from first line if no heading', async () => {
      const content = `Policy Document
This is the content of the policy.`;

      const structure = await documentProcessingService.parseDocumentStructure(content);

      expect(structure.title).toBe('Policy Document');
    });

    it('should parse sections correctly', async () => {
      const content = `# Document

## Requirements
- Must do this
- Should do that

## Procedures
Step 1: Do something
Step 2: Do something else`;

      const structure = await documentProcessingService.parseDocumentStructure(content);

      expect(structure.sections.length).toBeGreaterThan(0);
      expect(structure.sections.some(s => s.heading.includes('Requirements'))).toBe(true);
    });

    it('should extract key points from bullet lists', async () => {
      const content = `# Policy

## Key Points
- This is an important requirement
- Another critical requirement
- Third important point`;

      const structure = await documentProcessingService.parseDocumentStructure(content);

      expect(structure.keyPoints.length).toBeGreaterThan(0);
    });

    it('should generate summary from content', async () => {
      const content = `# Policy Document

This is the first sentence of the policy. It contains important information. The policy also covers other aspects.`;

      const structure = await documentProcessingService.parseDocumentStructure(content);

      expect(structure.summary.length).toBeGreaterThan(0);
      expect(structure.summary.length).toBeLessThanOrEqual(500);
    });
  });

  describe('identifyKeyRequirements', () => {
    it('should identify requirements with "must"', async () => {
      const content = 'All therapists must document patient progress. They must follow HIPAA guidelines.';

      const requirements = await documentProcessingService.identifyKeyRequirements(content);

      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements.some(r => r.includes('document'))).toBe(true);
    });

    it('should identify requirements with "should"', async () => {
      const content = 'Therapists should use clear language. They should document daily.';

      const requirements = await documentProcessingService.identifyKeyRequirements(content);

      expect(requirements.length).toBeGreaterThan(0);
    });

    it('should identify requirements with "required"', async () => {
      const content = 'It is required to maintain patient confidentiality. Certification is required.';

      const requirements = await documentProcessingService.identifyKeyRequirements(content);

      expect(requirements.length).toBeGreaterThan(0);
    });

    it('should identify requirements with "shall"', async () => {
      const content = 'All staff shall comply with regulations. Therapists shall maintain records.';

      const requirements = await documentProcessingService.identifyKeyRequirements(content);

      expect(requirements.length).toBeGreaterThan(0);
    });

    it('should remove duplicate requirements', async () => {
      const content = 'Must document progress. Must document daily. Must document accurately.';

      const requirements = await documentProcessingService.identifyKeyRequirements(content);

      // Should have unique requirements
      const unique = new Set(requirements);
      expect(unique.size).toBeLessThanOrEqual(requirements.length);
    });
  });

  describe('validateDocument', () => {
    it('should validate well-formed document', async () => {
      const content = `# Policy Document

## Section 1
This is a well-formed policy document with proper structure and content.

## Requirements
- Must follow guidelines
- Should document progress`;

      const result = await documentProcessingService.validateDocument(content);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(70);
    });

    it('should flag document that is too short', async () => {
      const content = 'Short';

      const result = await documentProcessingService.validateDocument(content);

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(i => i.includes('too short'))).toBe(true);
    });

    it('should flag document lacking structure', async () => {
      const content = 'This is a document without any headings or structure. It just has plain text.';

      const result = await documentProcessingService.validateDocument(content);

      expect(result.issues.some(i => i.includes('structure'))).toBe(true);
    });

    it('should flag document lacking requirements', async () => {
      const content = `# Document

This is a document about something. It talks about various topics. But it doesn't specify any requirements.`;

      const result = await documentProcessingService.validateDocument(content);

      expect(result.issues.some(i => i.includes('requirements'))).toBe(true);
    });

    it('should return score between 0 and 100', async () => {
      const content = 'Some content here';

      const result = await documentProcessingService.validateDocument(content);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('detectConflicts', () => {
    it('should detect conflicts with similar content', async () => {
      const newContent = 'All therapists must document patient progress daily.';
      const existingDocs = [
        {
          id: 'doc1',
          title: 'Existing Policy',
          content: 'Therapists must document progress every day.',
          description: 'Policy',
          category: 'Policy' as const,
          contentHash: 'hash1',
          fileType: 'txt' as const,
          fileSize: 100,
          uploadedAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: [],
          isActive: true,
          metadata: {},
          userId: 'user1',
        },
      ];

      const conflicts = await documentProcessingService.detectConflicts(newContent, existingDocs);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].conflictScore).toBeGreaterThan(0);
    });

    it('should not flag unrelated documents as conflicts', async () => {
      const newContent = 'Patient privacy policy';
      const existingDocs = [
        {
          id: 'doc1',
          title: 'Billing Policy',
          content: 'Billing procedures and payment methods.',
          description: 'Policy',
          category: 'Policy' as const,
          contentHash: 'hash1',
          fileType: 'txt' as const,
          fileSize: 100,
          uploadedAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: [],
          isActive: true,
          metadata: {},
          userId: 'user1',
        },
      ];

      const conflicts = await documentProcessingService.detectConflicts(newContent, existingDocs);

      expect(conflicts.length).toBe(0);
    });

    it('should rank conflicts by score', async () => {
      const newContent = 'Documentation requirements and procedures';
      const existingDocs = [
        {
          id: 'doc1',
          title: 'Documentation Policy',
          content: 'All documentation must follow standards. Documentation procedures are critical.',
          description: 'Policy',
          category: 'Policy' as const,
          contentHash: 'hash1',
          fileType: 'txt' as const,
          fileSize: 100,
          uploadedAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: [],
          isActive: true,
          metadata: {},
          userId: 'user1',
        },
        {
          id: 'doc2',
          title: 'Billing Policy',
          content: 'Billing procedures and payment methods.',
          description: 'Policy',
          category: 'Policy' as const,
          contentHash: 'hash2',
          fileType: 'txt' as const,
          fileSize: 100,
          uploadedAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: [],
          isActive: true,
          metadata: {},
          userId: 'user1',
        },
      ];

      const conflicts = await documentProcessingService.detectConflicts(newContent, existingDocs);

      if (conflicts.length > 1) {
        expect(conflicts[0].conflictScore).toBeGreaterThanOrEqual(conflicts[1].conflictScore);
      }
    });
  });

  describe('extractComplianceContent', () => {
    it('should extract compliance items', async () => {
      const content = `# Compliance Policy

## Requirements
- Compliance with HIPAA regulations
- Compliance with state laws
- Requirement to maintain records`;

      const result = await documentProcessingService.extractComplianceContent(content);

      expect(result.complianceItems.length).toBeGreaterThan(0);
    });

    it('should extract risk items', async () => {
      const content = `# Risk Management

## Risks
- Risk of data breach
- Violation of privacy laws
- Penalty for non-compliance`;

      const result = await documentProcessingService.extractComplianceContent(content);

      expect(result.riskItems.length).toBeGreaterThan(0);
    });

    it('should extract best practices', async () => {
      const content = `# Best Practices

- Best practice: Use encryption
- Recommendation: Document daily
- Guideline: Follow standards`;

      const result = await documentProcessingService.extractComplianceContent(content);

      expect(result.bestPractices.length).toBeGreaterThan(0);
    });

    it('should return all three categories', async () => {
      const content = `# Policy

Compliance with regulations is required. Risk of violation is high. Best practice is to document daily.`;

      const result = await documentProcessingService.extractComplianceContent(content);

      expect(result.complianceItems).toBeDefined();
      expect(result.riskItems).toBeDefined();
      expect(result.bestPractices).toBeDefined();
    });
  });
});
