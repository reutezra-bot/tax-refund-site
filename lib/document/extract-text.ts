/**
 * Text extraction layer.
 *
 * Strategy:
 * 1) For native PDFs — try extracting text with pdf-parse first.
 * 2) If the PDF appears scanned / text is too short — try Mistral OCR if key exists.
 * 3) For image files — use Mistral OCR if key exists.
 */



export interface ExtractedTextResult {
  text: string;
  pageCount: number;
  /** True when the file is a raster image — no native text layer. */
  isImageFile: boolean;
  /**
   * True when OCR was not attempted or returned fewer than 150 meaningful
   * characters. Callers should not run field-extraction on such results.
   */
  isLikelyScanned: boolean;
  /** True when text came from OCR rather than a native PDF text layer. */
  wasOCR: boolean;
}

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MIN_TEXT_LENGTH = 150;

const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr';
const MISTRAL_OCR_MODEL = 'mistral-ocr-latest';



// ── Mistral API types ─────────────────────────────────────────────────────────

interface MistralOCRPage {
  index: number;
  markdown: string;
}

interface MistralOCRResponse {
  pages: MistralOCRPage[];
}

// ── Text cleanup ──────────────────────────────────────────────────────────────

function countMeaningfulChars(text: string): number {
  return text.replace(/\s+/g, '').length;
}

/**
 * Strip markdown table pipes and heading markers so that the downstream
 * regex field-extraction patterns work reliably on OCR output.
 */
function cleanMistralText(markdown: string): string {
  return markdown
    .replace(/\|/g, ' ')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*{1,3}/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .trim();
}

/**
 * Basic cleanup for native PDF text.
 */
function cleanNativePdfText(text: string): string {
  return text
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Native PDF extraction ─────────────────────────────────────────────────────

async function extractNativePdfText(
  buffer: Buffer,
): Promise<{ text: string; pageCount: number }> {
  const pdfParse = require('pdf-parse-debugging-disabled') as (
    buf: Buffer,
  ) => Promise<{ text: string; numpages: number }>;

  const result = await pdfParse(buffer);

  return {
    text: cleanNativePdfText(result.text ?? ''),
    pageCount: result.numpages || 1,
  };
}

// ── Mistral OCR call ──────────────────────────────────────────────────────────

async function callMistralOCR(
  buffer: Buffer,
  fileType: string,
  fileName: string,
  apiKey: string,
): Promise<{ text: string; pageCount: number }> {
  const type = fileType.toLowerCase();
  const base64 = buffer.toString('base64');

  let document: Record<string, string>;
  if (type === 'application/pdf') {
    document = {
      type: 'document_url',
      document_url: `data:application/pdf;base64,${base64}`,
      document_name: fileName,
    };
  } else {
    const mime = type === 'image/jpg' ? 'image/jpeg' : type;
    document = {
      type: 'image_url',
      image_url: `data:${mime};base64,${base64}`,
    };
  }

  const response = await fetch(MISTRAL_OCR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MISTRAL_OCR_MODEL, document }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mistral OCR HTTP ${response.status}: ${body.substring(0, 300)}`);
  }

  const result = (await response.json()) as MistralOCRResponse;
  const pages = Array.isArray(result.pages) ? result.pages : [];

  const rawText = pages
    .sort((a, b) => a.index - b.index)
    .map((p) => p.markdown ?? '')
    .join('\n\n');

  return {
    text: cleanMistralText(rawText),
    pageCount: pages.length || 1,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function extractTextFromFile(
  buffer: Buffer,
  fileType: string,
  fileName = 'document',
): Promise<ExtractedTextResult> {
  const type = fileType.toLowerCase();
  const isImageFile = IMAGE_TYPES.has(type);
  const apiKey = process.env.MISTRAL_API_KEY;
console.log('[extract-text] V2 FILE IS RUNNING', { fileType, fileName });

  // 1) Native PDF path first
  if (type === 'application/pdf') {
    try {
      const native = await extractNativePdfText(buffer);
      const meaningful = countMeaningfulChars(native.text);

      if (meaningful >= MIN_TEXT_LENGTH) {
        console.log('[extract-text] Native PDF text extracted successfully');
        return {
          text: native.text,
          pageCount: native.pageCount,
          isImageFile: false,
          isLikelyScanned: false,
          wasOCR: false,
        };
      }

      console.warn(
        `[extract-text] Native PDF text too short (${meaningful} chars) — treating as scanned PDF`,
      );
    } catch (err) {
      console.warn(
        '[extract-text] Native PDF extraction failed:',
        err instanceof Error ? err.message : err,
      );
    }

    // 2) Fallback to OCR for scanned PDF
    if (!apiKey) {
      console.warn('[extract-text] Scanned PDF detected, but MISTRAL_API_KEY not set');
      return {
        text: '',
        pageCount: 0,
        isImageFile: false,
        isLikelyScanned: true,
        wasOCR: false,
      };
    }

    try {
      const { text, pageCount } = await callMistralOCR(buffer, type, fileName, apiKey);
      const meaningful = countMeaningfulChars(text);

      return {
        text,
        pageCount,
        isImageFile: false,
        isLikelyScanned: meaningful < MIN_TEXT_LENGTH,
        wasOCR: true,
      };
    } catch (err) {
      console.error('[extract-text] Mistral OCR failed:', err instanceof Error ? err.message : err);
      return {
        text: '',
        pageCount: 0,
        isImageFile: false,
        isLikelyScanned: true,
        wasOCR: false,
      };
    }
  }

  // 3) Image files require OCR
  if (isImageFile) {
    if (!apiKey) {
      console.warn('[extract-text] Image file uploaded, but MISTRAL_API_KEY not set — OCR unavailable');
      return {
        text: '',
        pageCount: 0,
        isImageFile: true,
        isLikelyScanned: true,
        wasOCR: false,
      };
    }

    try {
      const { text, pageCount } = await callMistralOCR(buffer, type, fileName, apiKey);
      const meaningful = countMeaningfulChars(text);

      return {
        text,
        pageCount,
        isImageFile: true,
        isLikelyScanned: meaningful < MIN_TEXT_LENGTH,
        wasOCR: true,
      };
    } catch (err) {
      console.error('[extract-text] Mistral OCR failed:', err instanceof Error ? err.message : err);
      return {
        text: '',
        pageCount: 0,
        isImageFile: true,
        isLikelyScanned: true,
        wasOCR: false,
      };
    }
  }

  // Unsupported file type
  console.warn(`[extract-text] Unsupported file type: ${fileType}`);
  return {
    text: '',
    pageCount: 0,
    isImageFile,
    isLikelyScanned: true,
    wasOCR: false,
  };
}