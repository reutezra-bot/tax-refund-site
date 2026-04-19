import type { UploadedDocument } from './documents';

export type LeadStatus =
  | 'חדש'
  | 'ממתין לבדיקה'
  | 'נבדק'
  | 'חסר מסמכים'
  | 'רלוונטי להמשך טיפול'
  | 'לא רלוונטי'
  | 'טופל';

export type InitialResultType = 'positive' | 'review' | 'insufficient';

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
