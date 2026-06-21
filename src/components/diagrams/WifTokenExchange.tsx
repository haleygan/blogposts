import React from 'react';
import { StepRow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';
import { ICONS } from './shared/icons';

export function WifTokenExchange() {
  return (
    <DiagramWrapper title="Part 1 — Token Exchange" icon={ICONS.gcp}>
      <div className="rounded-xl bg-stone-50 border border-stone-100 divide-y divide-stone-100">
        <StepRow
          step={1}
          fromLabel="GitHub Actions"
          fromColor="#24292e"
          toLabel="GitHub OIDC"
          toColor="#6e5494"
          action="Request and receive a signed JWT"
        />
        <StepRow
          step={2}
          fromLabel="GitHub Actions"
          fromColor="#24292e"
          toLabel="GCP STS"
          toColor="#185FA5"
          action="Send JWT — STS validates against the WIF Pool & Provider config"
        />
        <StepRow
          step={3}
          fromLabel="GCP STS"
          fromColor="#185FA5"
          toLabel="GitHub Actions"
          toColor="#24292e"
          direction="left"
          action="Return short-lived federated token (~1 hour)"
        />
      </div>
    </DiagramWrapper>
  );
}
