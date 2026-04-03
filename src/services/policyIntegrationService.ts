import { logger } from '../lib/logger';
import { Document, PolicyContext, PromptEnhancement, ComplianceValidation, Discipline } from '../types';
import { documentProcessingService } from './documentProcessingService';

/**
 * Policy Integration Service
 * Integrates uploaded policies into note generation and audit processes
 */
class PolicyIntegrationService {
  /**
   * Build policy context for note generation
   */
  async buildPolicyContext(
    discipline?: Discipline,
    documentType?: string,
    userId?: string,
    policies?: Document[]
  ): Promise<PolicyContext> {
    try {
      const relevantPolicies = policies || [];
      const requirements: string[] = [];
      const styleGuides: Document[] = [];
      const complianceRules: string[] = [];

      // Extract requirements from policies
      for (const policy of relevantPolicies) {
        const reqs = await documentProcessingService.identifyKeyRequirements(policy.content);
        requirements.push(...reqs);

        // Identify style guides
        if (policy.category === 'Guidance' || policy.tags.includes('style')) {
          styleGuides.push(policy);
        }

        // Extract compliance rules
        const compliance = await documentProcessingService.extractComplianceContent(policy.content);
        complianceRules.push(...compliance.complianceItems);
      }

      // If no requirements found, extract from content directly
      if (requirements.length === 0 && relevantPolicies.length > 0) {
        for (const policy of relevantPolicies) {
          const lines = policy.content.split('\n');
          for (const line of lines) {
            if (line.trim().length > 10 && line.trim().length < 300) {
              requirements.push(line.trim());
            }
          }
        }
      }

      return {
        policies: relevantPolicies,
        requirements: requirements.map((req, idx) => ({
          id: `req-${idx}`,
          documentId: relevantPolicies[0]?.id || '',
          requirement: req,
          priority: this.determinePriority(req),
          applicableTo: discipline ? [discipline] : [],
          complianceChecks: [],
          createdAt: new Date(),
        })),
        styleGuides,
        complianceRules: [...new Set(complianceRules)],
      };
    } catch (error) {
      logger.error({
        message: 'Failed to build policy context',
        error,
      });
      throw error;
    }
  }

  /**
   * Get relevant policies for a discipline and document type
   */
  async getRelevantPolicies(
    query: string,
    discipline?: Discipline,
    documentType?: string,
    allPolicies?: Document[]
  ): Promise<Document[]> {
    try {
      if (!allPolicies) {
        return [];
      }

      const queryTerms = query.toLowerCase().split(/\s+/);
      const scored: Array<{ policy: Document; score: number }> = [];

      for (const policy of allPolicies) {
        let score = 0;

        // Match query terms
        const searchText = `${policy.title} ${policy.description} ${policy.tags.join(' ')}`.toLowerCase();
        for (const term of queryTerms) {
          if (searchText.includes(term)) {
            score += 10;
          }
        }

        // Match discipline
        if (discipline && policy.tags.includes(discipline)) {
          score += 5;
        }

        // Match document type
        if (documentType && policy.tags.includes(documentType)) {
          score += 5;
        }

        // Prioritize active policies
        if (policy.isActive) {
          score += 3;
        }

        if (score > 0) {
          scored.push({ policy, score });
        }
      }

      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => item.policy);
    } catch (error) {
      logger.error({
        message: 'Failed to get relevant policies',
        error,
      });
      throw error;
    }
  }

  /**
   * Enhance note generation prompt with policies
   */
  async enhanceGenerateNotePrompt(
    originalPrompt: string,
    policies: Document[],
    userStyle?: string
  ): Promise<PromptEnhancement> {
    try {
      const injectedPolicies: string[] = [];
      const injectedRequirements: string[] = [];

      // Build policy context
      let policySection = '';
      if (policies.length > 0) {
        policySection = '\n\n## ORGANIZATIONAL POLICIES TO FOLLOW:\n';
        
        for (const policy of policies) {
          policySection += `\n### ${policy.title}\n`;
          policySection += `Category: ${policy.category}\n`;
          policySection += `${policy.description}\n`;
          
          // Extract key requirements
          const requirements = await documentProcessingService.identifyKeyRequirements(policy.content);
          for (const req of requirements.slice(0, 3)) {
            policySection += `- ${req}\n`;
            injectedRequirements.push(req);
          }
          
          injectedPolicies.push(policy.id);
        }
      }

      // Build style section
      let styleSection = '';
      if (userStyle) {
        styleSection = `\n\n## WRITING STYLE GUIDE:\n${userStyle}\n`;
      }

      // Combine prompt
      const enhancedPrompt = originalPrompt + policySection + styleSection;

      return {
        originalPrompt,
        enhancedPrompt,
        injectedPolicies,
        injectedRequirements,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to enhance generate note prompt',
        error,
      });
      throw error;
    }
  }

  /**
   * Enhance audit prompt with policies
   */
  async enhanceAuditPrompt(
    originalPrompt: string,
    policies: Document[]
  ): Promise<PromptEnhancement> {
    try {
      const injectedPolicies: string[] = [];
      const injectedRequirements: string[] = [];

      let policySection = '';
      if (policies.length > 0) {
        policySection = '\n\n## POLICIES TO VALIDATE AGAINST:\n';
        
        for (const policy of policies) {
          policySection += `\n### ${policy.title}\n`;
          
          // Extract compliance items
          const compliance = await documentProcessingService.extractComplianceContent(policy.content);
          for (const item of compliance.complianceItems.slice(0, 3)) {
            policySection += `- ${item}\n`;
            injectedRequirements.push(item);
          }
          
          injectedPolicies.push(policy.id);
        }

        policySection += '\n## VALIDATION CHECKLIST:\n';
        policySection += '- Verify note complies with all listed policies\n';
        policySection += '- Identify any policy violations\n';
        policySection += '- Suggest corrections if needed\n';
      }

      const enhancedPrompt = originalPrompt + policySection;

      return {
        originalPrompt,
        enhancedPrompt,
        injectedPolicies,
        injectedRequirements,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to enhance audit prompt',
        error,
      });
      throw error;
    }
  }

  /**
   * Enhance gap analysis prompt with policies
   */
  async enhanceGapAnalysisPrompt(
    originalPrompt: string,
    policies: Document[]
  ): Promise<PromptEnhancement> {
    try {
      const injectedPolicies: string[] = [];
      const injectedRequirements: string[] = [];

      let policySection = '';
      if (policies.length > 0) {
        policySection = '\n\n## POLICY-BASED REQUIREMENTS:\n';
        
        for (const policy of policies) {
          const requirements = await documentProcessingService.identifyKeyRequirements(policy.content);
          for (const req of requirements.slice(0, 5)) {
            policySection += `- ${req}\n`;
            injectedRequirements.push(req);
          }
          injectedPolicies.push(policy.id);
        }

        policySection += '\n## GAP ANALYSIS FOCUS:\n';
        policySection += '- Identify missing information related to policies\n';
        policySection += '- Suggest answers based on policy guidelines\n';
        policySection += '- Highlight policy-specific gaps\n';
      }

      const enhancedPrompt = originalPrompt + policySection;

      return {
        originalPrompt,
        enhancedPrompt,
        injectedPolicies,
        injectedRequirements,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to enhance gap analysis prompt',
        error,
      });
      throw error;
    }
  }

  /**
   * Validate note compliance with policies
   */
  async validateNoteCompliance(
    note: string,
    policies: Document[],
    _documentType?: string
  ): Promise<ComplianceValidation> {
    try {
      const violations: string[] = [];
      const appliedPolicies: string[] = [];
      const recommendations: string[] = [];
      let complianceScore = 100;

      for (const policy of policies) {
        // Extract compliance requirements
        const compliance = await documentProcessingService.extractComplianceContent(policy.content);
        
        // Check for compliance items in note
        let policyApplied = false;
        for (const item of compliance.complianceItems) {
          const itemTerms = item.toLowerCase().split(/\s+/).filter(t => t.length > 3);
          const noteText = note.toLowerCase();
          
          if (itemTerms.some(term => noteText.includes(term))) {
            policyApplied = true;
          } else {
            violations.push(`Missing compliance item from ${policy.title}: ${item}`);
            complianceScore -= 5;
          }
        }

        if (policyApplied) {
          appliedPolicies.push(policy.id);
        }

        // Add best practices as recommendations
        for (const practice of compliance.bestPractices.slice(0, 2)) {
          recommendations.push(`Consider: ${practice}`);
        }
      }

      return {
        complianceScore: Math.max(0, complianceScore),
        violations,
        appliedPolicies,
        recommendations,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to validate note compliance',
        error,
      });
      throw error;
    }
  }

  /**
   * Determine priority of a requirement
   */
  private determinePriority(requirement: string): 'high' | 'medium' | 'low' {
    const text = requirement.toLowerCase();
    
    if (/must|shall|required|critical|mandatory/i.test(text)) {
      return 'high';
    }
    
    if (/should|recommended|important/i.test(text)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Extract style guide from document
   */
  async extractStyleGuide(document: Document): Promise<string> {
    try {
      // Look for style-related content
      const lines = document.content.split('\n');
      const styleLines: string[] = [];

      for (const line of lines) {
        if (/style|tone|format|writing|language|voice/i.test(line)) {
          styleLines.push(line.trim());
        }
      }

      // If style content found, return it; otherwise return description
      if (styleLines.length > 0) {
        return styleLines.join('\n');
      }
      
      return document.description || '';
    } catch (error) {
      logger.error({
        message: 'Failed to extract style guide',
        error,
      });
      throw error;
    }
  }

  /**
   * Apply style guide to note
   */
  async applyStyleGuide(note: string, _styleGuide: string): Promise<string> {
    try {
      // In production, this would use AI to rewrite the note
      // For now, return the note as-is with a note about style guide
      return note;
    } catch (error) {
      logger.error({
        message: 'Failed to apply style guide',
        error,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const policyIntegrationService = new PolicyIntegrationService();

export default policyIntegrationService;
