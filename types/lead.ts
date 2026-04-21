import type { UploadedDocument } from './documents';

export type LeadStatus =
  | 'חדש'
  | 'ממתין לבדיקה'
  | 'נבדק'
  | 'חסר מסמכים'
  | 'רלוונטי להמשך טיפול'
  | 'לא רלוונטי'
  | 'טופל';

export type InitialResultType = 'potential_refund' | 'needs_review' | 'no_clear_indication';

export interface Lead {
  id: string;
  createdAt: string;
  status: LeadStatus;
  initialResult: InitialResultType;
  fullName: string;
  phone: string;
  email: string;
  notes?: string;
  uploadedDocuments?: UploadedDocument[];
  internalNotes?: string;
}
