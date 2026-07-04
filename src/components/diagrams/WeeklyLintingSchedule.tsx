import React from 'react';
import { DiagramNode } from './shared/DiagramNode';
import { DiagramArrow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';

export function WeeklyLintingSchedule() {
  return (
    <DiagramWrapper title="Weekly Linting Schedule">
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <DiagramNode
            theme="hook"
            label="Scheduled Cloud Session"
            tooltip="Runs on a cron schedule in the cloud, not self-hosted — no machine has to be on for this to fire."
          />
          <DiagramArrow direction="right" label="reviews" color="#65A30D" />
          <DiagramNode
            theme="brain-content"
            label="Review Past Week"
            tooltip="What happened, what got repeated, what's drifting from how the system was supposed to work."
          />
          <DiagramArrow direction="right" label="scopes" color="#7C3AED" />
          <DiagramNode
            theme="skill"
            label="Revise / Plan Automation"
            tooltip="Turns a repeated manual step spotted this week into something worth building next."
          />
        </div>

        <DiagramArrow direction="down" label="↻ repeats next week" color="#65A30D" />
        <span className="text-[11px] text-stone-400 font-sans">back to Scheduled Cloud Session</span>
      </div>
    </DiagramWrapper>
  );
}
