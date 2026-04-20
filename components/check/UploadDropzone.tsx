'use client';

import { useCallback, useRef, useState } from 'react';
import type { UploadedDocument } from '@/types/documents';
import type { Form106ExtractedData } from '@/lib/form106-parser';
import { validateUpload } from '@/lib/validators';
import { generateId } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  documents: UploadedDocument[];
  sessionId: string;
  onChange: (docs: UploadedDocument[]) => void;
}

async function extractFromFile(
  file: File,
): Promise<{ data: Form106ExtractedData; isUsable: boolean } | { error: string }> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/extract-form106', { method: 'POST', body: formData });
    const json = await res.json();
    if (!json.ok) return { error: json.error ?? 'שגיאה בחילוץ הנתונים מהטופס' };
    return { data: json.data, isUsable: json.isUsable };
  } catch {
    return { error: 'לא ניתן להתחבר לשרת — אנא נסה שוב' };
  }
}

export default function UploadDropzone({ documents, sessionId, onChange }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      const err = validateUpload(files);
      if (err) {
        setError(err);
        return;
      }
      setError(null);

      const placeholders: UploadedDocument[] = files.map((file) => ({
        id: generateId(),
        tempSessionId: sessionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        category: 'form106',
        extracting: true,
      }));

      // working is a local mutable reference shared across all concurrent callbacks.
      // JS is single-threaded so these async callbacks won't interleave.
      let working: UploadedDocument[] = [...documents, ...placeholders];
      onChange(working);

      await Promise.all(
        files.map(async (file, i) => {
          const placeholder = placeholders[i];
          const [result, fileBase64] = await Promise.all([
            extractFromFile(file),
            file.arrayBuffer().then((buf) => {
              const bytes = new Uint8Array(buf);
              let binary = '';
              for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
              return btoa(binary);
            }),
          ]);

          const idx = working.findIndex((d) => d.id === placeholder.id);
          if (idx === -1) return;

          working = [...working];
          if ('error' in result) {
            working[idx] = { ...placeholder, extracting: false, extractionError: result.error, fileBase64 };
          } else {
            working[idx] = {
              ...placeholder,
              extracting: false,
              form106Data: result.data,
              detectedYear: result.data.taxYear ?? placeholder.detectedYear,
              fileBase64,
            };
          }
          onChange(working);
        }),
      );
    },
    [documents, onChange, sessionId],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(Array.from(e.dataTransfer.files));
    },
    [processFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(Array.from(e.target.files ?? []));
      if (inputRef.current) inputRef.current.value = '';
    },
    [processFiles],
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="העלאת קבצים"
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer',
          'transition-all duration-200 select-none',
          isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleInputChange}
          className="sr-only"
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center',
              isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 shadow-sm',
            )}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-slate-700 font-semibold text-base">
              העלו טופס 106
            </p>
            <p className="text-slate-500 text-sm mt-0.5">
              גררו לכאן קובץ, או{' '}
              <span className="text-blue-700 font-medium underline underline-offset-2">
                לחצו לבחירה
              </span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {['PDF', 'JPG', 'PNG'].map((t) => (
              <span key={t} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-500">
                {t}
              </span>
            ))}
            <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-500">
              עד 10MB
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">אפשר להעלות יותר מקובץ אחד</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
