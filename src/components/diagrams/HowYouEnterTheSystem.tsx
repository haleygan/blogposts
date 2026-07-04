import React from 'react';
import { StepRow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';

export function HowYouEnterTheSystem() {
  return (
    <DiagramWrapper title="One Navigation Example">
      <div className="rounded-xl bg-stone-50 border border-stone-100 divide-y divide-stone-100">
        <StepRow
          step={1}
          fromLabel="Session Start"
          fromColor="#BE123C"
          toLabel="CLAUDE.md"
          toColor="#475569"
          action="A session begins. CLAUDE.md loads first — the system's own persistent instructions."
        />
        <StepRow
          step={2}
          fromLabel="CLAUDE.md"
          fromColor="#475569"
          toLabel="index.md"
          toColor="#475569"
          action="CLAUDE.md points to index.md, the short navigation map of what topics and projects exist."
        />
        <StepRow
          step={3}
          fromLabel="index.md"
          fromColor="#475569"
          toLabel="Correct File"
          toColor="#059669"
          action="index.md points straight to the one file that answers the question."
        />
      </div>

      <p className="text-[11px] text-stone-400 font-sans text-center mt-3">
        No need to read every file in the wiki. No need to hand it a path by hand. Two small pointer files get it there.
      </p>
    </DiagramWrapper>
  );
}
