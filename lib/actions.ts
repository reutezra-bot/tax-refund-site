'use server';

import { createLead } from '@/lib/mock-data';
import { sendLeadNotification } from '@/lib/email';
import type { UploadedDocument } from '@/types/documents';
import type { InitialResultType } from '@/types/lead';

interface SubmitLeadInput {
  fullName: string;
  phone: string;
  email: string;
  notes?: string;
  initialResult: InitialResultType;
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

    await sendLeadNotification(lead);

    return { success: true, leadId: lead.id };
  } catch (err) {
    console.error('[submitLead] error:', err);
    return { success: false, error: 'שגיאה בשמירת הפרטים. נסו שוב.' };
  }
}
