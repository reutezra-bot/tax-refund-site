import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md';
  border?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
};

export default function Card({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  border = true,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl',
        paddingClasses[padding],
        shadowClasses[shadow],
        border && 'border border-slate-100',
        className,
      )}
    >
      {children}
    </div>
  );
}
