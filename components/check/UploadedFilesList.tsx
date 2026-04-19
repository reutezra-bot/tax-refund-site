'use client';

import type { UploadedDocument } from '@/types/documents';
import { formatFileSize, getEligibleTaxYears } from '@/lib/utils';

interface UploadedFilesListProps {
  documents: UploadedDocument[];
  onRemove: (id: string) => void;
  onUpdateYear: (id: string, year: number | undefined) => void;
}

const fileIcon = (type: string) => {
  if (type === 'application/pdf') return '📄';
  if (type.startsWith('image/')) return '🖼️';
  return '📎';
};

export default function UploadedFilesList({
  documents,
  onRemove,
  onUpdateYear,
}: UploadedFilesListProps) {
  const eligibleYears = getEligibleTaxYears();

  if (documents.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">
        קבצים שהועלו ({documents.length})
      </p>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3"
          >
            {/* File info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xl shrink-0" aria-hidden>
                {fileIcon(doc.fileType)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{doc.fileName}</p>
                <p className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</p>
                {doc.extracting && (
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                    <span className="inline-block w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    מנתח את הטופס...
                  </p>
                )}
                {!doc.extracting && doc.extractionError && (
                  <p className="text-xs text-red-500 mt-0.5">⚠ {doc.extractionError}</p>
                )}
                {!doc.extracting && doc.form106Data && (
                  <p className="text-xs text-emerald-600 mt-0.5">✓ הטופס נותח בהצלחה</p>
                )}
              </div>
            </div>

            {/* Year tag */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs text-slate-500 whitespace-nowrap">שנת מס:</label>
              <select
                value={doc.detectedYear ?? ''}
                onChange={(e) =>
                  onUpdateYear(doc.id, e.target.value ? Number(e.target.value) : undefined)
                }
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label={`שנת מס עבור ${doc.fileName}`}
              >
                <option value="">-- בחרו --</option>
                {eligibleYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Remove */}
            <button
              onClick={() => onRemove(doc.id)}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label={`הסר ${doc.fileName}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
