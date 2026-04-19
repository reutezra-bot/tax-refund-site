import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/document/extract-text';
import { extractForm106FromText } from '@/lib/document/form106-extraction';
import { validateForm106 } from '@/lib/document/form106-validation';

// Force Node.js runtime. Mistral OCR on large PDFs can take 30–50 s.
export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/extract-form106
// Body: FormData with `file` (File) field
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Missing file field' }, { status: 400 });
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return NextResponse.json(
      { ok: false, error: `Unsupported file type: ${file.type}` },
      { status: 400 },
    );
  }

  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ ok: false, error: 'File exceeds 10 MB limit' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Step 1: extract text via Mistral OCR (handles PDFs and images)
  const extracted = await extractTextFromFile(buffer, file.type, file.name);

  // Step 2: rule-based field extraction
 const outcome = extractForm106FromText(extracted, file.name, 2023);

  if (!outcome.ok) {
    return NextResponse.json({ ok: false, error: outcome.reason }, { status: 500 });
  }

  // Step 3: validate plausibility
  const validation = validateForm106(outcome.data);
  const data = {
    ...outcome.data,
    extractionWarnings: [
      ...outcome.data.extractionWarnings,
      ...validation.warnings,
      // Append critical errors as warnings so the UI can surface them
      ...validation.criticalErrors,
    ],
    // Clamp confidence if critical fields are missing
    extractionConfidence: validation.isUsable
      ? outcome.data.extractionConfidence
      : Math.min(outcome.data.extractionConfidence, 0.35),
  };

  return NextResponse.json({ ok: true, data, isUsable: validation.isUsable });
}
