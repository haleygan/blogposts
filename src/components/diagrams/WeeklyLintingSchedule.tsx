import React from 'react';
import { DiagramArrow, StepRow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';

export function WeeklyLintingSchedule() {
  return (
    <DiagramWrapper title="Weekly Linting Schedule">
      <div className="rounded-xl bg-stone-50 border border-stone-100 divide-y divide-stone-100">
        <StepRow
          step={1}
          fromLabel="Claude Routine"
          fromColor="#65A30D"
          toLabel="Wiki Lint Skill"
          toColor="#047857"
          action="On a fixed schedule, a Claude routine fires and runs the wiki lint skill to check the knowledge base for gaps."
        />
        <StepRow
          step={2}
          fromLabel="Wiki Lint Skill"
          fromColor="#047857"
          toLabel="Config / Connections Check"
          toColor="#6D28D9"
          action="Also lints the config, connections, and other setup pieces for gaps and improvement ideas."
        />
        <StepRow
          step={3}
          fromLabel="Config / Connections Check"
          fromColor="#6D28D9"
          toLabel="Inbox"
          toColor="#374151"
          action="Sends the combined output as a new file in the inbox, waiting to be picked up next session."
        />
      </div>

      <div className="flex flex-col items-center gap-1 mt-4">
        <DiagramArrow direction="down" label="↻ repeats next week" color="#65A30D" />
        <span className="text-[11px] text-stone-400 font-sans">back to Claude Routine</span>
      </div>
    </DiagramWrapper>
  );
}
