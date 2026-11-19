import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ScoreBadgeProps {
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score = 0,
  size = 'md',
  showLabel = true,
  className
}) => {
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200'
  let textColor = 'text-slate-700'
  let label = 'Not Screened'

  if (score >= 90) {
    colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs'
    textColor = 'text-emerald-700'
    label = 'Exceptional'
  } else if (score >= 75) {
    colorStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
    textColor = 'text-indigo-700'
    label = 'Strong Fit'
  } else if (score >= 60) {
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200/80'
    textColor = 'text-amber-700'
    label = 'Moderate'
  } else if (score > 0) {
    colorStyle = 'bg-red-50 text-red-700 border-red-200/80'
    textColor = 'text-red-700'
    label = 'Low Fit'
  }

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border font-semibold select-none',
        sizes[size],
        colorStyle,
        className
      )}
      title={`AI Match Score: ${score}% (${label})`}
    >
      <Sparkles className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5', textColor)} />
      <span className="font-mono">{score}%</span>
      {showLabel && <span className="opacity-80 font-normal">· {label}</span>}
    </div>
  )
}
