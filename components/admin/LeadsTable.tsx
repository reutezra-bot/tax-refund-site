import Link from 'next/link';
import type { Lead } from '@/types/lead';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';

interface LeadsTableProps {
  leads: Lead[];
}

export default function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p>אין לידים עדיין</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/admin/leads/${lead.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-semibold text-slate-900">{lead.fullName}</span>
              <StatusBadge type="status" value={lead.status} />
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              <span>{lead.phone}</span>
              <span>·</span>
              <span>{formatDate(lead.createdAt)}</span>
            </div>
            <div className="mt-2">
              <StatusBadge type="result" value={lead.initialResult} />
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-right px-4 py-3 font-semibold text-slate-600">שם</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">טלפון</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">אימייל</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">תאריך</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">תוצאה ראשונית</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">סטטוס</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="bg-white hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{lead.fullName}</td>
                <td className="px-4 py-3 text-slate-600" dir="ltr">{lead.phone}</td>
                <td className="px-4 py-3 text-slate-600" dir="ltr">{lead.email}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(lead.createdAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge type="result" value={lead.initialResult} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge type="status" value={lead.status} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="text-blue-700 hover:text-blue-900 font-medium"
                  >
                    פרטים
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
