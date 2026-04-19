import type { Lead, LeadStatus } from '@/types/lead';

// In-memory store for MVP — replace with a real database later
const leads: Lead[] = [
  {
    id: 'lead-001',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'חדש',
    initialResult: 'positive',
    fullName: 'ישראל ישראלי',
    phone: '050-1234567',
    email: 'israel@example.com',
    notes: 'עבדתי בשני מקומות עבודה ב-2023',
    uploadedDocuments: [
      {
        id: 'doc-001',
        leadId: 'lead-001',
        fileName: '106_2023.pdf',
        fileSize: 245000,
        fileType: 'application/pdf',
        detectedYear: 2023,
        uploadDate: new Date().toISOString(),
        category: 'form106',
      },
      {
        id: 'doc-002',
        leadId: 'lead-001',
        fileName: '106_2022.pdf',
        fileSize: 198000,
        fileType: 'application/pdf',
        detectedYear: 2022,
        uploadDate: new Date().toISOString(),
        category: 'form106',
      },
    ],
  },
  {
    id: 'lead-002',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: 'ממתין לבדיקה',
    initialResult: 'review',
    fullName: 'שרה כהן',
    phone: '052-9876543',
    email: 'sara@example.com',
    uploadedDocuments: [
      {
        id: 'doc-003',
        leadId: 'lead-002',
        fileName: '106_2023_sara.pdf',
        fileSize: 312000,
        fileType: 'application/pdf',
        detectedYear: 2023,
        uploadDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        category: 'form106',
      },
    ],
  },
  {
    id: 'lead-003',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: 'נבדק',
    initialResult: 'insufficient',
    fullName: 'דוד לוי',
    phone: '054-1112233',
    email: 'david@example.com',
    notes: '',
    uploadedDocuments: [],
    internalNotes: 'בדיקה ראשונית בוצעה — לא נמצאו אינדיקציות',
  },
];

export function getLeads(): Lead[] {
  return [...leads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getLeadById(id: string): Lead | undefined {
  return leads.find((l) => l.id === id);
}

export function createLead(data: Omit<Lead, 'id' | 'createdAt' | 'status'>): Lead {
  const lead: Lead = {
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'חדש',
    ...data,
  };
  leads.push(lead);
  return lead;
}

export function updateLeadStatus(id: string, status: LeadStatus): Lead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.status = status;
  return lead;
}

export function updateLeadInternalNotes(id: string, notes: string): Lead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.internalNotes = notes;
  return lead;
}
