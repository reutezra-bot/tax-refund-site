import { NextRequest, NextResponse } from 'next/server';
import { createLead } from '@/lib/mock-data';
import { sendLeadNotification } from '@/lib/email';
import type { UploadedDocument } from '@/types/documents';
import type { InitialResultType } from '@/types/lead';
import type { CaseResult } from '@/types/case';
import type { YearAnswerEntry } from '@/lib/actions';

// POST /api/submit-lead
// Alternative to server action — useful if a non-Next.js client calls the API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      fullName,
      phone,
      email,
      notes,
      initialResult,
      uploadedDocuments,
      result,
      yearAnswers,
    } = body as {
      fullName: string;
      phone: string;
      email: string;
      notes?: string;
      initialResult: InitialResultType;
      uploadedDocuments: UploadedDocument[];
      result: CaseResult;
      yearAnswers: YearAnswerEntry[];
    };

    if (!fullName || !phone || !email || !initialResult || !result) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const lead = createLead({
      fullName,
      phone,
      email,
      notes,
      initialResult,
      uploadedDocuments,
    });

    await sendLeadNotification(lead, result, yearAnswers ?? []);

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error('[API /submit-lead]', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
