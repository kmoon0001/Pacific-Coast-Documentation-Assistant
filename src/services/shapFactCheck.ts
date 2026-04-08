/**
 * SHAP-Inspired Fact-Checking Service
 *
 * Provides interpretable AI explanations using SHAP (SHapley Additive exPlanations) concepts:
 * - Feature Attribution: Which input features most influenced the output
 * - Counterfactual Analysis: What would need to change for different results
 * - Consistency Verification: Cross-check generated content against source data
 * - Confidence Scoring: Assess reliability based on input completeness
 */

import { TherapyState, AuditResult } from '../types';

// Feature importance weights for different input fields
const FEATURE_WEIGHTS: Record<string, number> = {
  discipline: 0.15,
  documentType: 0.12,
  cptCode: 0.18,
  mode: 0.08,
  activity: 0.15,
  details: 0.2,
  reasonForReferral: 0.05,
  clinicalImpressions: 0.04,
  gapAnswers: 0.03,
};

export interface FactCheckResult {
  isValid: boolean;
  confidenceScore: number;
  featureAttributions: FeatureAttribution[];
  consistencyChecks: ConsistencyCheck[];
  warnings: string[];
  recommendations: string[];
  counterfactualAnalysis?: CounterfactualAnalysis;
}

export interface FeatureAttribution {
  feature: string;
  importance: number;
  contribution: string;
  value?: string;
}

export interface ConsistencyCheck {
  id: string;
  passed: boolean;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  details?: string;
}

export interface CounterfactualAnalysis {
  whatIf: string;
  currentValue: string;
  suggestedChange: string;
  expectedImpact: string;
}

/**
 * Calculate feature attributions based on input state
 * Uses SHAP-inspired additive feature contribution
 */
function calculateFeatureAttributions(state: TherapyState): FeatureAttribution[] {
  const attributions: FeatureAttribution[] = [];

  // Discipline attribution
  if (state.discipline) {
    const importance = FEATURE_WEIGHTS.discipline * 100;
    attributions.push({
      feature: 'Discipline',
      importance,
      contribution: `Sets clinical context for ${state.discipline} specific interventions`,
      value: state.discipline,
    });
  }

  // Document Type attribution
  if (state.documentType) {
    const importance = FEATURE_WEIGHTS.documentType * 100;
    attributions.push({
      feature: 'Document Type',
      importance,
      contribution: `Determines note structure for ${state.documentType} documentation`,
      value: state.documentType,
    });
  }

  // CPT Code attribution (most important for billing)
  if (state.cptCode) {
    const importance = FEATURE_WEIGHTS.cptCode * 100;
    attributions.push({
      feature: 'CPT Code',
      importance,
      contribution: `Directly justifies billing unit ${state.cptCode}`,
      value: state.cptCode,
    });
  }

  // Activity attribution
  if (state.activity) {
    const importance = FEATURE_WEIGHTS.activity * 100;
    attributions.push({
      feature: 'Activity',
      importance,
      contribution: `Defines specific therapeutic intervention performed`,
      value: state.activity,
    });
  }

  // Details attribution
  if (state.details && Object.keys(state.details).length > 0) {
    const importance = FEATURE_WEIGHTS.details * 100;
    const detailKeys = Object.keys(state.details).slice(0, 3).join(', ');
    attributions.push({
      feature: 'Details',
      importance,
      contribution: `Provides specific measurements and clinical data: ${detailKeys}...`,
      value: `${Object.keys(state.details).length} fields`,
    });
  }

  // Mode attribution
  if (state.mode) {
    const importance = FEATURE_WEIGHTS.mode * 100;
    attributions.push({
      feature: 'Treatment Mode',
      importance,
      contribution: `Sets treatment approach: ${state.mode}`,
      value: state.mode,
    });
  }

  // Gap answers attribution
  if (state.gapAnswers && state.gapAnswers.length > 0) {
    const importance = FEATURE_WEIGHTS.gapAnswers * 100;
    attributions.push({
      feature: 'Gap Analysis',
      importance,
      contribution: 'Addresses critical missing information',
      value: `${state.gapAnswers.length} responses`,
    });
  }

  return attributions.sort((a, b) => b.importance - a.importance);
}

/**
 * Perform consistency checks between input state and generated content
 */
function performConsistencyChecks(
  state: TherapyState,
  generatedContent: string
): ConsistencyCheck[] {
  const checks: ConsistencyCheck[] = [];
  const content = generatedContent.toLowerCase();

  // Check 1: Discipline consistency
  if (state.discipline) {
    const disciplineTerms: Record<string, string[]> = {
      PT: [
        'mobility',
        'gait',
        'therapeutic exercise',
        'transfer',
        'balance',
        'range of motion',
        'strength',
      ],
      OT: ['adl', 'adls', 'self-care', 'occupation', 'functional', 'cognitive', 'adapting'],
      ST: ['speech', 'language', 'swallow', 'communication', 'cognitive-linguistic'],
    };

    const terms = disciplineTerms[state.discipline] || [];
    const foundTerms = terms.filter((term) => content.includes(term));

    checks.push({
      id: 'discipline_consistency',
      passed: foundTerms.length > 0,
      description: `Discipline-specific terminology present (${state.discipline})`,
      severity: foundTerms.length > 0 ? 'info' : 'critical',
      details:
        foundTerms.length > 0
          ? `Found: ${foundTerms.join(', ')}`
          : `Expected ${state.discipline} terminology not found in generated note`,
    });
  }

  // Check 2: CPT Code mention
  if (state.cptCode) {
    const cptMentioned = content.includes(state.cptCode);
    checks.push({
      id: 'cpt_mention',
      passed: cptMentioned,
      description: `CPT Code ${state.cptCode} referenced in note`,
      severity: cptMentioned ? 'info' : 'warning',
      details: cptMentioned
        ? 'CPT code properly included in documentation'
        : 'CPT code not found in generated note - may need manual addition',
    });
  }

  // Check 3: Activity alignment
  if (state.activity) {
    const activityKeywords = state.activity.toLowerCase().split(' ');
    const hasActivityRef = activityKeywords.some((kw) => kw.length > 3 && content.includes(kw));
    checks.push({
      id: 'activity_alignment',
      passed: hasActivityRef,
      description: 'Activity/Intervention mentioned in note',
      severity: hasActivityRef ? 'info' : 'warning',
      details: hasActivityRef
        ? 'Generated note includes activity details'
        : 'Activity from input not clearly reflected in output',
    });
  }

  // Check 4: Document type structure
  if (state.documentType) {
    const structureChecks: Record<
      string,
      { required: string[]; severity: 'critical' | 'warning' }
    > = {
      Daily: { required: ['intervention', 'response'], severity: 'warning' },
      Progress: { required: ['progress', 'goal'], severity: 'warning' },
      Assessment: { required: ['assessment', 'finding'], severity: 'critical' },
      Discharge: { required: ['discharge', 'recommendation'], severity: 'critical' },
      Recertification: { required: ['continued', 'plan'], severity: 'critical' },
    };

    const required = structureChecks[state.documentType]?.required || [];
    const found = required.filter((term) => content.includes(term));

    checks.push({
      id: 'document_structure',
      passed: found.length >= required.length / 2,
      description: `${state.documentType} note structure requirements`,
      severity: structureChecks[state.documentType]?.severity || 'warning',
      details: `Found ${found.length}/${required.length} expected sections`,
    });
  }

  // Check 5: Details completeness
  const detailCount = Object.keys(state.details || {}).filter(
    (k) => state.details[k] !== undefined && state.details[k] !== ''
  ).length;

  checks.push({
    id: 'detail_completeness',
    passed: detailCount >= 3,
    description: 'Input detail fields provided',
    severity: detailCount >= 3 ? 'info' : 'warning',
    details: `${detailCount} detail fields filled (recommended: 3+)`,
  });

  return checks;
}

/**
 * Calculate overall confidence score based on input quality
 */
function calculateConfidenceScore(state: TherapyState, checks: ConsistencyCheck[]): number {
  let score = 50; // Base score

  // Add points for filled fields
  if (state.discipline) score += 10;
  if (state.documentType) score += 8;
  if (state.cptCode) score += 12;
  if (state.activity) score += 10;
  if (state.mode) score += 5;

  const detailCount = Object.keys(state.details || {}).filter(
    (k) => state.details[k] !== undefined && state.details[k] !== ''
  ).length;
  score += Math.min(detailCount * 3, 15); // Up to 15 points for details

  // Consistency check bonus/penalty
  const passedChecks = checks.filter((c) => c.passed).length;
  const checkScore = (passedChecks / checks.length) * 20;
  score += checkScore;

  return Math.min(Math.round(score), 100);
}

/**
 * Generate counterfactual analysis
 */
function generateCounterfactualAnalysis(state: TherapyState): CounterfactualAnalysis | undefined {
  const missingFields: string[] = [];

  if (!state.cptCode) missingFields.push('CPT Code');
  if (!state.activity) missingFields.push('Activity');
  if (!state.mode) missingFields.push('Treatment Mode');
  if (Object.keys(state.details || {}).length < 3) missingFields.push('Additional Details');

  if (missingFields.length === 0) return undefined;

  return {
    whatIf: `Add missing: ${missingFields.join(', ')}`,
    currentValue: 'Current input has gaps',
    suggestedChange: missingFields.join('; '),
    expectedImpact: 'Would increase confidence score by ~15-25% and improve note accuracy',
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  state: TherapyState,
  checks: ConsistencyCheck[],
  confidenceScore: number
): string[] {
  const recommendations: string[] = [];

  // Based on confidence score
  if (confidenceScore < 60) {
    recommendations.push('Add more clinical details to improve note accuracy');
  }
  if (confidenceScore < 80) {
    recommendations.push('Consider adding gap analysis responses for Medicare compliance');
  }

  // Based on failed checks
  const failedCritical = checks.filter((c) => !c.passed && c.severity === 'critical');
  if (failedCritical.length > 0) {
    recommendations.push(`Address ${failedCritical.length} critical issue(s) before finalizing`);
  }

  // Based on missing fields
  if (!state.cptCode) {
    recommendations.push('Select a CPT code to ensure proper billing');
  }
  if (!state.activity) {
    recommendations.push('Specify the therapeutic activity performed');
  }

  // Positive reinforcement
  if (confidenceScore >= 85 && failedCritical.length === 0) {
    recommendations.push('Note is well-supported with high confidence');
  }

  return recommendations;
}

/**
 * Main fact-checking function - validates generated content against input state
 */
export function factCheckNote(state: TherapyState, generatedContent: string): FactCheckResult {
  // Calculate feature attributions
  const featureAttributions = calculateFeatureAttributions(state);

  // Perform consistency checks
  const consistencyChecks = performConsistencyChecks(state, generatedContent);

  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(state, consistencyChecks);

  // Generate counterfactual analysis
  const counterfactualAnalysis = generateCounterfactualAnalysis(state);

  // Generate recommendations
  const recommendations = generateRecommendations(state, consistencyChecks, confidenceScore);

  // Determine overall validity
  const criticalFailures = consistencyChecks.filter((c) => !c.passed && c.severity === 'critical');

  return {
    isValid: criticalFailures.length === 0,
    confidenceScore,
    featureAttributions,
    consistencyChecks,
    warnings: consistencyChecks
      .filter((c) => !c.passed && c.severity === 'warning')
      .map((c) => c.description),
    recommendations,
    counterfactualAnalysis,
  };
}

/**
 * Quick fact-check for input validation (before generation)
 */
export function validateInputState(state: TherapyState): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (!state.discipline) missingFields.push('Discipline');
  if (!state.documentType) missingFields.push('Document Type');
  if (!state.cptCode) {
    missingFields.push('CPT Code');
  } else {
    // Validate CPT code format
    if (!/^\d{5}$/.test(state.cptCode)) {
      warnings.push('CPT code should be 5 digits');
    }
  }
  if (!state.activity) missingFields.push('Activity');

  if (Object.keys(state.details || {}).length < 2) {
    warnings.push('Consider adding more clinical details');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Enhance audit result with SHAP-style explanations
 */
export function enhanceAuditWithSHAP(
  auditResult: AuditResult,
  state: TherapyState
): AuditResult & { shapAnalysis: FactCheckResult } {
  const mockContent = auditResult.checklist
    ? Object.entries(auditResult.checklist)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' ')
    : '';

  const shapAnalysis = factCheckNote(state, mockContent);

  return {
    ...auditResult,
    shapAnalysis,
  };
}

/**
 * Get feature importance summary for display
 */
export function getFeatureImportanceSummary(attributions: FeatureAttribution[]): string {
  const top3 = attributions.slice(0, 3);
  return top3.map((a) => `${a.feature} (${Math.round(a.importance)}%)`).join(' → ');
}
