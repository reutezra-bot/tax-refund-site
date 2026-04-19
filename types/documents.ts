import type { Form106ExtractedData } from '@/lib/form106-parser';

export type DocumentCategory = 'form106' | 'other';

export interface UploadedDocument {
  id: string;
  tempSessionId?: string;
  leadId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  detectedYear?: number;
  uploadDate: string;
  category: DocumentCategory;
  /** Real extracted Form 106 data from AI extraction. Absent if extraction failed or not yet run. */
  form106Data?: Form106ExtractedData;
  /** True while extraction is in progress (client-only, not persisted). */
  extracting?: boolean;
  /** Error message if extraction failed. */
  extractionError?: string;
}
