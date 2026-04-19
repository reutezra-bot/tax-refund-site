import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLeadById } from '@/lib/mock-data';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatFileSize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const lead = getLeadById(id);

  if (!lead) notFound();

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        כל הלידים
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{lead.fullName}</h1>
          <p className="text-slate-500 text-sm mt-0.5">ליד #{lead.id} · {formatDate(lead.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge type="result" value={lead.initialResult} />
          <StatusBadge type="status" value={lead.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="font-bold text-slate-900 mb-4">פרטי קשר</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">שם מלא</span>
                <span className="font-medium text-slate-800">{lead.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">טלפון</span>
                <span className="font-medium text-slate-800" dir="ltr">{lead.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">אימייל</span>
                <span className="font-medium text-slate-800" dir="ltr">{lead.email}</span>
              </div>
              {lead.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">הערות הלקוח</p>
                  <p className="text-sm text-slate-700">{lead.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="font-bold text-slate-900 mb-4">
              מסמכים שהועלו ({lead.uploadedDocuments?.length ?? 0})
            </h2>
            {!lead.uploadedDocuments?.length ? (
              <p className="text-sm text-slate-400">לא הועלו מסמכים</p>
            ) : (
              <ul className="space-y-2">
                {lead.uploadedDocuments.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-xl px-4 py-2.5">
                    <span className="font-medium text-slate-700">{doc.fileName}</span>
                    <div className="flex gap-3 text-slate-400">
                      {doc.detectedYear && <span>{doc.detectedYear}</span>}
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="font-bold text-slate-900 mb-3">סטטוס</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">סטטוס נוכחי</span>
                <StatusBadge type="status" value={lead.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">תוצאה ראשונית</span>
                <StatusBadge type="result" value={lead.initialResult} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">תאריך הגשה</span>
                <span className="text-slate-700">{formatDate(lead.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Internal notes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="font-bold text-slate-900 mb-3">הערות פנימיות</h2>
            {lead.internalNotes ? (
              <p className="text-sm text-slate-700 leading-relaxed">{lead.internalNotes}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">אין הערות פנימיות</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-medium text-slate-800 text-left">{value}</span>
    </div>
  );
}


