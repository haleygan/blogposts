import React from 'react';
import { DiagramNode } from './shared/DiagramNode';
import { DiagramArrow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';
import { ICONS } from './shared/icons';

export function DeliberateUpkeep() {
  return (
    <DiagramWrapper title="Deliberate Upkeep" icon={ICONS.gear}>
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative inline-block">
            <DiagramNode
              theme="neutral"
              icon={ICONS.gear}
              label="The System, Running"
              tooltip="Left to itself, this just keeps turning — skills firing, files accumulating, nothing checking whether any of it still fits."
            />
            <img
              src={ICONS.magnify}
              alt=""
              aria-hidden
              className="w-6 h-6 absolute -bottom-2 -right-2 drop-shadow"
              loading="lazy"
            />
          </div>

          <DiagramArrow direction="right" label="zoom in, on purpose" color="#D97706" />

          <DiagramNode
            theme="spotlight"
            className="ring-4 ring-amber-300/50"
            label="Human Review"
            tooltip="Still accurate? Still useful? Still true to me? Only a human asks this — the model won't flag its own drift."
          />
        </div>

        <p className="text-sm text-stone-600 font-sans text-center italic mt-1">
          &ldquo;Left alone, a system drifts. Tended, it stays yours.&rdquo;
        </p>
      </div>
    </DiagramWrapper>
  );
}
