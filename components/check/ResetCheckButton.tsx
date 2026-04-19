'use client';

import { useCheckSession } from '@/lib/check-session';
import { useRouter } from 'next/navigation';

export default function ResetCheckButton() {
  const { reset } = useCheckSession();
  const router = useRouter();

  const handleReset = () => {
    reset();
    router.push('/');
  };

  return (
    <button
      onClick={handleReset}
      type="button"
      className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
    >
      התחל מחדש
    </button>
  );
}
