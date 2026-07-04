import React from 'react';
import { DiagramNode } from './shared/DiagramNode';
import { DiagramArrow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';

function Step({ n, text, color }: { n: number; text: string; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full text-white text-[10px] font-bold font-mono flex items-center justify-center mt-0.5"
        style={{ backgroundColor: color }}
      >
        {n}
      </span>
      <p className="text-sm text-stone-700 font-sans leading-snug">{text}</p>
    </div>
  );
}

export function AiosFullRoundTrip() {
  return (
    <DiagramWrapper title="The Full Round Trip">
      <div className="flex flex-col items-center gap-2 mb-5">
        <DiagramNode
          theme="neutral"
          label="Inbox / Session Loop"
          tooltip="Every session closes into the inbox; every session open checks it. Both halves below draw from this same loop."
        />
        <div className="flex justify-center gap-16 sm:gap-32 w-full">
          <DiagramArrow direction="down" color="#059669" />
          <DiagramArrow direction="down" color="#7C3AED" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl border-2 p-5 flex flex-col gap-4" style={{ backgroundColor: '#ECFDF5', borderColor: '#059669' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-sans uppercase tracking-wider" style={{ color: '#047857' }}>
              Wiki Side
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <Step n={1} color="#475569" text="CLAUDE.md and index.md load first — the small stable on-ramp, no full-folder read needed." />
            <Step n={2} color="#86198F" text="A note sitting in the inbox gets filed into the right place by Ingest." />
            <Step n={3} color="#047857" text="Later, a question gets answered from what's already stored, cited to where it came from." />
          </div>
        </div>

        <div className="rounded-xl border-2 p-5 flex flex-col gap-4" style={{ backgroundColor: '#F5F3FF', borderColor: '#7C3AED' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-sans uppercase tracking-wider" style={{ color: '#6D28D9' }}>
              Brain Side
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <Step n={1} color="#65A30D" text="A scheduled cloud session reviews the past week and looks for friction." />
            <Step n={2} color="#7C3AED" text="A manual step repeated three times gets flagged as a leverage gap." />
            <Step n={3} color="#A21CAF" text="Level-Up scopes and ships one small automation for it." />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-stone-400 font-sans text-center mt-5">
        Same inbox loop feeds both halves — one keeps what you know organized, the other keeps the system itself honest.
      </p>
    </DiagramWrapper>
  );
}
