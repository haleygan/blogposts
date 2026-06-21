import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export type NodeTheme = 'github' | 'pool' | 'provider' | 'sts' | 'sa' | 'iam' | 'resource' | 'neutral';

interface DiagramNodeProps {
  label: string;
  icon?: string;
  tooltip?: string;
  theme?: NodeTheme;
  className?: string;
}

const THEME: Record<NodeTheme, { bg: string; border: string; text: string }> = {
  github:   { bg: '#f6f8fa',  border: '#6e5494', text: '#24292e' },
  pool:     { bg: '#E1F5EE',  border: '#0F6E56', text: '#0F6E56' },
  provider: { bg: '#EEEDFE',  border: '#534AB7', text: '#534AB7' },
  sts:      { bg: '#E6F1FB',  border: '#185FA5', text: '#185FA5' },
  sa:       { bg: '#FEF3E2',  border: '#BA7517', text: '#BA7517' },
  iam:      { bg: '#FAECE7',  border: '#993C1D', text: '#993C1D' },
  resource: { bg: '#E8F0FE',  border: '#1a73e8', text: '#1a5da8' },
  neutral:  { bg: '#f3f4f6',  border: '#d1d5db', text: '#374151' },
};

export function DiagramNode({ label, icon, tooltip, theme = 'neutral', className = '' }: DiagramNodeProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const s = THEME[theme];

  const showTooltip = () => {
    if (!tooltip || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const tooltipW = 224; // w-56
    const margin = 8;
    const rawX = r.left + r.width / 2;
    const clampedX = Math.max(tooltipW / 2 + margin, Math.min(rawX, window.innerWidth - tooltipW / 2 - margin));
    setPos({ x: clampedX, y: r.top });
  };

  const handleTap = (e: React.TouchEvent) => {
    e.preventDefault();
    pos ? setPos(null) : showTooltip();
  };

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <div
        className="flex flex-col items-center gap-1.5 rounded-xl border-2 shadow-sm px-4 py-3 transition-shadow hover:shadow-md"
        style={{ backgroundColor: s.bg, borderColor: s.border, cursor: tooltip ? 'help' : 'default' }}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setPos(null)}
        onTouchStart={handleTap}
      >
        {icon && <img src={icon} alt="" aria-hidden className="w-6 h-6 object-contain" />}
        <span className="text-sm font-semibold font-sans text-center leading-snug whitespace-nowrap" style={{ color: s.text }}>
          {label}
        </span>
      </div>

      {pos && tooltip && createPortal(
        <div
          className="fixed w-56 max-w-[calc(100vw-1rem)] p-3 bg-stone-900 text-white text-xs rounded-xl shadow-2xl pointer-events-none z-[9999] leading-relaxed"
          style={{ left: pos.x, top: pos.y - 8, transform: 'translateX(-50%) translateY(-100%)' }}
        >
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-stone-900" />
        </div>,
        document.body,
      )}
    </div>
  );
}
