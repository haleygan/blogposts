import React from 'react';

interface DiagramWrapperProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

export function DiagramWrapper({ title, icon, children }: DiagramWrapperProps) {
  return (
    <div className="my-8 border border-stone-200 bg-white rounded-2xl shadow-sm">
      {/* Header bar — matches old aesthetic, no overflow-hidden so portalled tooltips aren't clipped */}
      <div className="px-4 pt-3 pb-2 border-b border-stone-100 flex items-center gap-2 rounded-t-2xl">
        {icon && <img src={icon} alt="" aria-hidden className="w-4 h-4 object-contain" />}
        <span className="text-xs font-semibold font-mono uppercase tracking-widest text-stone-400">
          {title}
        </span>
      </div>
      <div className="p-4 sm:p-6 overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
