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

    console.log('[submitLead] docs received:', input.uploadedDocuments.map(d => ({
      name: d.fileName,
      hasBase64: !!d.fileBase64,
      base64Len: d.fileBase64?.length ?? 0,
    })));

    const emailResult = await sendLeadNotification(lead, input.refundRange);
    if (!emailResult.success) {
      console.error('[submitLead] email failed:', emailResult);
    }

    return { success: true, leadId: lead.id };
  } catch (err) {
    console.error('[submitLead] error:', err);
    return { success: false, error: 'שגיאה בשמירת הפרטים. נסו שוב.' };
  }
}
