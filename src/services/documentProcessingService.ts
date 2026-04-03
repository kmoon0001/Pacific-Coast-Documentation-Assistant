import { logger } from '../lib/logger';
import { Document, DocumentStructure, Section } from '../types';

/**
 * Document Processing Service
 * Handles text extraction, structure parsing, and document analysis
 */
class DocumentProcessingService {
  /**
   * Parse document structure from content
   */
  async parseDocumentStructure(content: string): Promise<DocumentStructure> {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      
      // Extract title (first non-empty line or first heading)
      let title = '';
      let contentStart = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#')) {
          title = lines[i].replace(/^#+\s*/, '').trim();
          contentStart = i + 1;
          break;
        }
      }
      
      if (!title && lines.length > 0) {
        title = lines[0].substring(0, 100);
      }

      // Parse sections
      const sections = this.parseSections(lines.slice(contentStart));
      
      // Extract key points
      const keyPoints = this.extractKeyPoints(content);
      
      // Generate summary
      const summary = this.generateSummary(content);

      return {
        title,
        sections,
        keyPoints,
        summary,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to parse document structure',
        error,
      });
      throw error;
    }
  }

  /**
   * Parse sections from content lines
   */
  private parseSections(lines: string[]): Section[] {
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let currentLevel = 0;

    for (const line of lines) {
      const headingMatch = line.match(/^(#+)\s+(.+)$/);
      
      if (headingMatch) {
        const level = headingMatch[1].length;
        const heading = headingMatch[2].trim();

        if (level === 1 || currentSection === null) {
          // Top-level section
          currentSection = {
            heading,
            content: '',
            subsections: [],
            keyPoints: [],
          };
          sections.push(currentSection);
          currentLevel = level;
        } else if (level > currentLevel && currentSection) {
          // Subsection
          const subsection: Section = {
            heading,
            content: '',
            subsections: [],
            keyPoints: [],
          };
          currentSection.subsections.push(subsection);
          currentLevel = level;
        } else {
          // New section at same or higher level
          currentSection = {
            heading,
            content: '',
            subsections: [],
            keyPoints: [],
          };
          sections.push(currentSection);
          currentLevel = level;
        }
      } else if (currentSection && line.trim()) {
        // Add content to current section
        currentSection.content += line + '\n';
      }
    }

    // Extract key points for each section
    sections.forEach(section => {
      section.keyPoints = this.extractKeyPointsFromText(section.content);
    });

    return sections;
  }

  /**
   * Extract key points from content
   */
  private extractKeyPoints(content: string): string[] {
    const keyPoints: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      // Look for bullet points, numbered lists, or emphasized text
      if (line.match(/^[\s]*[-•*]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
        const point = line.replace(/^[\s]*[-•*\d.]\s+/, '').trim();
        if (point.length > 10 && point.length < 200) {
          keyPoints.push(point);
        }
      }
      
      // Look for emphasized text (bold or italic)
      const boldMatch = line.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch[1].length > 10 && boldMatch[1].length < 200) {
        keyPoints.push(boldMatch[1]);
      }
    }

    return keyPoints.slice(0, 10); // Return top 10 key points
  }

  /**
   * Extract key points from specific text
   */
  private extractKeyPointsFromText(text: string): string[] {
    const keyPoints: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 200) {
        keyPoints.push(trimmed);
      }
    }

    return keyPoints.slice(0, 5);
  }

  /**
   * Generate summary from content
   */
  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    // Take first 3 sentences as summary
    const summary = sentences
      .slice(0, 3)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .join('. ');

    return summary.substring(0, 500) + (summary.length > 500 ? '...' : '');
  }

  /**
   * Identify key requirements from document
   */
  async identifyKeyRequirements(content: string): Promise<string[]> {
    try {
      const requirements: string[] = [];

      // Look for requirement patterns
      const requirementPatterns = [
        /must\s+(.+?)(?:[.!?]|$)/gi,
        /should\s+(.+?)(?:[.!?]|$)/gi,
        /required\s+(.+?)(?:[.!?]|$)/gi,
        /requirement[s]?:?\s*(.+?)(?:[.!?]|$)/gi,
        /shall\s+(.+?)(?:[.!?]|$)/gi,
      ];

      for (const pattern of requirementPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const requirement = match[1].trim();
          if (requirement.length > 10 && requirement.length < 300) {
            requirements.push(requirement);
          }
        }
      }

      // Remove duplicates
      return [...new Set(requirements)].slice(0, 20);
    } catch (error) {
      logger.error({
        message: 'Failed to identify requirements',
        error,
      });
      throw error;
    }
  }

  /**
   * Validate document completeness
   */
  async validateDocument(content: string): Promise<{
    isValid: boolean;
    issues: string[];
    score: number;
  }> {
    try {
      const issues: string[] = [];
      let score = 100;

      // Check content length
      if (content.length < 100) {
        issues.push('Document is too short (minimum 100 characters)');
        score -= 20;
      }

      // Check for structure
      const hasHeadings = /^#+\s+/m.test(content);
      if (!hasHeadings) {
        issues.push('Document lacks clear structure (no headings)');
        score -= 10;
      }

      // Check for content organization
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      if (paragraphs.length < 2) {
        issues.push('Document lacks clear organization (too few paragraphs)');
        score -= 10;
      }

      // Check for key information
      const hasRequirements = /must|should|required|shall/i.test(content);
      if (!hasRequirements) {
        issues.push('Document may lack clear requirements');
        score -= 5;
      }

      return {
        isValid: score >= 70,
        issues,
        score: Math.max(0, score),
      };
    } catch (error) {
      logger.error({
        message: 'Failed to validate document',
        error,
      });
      throw error;
    }
  }

  /**
   * Detect potential conflicts with existing content
   */
  async detectConflicts(
    newContent: string,
    existingDocuments: Document[]
  ): Promise<Array<{ documentId: string; conflictScore: number; reason: string }>> {
    try {
      const conflicts: Array<{ documentId: string; conflictScore: number; reason: string }> = [];

      // Extract key terms from new content
      const newTerms = this.extractKeyTerms(newContent);

      for (const doc of existingDocuments) {
        const existingTerms = this.extractKeyTerms(doc.content);
        
        // Calculate overlap
        const overlap = newTerms.filter(term => 
          existingTerms.some(eTerm => 
            eTerm.toLowerCase() === term.toLowerCase()
          )
        );

        if (overlap.length > 0) {
          const conflictScore = (overlap.length / Math.max(newTerms.length, existingTerms.length)) * 100;
          
          if (conflictScore > 30) {
            conflicts.push({
              documentId: doc.id,
              conflictScore,
              reason: `Significant overlap in content (${overlap.length} shared terms)`,
            });
          }
        }
      }

      return conflicts.sort((a, b) => b.conflictScore - a.conflictScore);
    } catch (error) {
      logger.error({
        message: 'Failed to detect conflicts',
        error,
      });
      throw error;
    }
  }

  /**
   * Extract key terms from content
   */
  private extractKeyTerms(content: string): string[] {
    // Extract words that are likely important (longer words, capitalized, etc.)
    const words = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const longWords = content.match(/\b\w{6,}\b/g) || [];
    
    return [...new Set([...words, ...longWords])].slice(0, 50);
  }

  /**
   * Extract compliance-related content
   */
  async extractComplianceContent(content: string): Promise<{
    complianceItems: string[];
    riskItems: string[];
    bestPractices: string[];
  }> {
    try {
      const complianceItems: string[] = [];
      const riskItems: string[] = [];
      const bestPractices: string[] = [];

      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();

        // Compliance items
        if (/compliance|requirement|mandate|regulation|standard/i.test(trimmed)) {
          complianceItems.push(trimmed);
        }

        // Risk items
        if (/risk|danger|hazard|violation|penalty|consequence/i.test(trimmed)) {
          riskItems.push(trimmed);
        }

        // Best practices
        if (/best practice|recommendation|guideline|should|consider/i.test(trimmed)) {
          bestPractices.push(trimmed);
        }
      }

      return {
        complianceItems: complianceItems.slice(0, 10),
        riskItems: riskItems.slice(0, 10),
        bestPractices: bestPractices.slice(0, 10),
      };
    } catch (error) {
      logger.error({
        message: 'Failed to extract compliance content',
        error,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const documentProcessingService = new DocumentProcessingService();

export default documentProcessingService;
