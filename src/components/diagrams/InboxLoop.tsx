import React from 'react';
import { DiagramNode } from './shared/DiagramNode';
import { DiagramArrow, StepRow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';

export function InboxLoop() {
  return (
    <DiagramWrapper title="The Inbox Loop">
      <div className="rounded-xl bg-stone-50 border border-stone-100 divide-y divide-stone-100">
        <StepRow
          step={1}
          fromLabel="Session Close"
          fromColor="#BE123C"
          toLabel="Sub-Agent"
          toColor="#86198F"
          action="A hook fires when the session ends and spins up a sub-agent to summarize what happened."
        />
        <StepRow
          step={2}
          fromLabel="Sub-Agent"
          fromColor="#86198F"
          toLabel="Inbox"
          toColor="#374151"
          action="The summary — a new idea, a change, a thought about an automation — is written to the inbox, unprocessed."
        />
        <StepRow
          step={3}
          fromLabel="Inbox"
          fromColor="#374151"
          toLabel="Next Session Start"
          toColor="#65A30D"
          action="Sits there until the next session begins."
        />
        <StepRow
          step={4}
          fromLabel="Next Session Start"
          fromColor="#65A30D"
          toLabel="Offer to Process"
          toColor="#475569"
          action="A hook checks whether anything's sitting in the inbox and offers to process it."
        />
      </div>

      <div className="flex flex-col items-center gap-2 mt-4">
        <DiagramArrow direction="down" label="then either" color="#475569" />
        <div className="flex items-center gap-3">
          <DiagramNode
            theme="wiki-content"
            label="Fold into Wiki"
            tooltip="Filed into the existing knowledge base, cross-linked where it needs to be."
          />
          <span className="text-[11px] text-stone-400 font-sans">or</span>
          <DiagramNode
            theme="skill"
            label="New Skill / Automation"
            tooltip="Scoped and shipped as a new capability instead — not everything belongs in the wiki."
          />
        </div>
      </div>

      <p className="text-[11px] text-stone-400 font-sans text-center mt-4">
        Not always a sub-agent session — a plain script does the same job for less token spend on a tight budget.
      </p>
    </DiagramWrapper>
  );
}
