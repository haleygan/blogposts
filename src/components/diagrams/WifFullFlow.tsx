import React from 'react';
import { DiagramWrapper } from './shared/DiagramWrapper';
import { ICONS } from './shared/icons';

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

export function WifFullFlow() {
  return (
    <DiagramWrapper title="Full Flow — End to End" icon={ICONS.gcp}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl border-2 p-5 flex flex-col gap-4" style={{ backgroundColor: '#E6F1FB', borderColor: '#185FA5' }}>
          <div className="flex items-center gap-2">
            <img src={ICONS.github} alt="" aria-hidden className="w-4 h-4" />
            <span className="text-xs font-bold font-sans uppercase tracking-wider" style={{ color: '#185FA5' }}>
              Part 1 — Token Exchange
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <Step n={1} color="#24292e" text="Workflow requests a signed JWT from GitHub OIDC." />
            <Step n={2} color="#185FA5" text="JWT sent to GCP STS and validated against WIF config." />
            <Step n={3} color="#185FA5" text="STS returns a short-lived federated token." />
          </div>
        </div>

        <div className="rounded-xl border-2 p-5 flex flex-col gap-4" style={{ backgroundColor: '#E1F5EE', borderColor: '#0F6E56' }}>
          <div className="flex items-center gap-2">
            <img src={ICONS.gcp} alt="" aria-hidden className="w-4 h-4" />
            <span className="text-xs font-bold font-sans uppercase tracking-wider" style={{ color: '#0F6E56' }}>
              Part 2 — Resource Access
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <Step n={1} color="#1a73e8" text="Federated token used to call generateAccessToken on the SA." />
            <Step n={2} color="#1a73e8" text="IAM verifies impersonation rights, issues OAuth 2.0 token." />
            <Step n={3} color="#0F6E56" text="Workflow uses the OAuth token to call GCP APIs." />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-stone-400 font-sans text-center mt-5">
        No static keys. All tokens are short-lived. Part 1 establishes trust — Part 2 grants access.
      </p>
    </DiagramWrapper>
  );
}
