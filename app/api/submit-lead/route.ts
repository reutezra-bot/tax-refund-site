import { NextRequest, NextResponse } from 'next/server';
import { createLead } from '@/lib/mock-data';
import { sendLeadNotification } from '@/lib/email';
import type { UploadedDocument } from '@/types/documents';
import type { InitialResultType } from '@/types/lead';

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
    } = body as {
      fullName: string;
      phone: string;
      email: string;
      notes?: string;
      initialResult: InitialResultType;
      uploadedDocuments: UploadedDocument[];
    };

    if (!fullName || !phone || !email || !initialResult) {
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

    await sendLeadNotification(lead);

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error('[API /submit-lead]', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
