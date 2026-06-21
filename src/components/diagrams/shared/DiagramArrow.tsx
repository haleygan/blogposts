import React from 'react';

interface ArrowProps {
  label?: string;
  direction?: 'right' | 'left' | 'down';
  color?: string;
  className?: string;
}

export function DiagramArrow({ label, direction = 'right', color = '#9ca3af', className = '' }: ArrowProps) {
  if (direction === 'down') {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        {label && <span className="text-[11px] text-stone-500 font-sans text-center">{label}</span>}
        <div className="flex flex-col items-center">
          <div className="w-px h-8" style={{ backgroundColor: color }} />
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
            <path d="M5 6L0 0H10L5 6Z" fill={color} />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-1 shrink-0 ${className}`}>
      {label && <span className="text-[11px] text-stone-500 font-sans text-center leading-tight">{label}</span>}
      <div className="flex items-center">
        {direction === 'left' && (
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
            <path d="M0 5L6 0V10L0 5Z" fill={color} />
          </svg>
        )}
        <div className="h-[2px] w-16" style={{ backgroundColor: color }} />
        {direction === 'right' && (
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
            <path d="M6 5L0 0V10L6 5Z" fill={color} />
          </svg>
        )}
      </div>
    </div>
  );
}

/* Single row in a step-flow diagram */
interface StepRowProps {
  step: number;
  fromLabel: string;
  fromColor: string;
  toLabel: string;
  toColor: string;
  action: string;
  direction?: 'right' | 'left';
}

export function StepRow({ step, fromLabel, fromColor, toLabel, toColor, action, direction = 'right' }: StepRowProps) {
  const Arrow = () => (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden className="shrink-0">
      {direction === 'right'
        ? <path d="M14 5L9 0V4H0V6H9V10L14 5Z" fill="#9ca3af" />
        : <path d="M0 5L5 0V4H14V6H5V10L0 5Z" fill="#9ca3af" />}
    </svg>
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-700 text-white text-[10px] font-bold font-mono flex items-center justify-center">
          {step}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-semibold font-sans px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: fromColor }}>
            {fromLabel}
          </span>
          <Arrow />
          <span className="text-[11px] font-semibold font-sans px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: toColor }}>
            {toLabel}
          </span>
        </div>
      </div>
      <p className="text-sm text-stone-700 font-sans leading-snug">{action}</p>
    </div>
  );
}
