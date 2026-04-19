'use client';

import type { Form106ExtractedData } from '@/lib/form106-parser';
import type { UploadedDocument } from '@/types/documents';

interface Props {
  documents: UploadedDocument[];
  parsedForms: Form106ExtractedData[];
  sourceDocumentIds: string[];
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-b border-yellow-200 last:border-0">
      <td className="py-1 pr-3 text-yellow-800 font-mono text-xs whitespace-nowrap">{label}</td>
      <td className="py-1 text-yellow-950 font-mono text-xs font-semibold">{value ?? <span className="text-yellow-400">null</span>}</td>
    </tr>
  );
}

export default function Form106DebugPanel({ documents, parsedForms, sourceDocumentIds }: Props) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <details className="mt-6 border-2 border-dashed border-yellow-400 rounded-xl bg-yellow-50 text-right" open>
      <summary className="px-4 py-2 cursor-pointer text-xs font-bold text-yellow-800 select-none">
        🛠 DEV — Form 106 Debug Panel (real AI extraction via Claude API)
      </summary>

      <div className="px-4 pb-4 space-y-4">
        <p className="text-xs text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-3 py-2">
          🛠 ערכים אלה חולצו מהטופס האמיתי באמצעות Claude API. אמת אותם מול הטופס שהועלה.
        </p>

        <div className="text-xs text-yellow-700 font-mono">
          <span className="font-bold">sourceDocumentIds:</span>{' '}
          {sourceDocumentIds.length === 0 ? '(empty)' : sourceDocumentIds.join(', ')}
        </div>

        {parsedForms.map((form, i) => {
          const doc = documents[i];
          const docIdMatch = doc ? sourceDocumentIds.includes(doc.id) : false;

          return (
            <div key={i} className="rounded-lg border border-yellow-300 bg-white overflow-hidden">
              <div className="bg-yellow-200 px-3 py-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-900">
                  טופס #{i + 1} — {doc?.fileName ?? 'unknown'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${docIdMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  id: {doc?.id ?? '?'} {docIdMatch ? '✓' : '✗ mismatch'}
                </span>
              </div>

              <table className="w-full px-3 py-2">
                <tbody className="divide-y divide-yellow-100">
                  <Row label="taxYear" value={form.taxYear} />
                  <Row label="annualTaxableIncome" value={form.annualTaxableIncome?.toLocaleString('he-IL') ?? null} />
                  <Row label="actualTaxWithheld" value={form.actualTaxWithheld?.toLocaleString('he-IL') ?? null} />
                  <Row label="annualTaxCreditPoints" value={form.annualTaxCreditPoints} />
                  <Row label="workDays" value={form.workDays} />
                  <Row label="priorYearDiffs" value={form.priorYearDifferencesIncluded ? `yes — ${form.priorYearDifferencesAmount ?? 'amount unknown'}` : 'no'} />
                  <Row label="section45ACredit" value={form.section45ACredit?.toLocaleString('he-IL') ?? null} />
                  <Row label="lifeInsuranceDeduction" value={form.lifeInsuranceDeduction?.toLocaleString('he-IL') ?? null} />
                  <Row label="pensionEmployee" value={form.pensionContributionsEmployee?.toLocaleString('he-IL') ?? null} />
                  <Row label="nationalInsuranceDeduction" value={form.nationalInsuranceDeduction?.toLocaleString('he-IL') ?? null} />
                  <Row label="extractionConfidence" value={`${(form.extractionConfidence * 100).toFixed(0)}%`} />
                  {form.extractionWarnings.length > 0 && (
                    <Row
                      label="warnings"
                      value={
                        <ul className="list-disc list-inside space-y-0.5">
                          {form.extractionWarnings.map((w, wi) => (
                            <li key={wi}>{w}</li>
                          ))}
                        </ul>
                      }
                    />
                  )}
                </tbody>
              </table>
            </div>
          );
        })}

        {parsedForms.length === 0 && (
          <p className="text-xs text-yellow-600 italic">אין נתוני חילוץ — הטפסים לא עברו ניתוח AI, או שהניתוח נכשל.</p>
        )}
      </div>
    </details>
  );
}
