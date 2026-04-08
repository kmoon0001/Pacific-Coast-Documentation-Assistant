export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: boolean;
  allowInteraction?: boolean;
}

export const tourSteps: TourStep[] = [
  // Welcome & Overview
  {
    id: 'welcome',
    title: 'Welcome to TheraDoc! 👋',
    content:
      'Let me show you around! TheraDoc helps you generate compliant therapy documentation quickly and efficiently. This tour will take about 5 minutes.',
    target: 'body',
    position: 'center',
    highlight: false,
  },
  {
    id: 'overview',
    title: 'Three Main Areas',
    content:
      'TheraDoc has three main sections: the sidebar for history and settings (left), the main workflow area (center), and the preview panel (right).',
    target: 'body',
    position: 'center',
    highlight: false,
  },

  // Sidebar Tour
  {
    id: 'sidebar-history',
    title: 'Note History',
    content:
      'Your recently generated notes are saved here. Click any note to view or copy it. Notes are stored locally for your privacy.',
    target: '[data-tour="history"]',
    position: 'right',
    highlight: true,
  },
  {
    id: 'sidebar-clipboard',
    title: 'Clipboard Manager',
    content:
      'Save frequently used text snippets here for quick access. Perfect for common phrases or templates you use often.',
    target: '[data-tour="clipboard"]',
    position: 'right',
    highlight: true,
  },
  {
    id: 'sidebar-local-mode',
    title: 'Local Mode',
    content:
      'Enable Local Mode to run AI processing on your device for maximum privacy. Your data never leaves your computer!',
    target: '[data-tour="local-mode"]',
    position: 'right',
    highlight: true,
  },

  // Main Workflow
  {
    id: 'discipline-step',
    title: 'Step 1: Choose Discipline',
    content:
      'Start by selecting your therapy discipline: Physical Therapy (PT), Occupational Therapy (OT), or Speech Therapy (ST).',
    target: '[data-tour="discipline"]',
    position: 'bottom',
    highlight: true,
    allowInteraction: true,
  },
  {
    id: 'document-type',
    title: 'Step 2: Document Type',
    content:
      'Select the type of note you need: Daily Note, Progress Note, Assessment, Discharge Summary, or Recertification.',
    target: '[data-tour="document-type"]',
    position: 'bottom',
    highlight: true,
    allowInteraction: true,
  },
  {
    id: 'cpt-code',
    title: 'Step 3: CPT Code',
    content:
      'Choose the appropriate CPT code for your session. The codes are organized by discipline and treatment type.',
    target: '[data-tour="cpt-code"]',
    position: 'bottom',
    highlight: true,
    allowInteraction: true,
  },
  {
    id: 'icd10-codes',
    title: 'Step 4: ICD-10 Codes',
    content:
      'Select relevant ICD-10 diagnosis codes. You can search by code or description, and add multiple codes.',
    target: '[data-tour="icd10"]',
    position: 'bottom',
    highlight: true,
    allowInteraction: true,
  },
  {
    id: 'mode-activity',
    title: 'Step 5: Mode & Activity',
    content:
      'Select the treatment mode and specific activities performed during the session. These help generate accurate documentation.',
    target: '[data-tour="mode"]',
    position: 'bottom',
    highlight: true,
    allowInteraction: true,
  },

  // Details Step
  {
    id: 'details-intro',
    title: 'Step 6: Session Details',
    content:
      'Now add the specific details of your therapy session. You can use templates or enter custom information.',
    target: '[data-tour="details"]',
    position: 'top',
    highlight: true,
  },
  {
    id: 'brain-dump',
    title: 'Brain Dump Feature',
    content:
      'Type or dictate your session notes naturally. Our AI will extract the relevant information and structure it properly.',
    target: '[data-tour="brain-dump"]',
    position: 'top',
    highlight: true,
  },
  {
    id: 'templates',
    title: 'Use Templates',
    content:
      'Save time with pre-built templates. You can also create and save your own custom templates for frequently used scenarios.',
    target: '[data-tour="templates"]',
    position: 'top',
    highlight: true,
  },
  {
    id: 'gap-analysis',
    title: 'Gap Analysis',
    content:
      'Click "Analyze Gaps" to identify missing information. The AI will suggest questions to ensure complete documentation.',
    target: '[data-tour="gap-analysis"]',
    position: 'top',
    highlight: true,
  },

  // Generation
  {
    id: 'generate-button',
    title: 'Generate Your Note',
    content:
      'Once you\'ve filled in the details, click "Generate Note" to create your compliant therapy documentation.',
    target: '[data-tour="generate"]',
    position: 'top',
    highlight: true,
  },

  // Preview Panel
  {
    id: 'preview-intro',
    title: 'Preview Panel',
    content:
      'Your generated note appears here. You can review, edit, and refine it before finalizing.',
    target: '[data-tour="preview"]',
    position: 'left',
    highlight: true,
  },
  {
    id: 'audit-score',
    title: 'Compliance Audit',
    content:
      'Every note is automatically audited for compliance. The score shows how well your note meets documentation standards.',
    target: '[data-tour="audit"]',
    position: 'left',
    highlight: true,
  },
  {
    id: 'edit-note',
    title: 'Edit & Refine',
    content:
      'Click "Edit" to make manual changes, or use "Tumble" to have AI refine specific aspects of your note.',
    target: '[data-tour="edit"]',
    position: 'left',
    highlight: true,
  },
  {
    id: 'tumble-feature',
    title: 'Tumble (AI Refinement)',
    content:
      'Tumble lets you refine your note with AI. Give instructions like "make it more concise" or "add more detail about progress".',
    target: '[data-tour="tumble"]',
    position: 'left',
    highlight: true,
  },
  {
    id: 'copy-export',
    title: 'Copy & Export',
    content:
      'Copy your note to clipboard or export it in various formats. Your note is ready to paste into your EMR system.',
    target: '[data-tour="copy"]',
    position: 'left',
    highlight: true,
  },

  // Advanced Features
  {
    id: 'style-settings',
    title: 'Personalize Your Style',
    content:
      'Customize how notes are written to match your personal style. The AI learns from your examples.',
    target: '[data-tour="style-settings"]',
    position: 'right',
    highlight: true,
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    content:
      'Speed up your workflow with keyboard shortcuts: Ctrl+Enter to advance steps, Ctrl+G to generate, Ctrl+A to audit.',
    target: 'body',
    position: 'center',
    highlight: false,
  },

  // Finish
  {
    id: 'finish',
    title: "You're All Set! 🎉",
    content:
      'You now know how to use TheraDoc! Start generating compliant therapy documentation in minutes. You can restart this tour anytime from the settings.',
    target: 'body',
    position: 'center',
    highlight: false,
  },
];
