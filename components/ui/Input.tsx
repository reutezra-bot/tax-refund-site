import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 mr-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'w-full px-4 py-3 rounded-xl border text-slate-800 bg-white',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-slate-300 hover:border-slate-400',
          className,
        )}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 mr-0.5">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={3}
        {...props}
        className={cn(
          'w-full px-4 py-3 rounded-xl border text-slate-800 bg-white resize-none',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-slate-300 hover:border-slate-400',
          className,
        )}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
