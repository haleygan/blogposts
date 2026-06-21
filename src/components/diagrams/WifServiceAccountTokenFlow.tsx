import React from 'react';
import { StepRow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';
import { ICONS } from './shared/icons';

export function WifServiceAccountTokenFlow() {
  return (
    <DiagramWrapper title="Part 2 — SA Impersonation Token Flow" icon={ICONS.gcp}>
      <div className="rounded-xl bg-stone-50 border border-stone-100 divide-y divide-stone-100">
        <StepRow
          step={1}
          fromLabel="GitHub Actions"
          fromColor="#24292e"
          toLabel="GCP IAM"
          toColor="#1a73e8"
          action="Call generateAccessToken with the federated token + SA email"
        />
        <StepRow
          step={2}
          fromLabel="GCP IAM"
          fromColor="#1a73e8"
          toLabel="Service Account"
          toColor="#BA7517"
          action="Verify the Workload Identity User binding on the SA"
        />
        <StepRow
          step={3}
          fromLabel="GCP IAM"
          fromColor="#1a73e8"
          toLabel="GitHub Actions"
          toColor="#24292e"
          direction="left"
          action="Return short-lived OAuth 2.0 token scoped to the SA"
        />
      </div>
    </DiagramWrapper>
  );
}
