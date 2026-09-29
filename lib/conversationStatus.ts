import { ConversationStatus } from '@/types/database';

export const STATUS_LABELS: Record<ConversationStatus, string> = {
  ai_active: 'AI handling',
  needs_human: 'Needs a human',
  staff_handling: 'Staff handling',
  resolved: 'Resolved',
};

export const STATUS_CLASSES: Record<ConversationStatus, string> = {
  ai_active: 'bg-slate-100 text-slate-700',
  needs_human: 'bg-amber-100 text-amber-800',
  staff_handling: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
};
