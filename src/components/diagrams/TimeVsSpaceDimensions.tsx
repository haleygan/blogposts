import React from 'react';
import { DiagramWrapper } from './shared/DiagramWrapper';

export function TimeVsSpaceDimensions() {
  return (
    <DiagramWrapper title="The Two Dimensions of Algorithmic Complexity">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time Complexity Card */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-blue-800">
                Time Complexity
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                Operations / Input
              </span>
            </div>
            <p className="text-sm font-semibold text-blue-950 mb-2">
              How does computational work scale with n?
            </p>
            <ul className="text-xs text-blue-900/80 space-y-1.5 list-disc list-inside font-sans">
              <li>Counts atomic operations (comparisons, assignments, arithmetic)</li>
              <li>Ignores wall-clock seconds (hardware speed, cloud multi-tenancy)</li>
              <li>Goal: Predict execution curves before input volume explodes</li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-blue-200/60 text-[11px] font-mono text-blue-700">
            Metric: Atomic operation count
          </div>
        </div>

        {/* Space Complexity Card */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-800">
                Space Complexity
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                RAM / Input
              </span>
            </div>
            <p className="text-sm font-semibold text-emerald-950 mb-2">
              How does memory usage scale with n?
            </p>
            <ul className="text-xs text-emerald-900/80 space-y-1.5 list-disc list-inside font-sans">
              <li>Measures auxiliary memory allocated on the heap</li>
              <li>Separates fixed input payload from algorithm-created buffers</li>
              <li>Goal: Avoid OOM kills when streaming millions of records</li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-200/60 text-[11px] font-mono text-emerald-700">
            Metric: Extra bytes allocated
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-stone-100 border border-stone-200 text-center">
        <p className="text-xs text-stone-600 font-sans">
          <span className="font-semibold text-stone-800">The Trade-Off:</span> Accelerating time often demands caching in auxiliary space (e.g. hash sets). Shrinking memory footprint often forces multiple passes.
        </p>
      </div>
    </DiagramWrapper>
  );
}
