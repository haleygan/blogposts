import React from 'react';
import { DiagramWrapper } from './shared/DiagramWrapper';

export function BoundsCeilingFloor() {
  return (
    <DiagramWrapper title="The Three Bounds: Ceiling, Exact Curve, and Floor">
      <div className="space-y-3 font-sans">
        {/* Upper Bound */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-rose-200/80 text-rose-900 border border-rose-300">
              O(n)
            </span>
            <div>
              <p className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                Big O: Upper Bound (The Ceiling)
              </p>
              <p className="text-xs text-rose-900/80">
                Guaranteed worst-case behavior. Real systems must survive this ceiling.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-rose-800 bg-rose-100 px-2 py-1 rounded self-start sm:self-auto">
            Fraud absent or at end: n steps
          </div>
        </div>

        {/* Tight Bound */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
              &Theta;(n)
            </span>
            <div>
              <p className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Big Theta: Tight Bound (Exact Curve)
              </p>
              <p className="text-xs text-amber-900/80">
                Claimed only when best and worst case share the identical growth shape.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2 py-1 rounded self-start sm:self-auto">
            No early exit / continue: always n steps
          </div>
        </div>

        {/* Lower Bound */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-emerald-200/80 text-emerald-900 border border-emerald-300">
              &Omega;(1)
            </span>
            <div>
              <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Big Omega: Lower Bound (The Floor)
              </p>
              <p className="text-xs text-emerald-900/80">
                Best-case shortcut. The minimum work required under ideal conditions.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-1 rounded self-start sm:self-auto">
            Fraud at index 0: 1 step
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-xs text-center">
        Early returns create a gap between ceiling and floor (<span className="font-mono text-stone-800">O(n)</span> vs <span className="font-mono text-stone-800">&Omega;(1)</span>). Loops with full scans merge ceiling and floor into a tight bound (<span className="font-mono text-stone-800">&Theta;(n)</span>).
      </div>
    </DiagramWrapper>
  );
}
