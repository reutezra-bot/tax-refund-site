import { getLeads } from '@/lib/mock-data';
import LeadsTable from '@/components/admin/LeadsTable';

export const dynamic = 'force-dynamic';

export default function AdminLeadsPage() {
  const leads = getLeads();

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'חדש').length,
    positive: leads.filter((l) => l.initialResult === 'potential_refund').length,
    pending: leads.filter((l) => l.status === 'ממתין לבדיקה').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">לידים</h1>
          <p className="text-slate-500 text-sm mt-0.5">סך הכל {stats.total} לידים</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'סה"כ לידים', value: stats.total, color: 'text-slate-800' },
          { label: 'חדשים', value: stats.new, color: 'text-blue-700' },
          { label: 'אינדיקציה חיובית', value: stats.positive, color: 'text-emerald-700' },
          { label: 'ממתינים לבדיקה', value: stats.pending, color: 'text-amber-700' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm"
          >
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <LeadsTable leads={leads} />
    </div>
  );
}
