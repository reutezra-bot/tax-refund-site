'use server';

import { createLead } from '@/lib/mock-data';
import { sendLeadNotification } from '@/lib/email';
import type { UploadedDocument } from '@/types/documents';
import type { InitialResultType } from '@/types/lead';
import type { RefundRange } from '@/types/case';

interface SubmitLeadInput {
  fullName: string;
  phone: string;
  email: string;
  notes?: string;
  initialResult: InitialResultType;
  refundRange?: RefundRange;
  uploadedDocuments: UploadedDocument[];
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

    await sendLeadNotification(lead, input.refundRange);

    return { success: true, leadId: lead.id };
  } catch (err) {
    console.error('[submitLead] error:', err);
    return { success: false, error: 'שגיאה בשמירת הפרטים. נסו שוב.' };
  }
}
