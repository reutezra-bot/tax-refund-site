'use server';

import { createLead } from '@/lib/mock-data';
import { sendLeadNotification } from '@/lib/email';
import type { UploadedDocument } from '@/types/documents';
import type { InitialResultType } from '@/types/lead';
import type { CaseResult, YearAnswers } from '@/types/case';

export interface YearAnswerEntry {
  year: number;
  answers: YearAnswers | null;
}

export interface SubmitLeadInput {
  fullName: string;
  phone: string;
  email: string;
  notes?: string;
  initialResult: InitialResultType;
  /** The full canonical result object — same object the UI rendered. */
  result: CaseResult;
  uploadedDocuments: UploadedDocument[];
  /** Year + questionnaire answers, one entry per tax year in the case. */
  yearAnswers: YearAnswerEntry[];
}

export async function submitLead(
  input: SubmitLeadInput,
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const lead = createLead({
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      notes: input.notes,
      initialResult: input.initialResult,
      uploadedDocuments: input.uploadedDocuments,
    });

    const emailResult = await sendLeadNotification(lead, input.result, input.yearAnswers);

    if (!emailResult.success) {
      console.error('[submitLead] email failed:', emailResult);
    }

    return { success: true, leadId: lead.id };
  } catch (err) {
    console.error('[submitLead] error:', err);
    return { success: false, error: 'שגיאה בשמירת הפרטים. נסו שוב.' };
  }
}
