'use client';

import { useState } from 'react';
import type { CaseResult } from '@/types/case';
import type { TaxYearUnit } from '@/types/case';

interface Props {
  result: CaseResult;
  years?: TaxYearUnit[];
}

const GATE_LABELS: Record<string, string> = {
  passed: '✅ עבר — מסמך מוכיח תשלום יתר',
  blocked_no_form: '🚫 אין טופס — לא הועלה מסמך',
  blocked_no_numeric_data: '🚫 חסרים שדות קריטיים (שדה 158 / שדה 42)',
  blocked_low_confidence: '🚫 ביטחון נמוך בחילוץ — מתחת לסף',
  blocked_no_refund_potential: '🚫 הטופס לא מצביע על תשלום ביתר מספיק',
};

const FIELD_LABELS: Record<string, string> = {
  taxYear: 'שנת מס',
  annualTaxableIncome: 'הכנסה חייבת (שדה 158)',
  actualTaxWithheld: 'מס שנוכה (שדה 42)',
  workDays: 'ימי עבודה (שדה 9)',
  annualTaxCreditPoints: 'נקודות זיכוי',
  section45ACredit: 'זיכוי סעיף 45א',
  lifeInsuranceDeduction: 'ניכוי ביטוח חיים (שדה 100)',
  pensionContributionsEmployee: 'הפרשות פנסיה עובד',
  nationalInsuranceDeduction: 'ניכוי ביטוח לאומי',
  healthInsuranceDeduction: 'ניכוי ביטוח בריאות',
  priorYearDifferencesIncluded: 'הפרשים שנים קודמות',
  priorYearDifferencesYear: 'שנת ההפרשים',
  employerName: 'שם מעסיק',
  employeeId: 'ת.ז.',
};

export default function ResultSourceDebug({ result, years }: Props) {
  const [showRawText, setShowRawText] = useState<Record<string, boolean>>({});

  if (process.env.NODE_ENV !== 'development') return null;

  const yearsWithInfo = result.yearlySummaries.filter((s) => s._devInfo);
  if (!yearsWithInfo.length && !years?.length) return null;

  return (
    <div className="mt-8 border-2 border-orange-400 rounded-2xl overflow-hidden font-mono text-xs">
      <div className="bg-orange-400 px-4 py-2">
        <span className="text-white font-bold text-sm">🔬 DEV — ניפוי שגיאות מקור תוצאה (לא גלוי בייצור)</span>
      </div>

      <div className="bg-orange-50 p-5 space-y-8">

        {/* ── Per-year analysis attribution ── */}
        {yearsWithInfo.map((summary) => {
          const info = summary._devInfo!;
          const total = info.docScore + info.questionnaireScore;
          const docPct = info.docDataPercentage;
          const qPct = total > 0 ? 100 - docPct : 0;

          return (
            <div key={summary.year} className="space-y-3 border border-orange-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-sm">ניתוח שנת {summary.year}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">type={summary.type}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">confidence={summary.confidenceLevel}</span>
              </div>

              {/* Attribution bar */}
              <div>
                <p className="text-slate-600 mb-1">
                  ייחוס ניקוד: {docPct}% מסמך / {qPct}% שאלון
                  {' '}(מסמך: {info.docScore} נק׳ · שאלון: {info.questionnaireScore} נק׳)
                </p>
                <div className="h-5 rounded-full overflow-hidden bg-slate-200 flex">
                  {docPct > 0 && (
                    <div className="h-full bg-emerald-500 flex items-center justify-center text-white font-bold"
                      style={{ width: `${docPct}%` }}>
                      {docPct >= 15 ? `${docPct}%` : ''}
                    </div>
                  )}
                  {qPct > 0 && (
                    <div className="h-full bg-amber-400 flex items-center justify-center text-white font-bold"
                      style={{ width: `${qPct}%` }}>
                      {qPct >= 15 ? `${qPct}%` : ''}
                    </div>
                  )}
                  {total === 0 && <div className="h-full w-full bg-slate-300 flex items-center justify-center text-slate-500">אין ניקוד</div>}
                </div>
              </div>

              {/* Positive gate */}
              <div>
                <span className="text-slate-600">שער "תוצאה חיובית": </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">{GATE_LABELS[info.positiveGateStatus] ?? info.positiveGateStatus}</span>
              </div>

              {/* Extraction confidence */}
              <div>
                <span className="text-slate-600">ביטחון חילוץ: </span>
                <span className={
                  info.extractionConfidence >= 0.80 ? 'text-emerald-700 font-bold' :
                  info.extractionConfidence >= 0.55 ? 'text-amber-700 font-bold' :
                  'text-red-700 font-bold'
                }>
                  {info.extractionConfidence > 0 ? `${Math.round(info.extractionConfidence * 100)}%` : 'אין טופס'}
                </span>
              </div>

              {/* Extracted fields list */}
              {info.extractedFields.length > 0 && (
                <div>
                  <p className="text-slate-600 mb-1">שדות שחולצו ({info.extractedFields.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {info.extractedFields.map((f) => (
                      <span key={f} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {info.extractedFields.length === 0 && (
                <p className="text-red-700 font-medium">אף שדה לא חולץ מטפסי 106 לשנה זו</p>
              )}
            </div>
          );
        })}

        {/* ── Per-document field extraction evidence ── */}
        {years?.map((unit) =>
          unit.documents.map((doc) => {
            if (!doc.form106Data?._devMatchEvidence) return null;
            const ev = doc.form106Data._devMatchEvidence!;
            const rawText = doc.form106Data.rawTextSummary;
            const docKey = doc.id;

            return (
              <div key={doc.id} className="border border-blue-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-blue-800 text-sm">📄 {doc.fileName}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">שנת {unit.year}</span>
                  <span className={`px-2 py-0.5 rounded ${
                    doc.form106Data.extractionConfidence >= 0.80 ? 'bg-emerald-100 text-emerald-700' :
                    doc.form106Data.extractionConfidence >= 0.55 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    ביטחון: {Math.round(doc.form106Data.extractionConfidence * 100)}%
                  </span>
                </div>

                {/* Per-field match evidence table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-200 px-2 py-1 text-right">שדה</th>
                        <th className="border border-slate-200 px-2 py-1 text-right">ערך</th>
                        <th className="border border-slate-200 px-2 py-1 text-right">כלל שהתאים</th>
                        <th className="border border-slate-200 px-2 py-1 text-right">טקסט שזוהה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(ev).map(([field, evidence]) => (
                        <tr key={field} className="hover:bg-slate-50">
                          <td className="border border-slate-200 px-2 py-1 font-semibold text-slate-700">
                            {FIELD_LABELS[field] ?? field}
                          </td>
                          <td className={`border border-slate-200 px-2 py-1 font-bold ${
                            evidence.value !== null ? 'text-emerald-700' : 'text-red-500'
                          }`}>
                            {evidence.value !== null ? String(evidence.value) : '—'}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-blue-700">
                            {evidence.ruleDescription}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-slate-500 max-w-xs truncate" dir="auto">
                            {evidence.matchedSnippet ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Missing critical fields */}
                {(() => {
                  const critical = ['taxYear', 'annualTaxableIncome', 'actualTaxWithheld'];
                  const missing = critical.filter((f) => !ev[f] || ev[f].value === null);
                  if (!missing.length) return null;
                  return (
                    <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                      <p className="text-red-700 font-semibold mb-1">⚠ שדות קריטיים חסרים:</p>
                      {missing.map((f) => (
                        <p key={f} className="text-red-600">• {FIELD_LABELS[f] ?? f}</p>
                      ))}
                    </div>
                  );
                })()}

                {/* Raw text toggle */}
                {rawText && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowRawText((s) => ({ ...s, [docKey]: !s[docKey] }))}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {showRawText[docKey] ? '▲ הסתר טקסט גולמי' : '▼ הצג טקסט גולמי (4000 תווים ראשונים)'}
                    </button>
                    {showRawText[docKey] && (
                      <pre className="mt-2 bg-slate-900 text-green-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-xs max-h-96 overflow-y-auto" dir="ltr">
                        {rawText}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* ── Case-level summary ── */}
        <div className="border-t border-orange-300 pt-4">
          <p className="text-slate-700 font-semibold mb-2">סיכום תיק:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded px-3 py-2"><span className="text-slate-500">תוצאה: </span><span className="font-bold">{result.type}</span></div>
            <div className="bg-white rounded px-3 py-2"><span className="text-slate-500">ביטחון: </span><span className="font-bold">{result.confidenceLevel}</span></div>
            <div className="bg-white rounded px-3 py-2"><span className="text-slate-500">טווח: </span><span className="font-bold">{result.refundRange ?? '—'}</span></div>
            <div className="bg-white rounded px-3 py-2"><span className="text-slate-500">מסמכים: </span><span className="font-bold">{result.sourceDocumentIds.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
