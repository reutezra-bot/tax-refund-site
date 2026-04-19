import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  className?: string;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  labels,
  className,
}: ProgressBarProps) {
  const pct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500">
          שלב {currentStep} מתוך {totalSteps}
        </span>
        {labels && labels[currentStep - 1] && (
          <span className="text-sm font-medium text-blue-900">
            {labels[currentStep - 1]}
          </span>
        )}
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 bg-blue-700 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
