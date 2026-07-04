import React from 'react';
import { DiagramNode } from './shared/DiagramNode';
import { DiagramWrapper } from './shared/DiagramWrapper';

interface TreeLineProps {
  depth: number;
  last?: boolean;
  text: string;
  dim?: boolean;
}

function TreeLine({ depth, last, text, dim }: TreeLineProps) {
  const connector = last ? '└── ' : '├── ';
  return (
    <div
      className={`font-mono text-xs leading-6 whitespace-nowrap ${dim ? 'text-stone-400 italic' : 'text-stone-600'}`}
      style={{ paddingLeft: `${depth * 1.1}rem` }}
    >
      {connector}
      {text}
    </div>
  );
}

interface FolderColumnProps {
  theme: 'brain-content' | 'user' | 'neutral' | 'wiki-content';
  root: string;
  bg: string;
  border: string;
  text: string;
  children: React.ReactNode;
}

function FolderColumn({ theme, root, bg, border, text, children }: FolderColumnProps) {
  return (
    <div className="rounded-xl border-2 p-4 flex flex-col gap-3" style={{ backgroundColor: bg, borderColor: border }}>
      <DiagramNode theme={theme} label={root} />
      <div className="rounded-lg bg-white/70 border border-stone-100 px-3 py-2" style={{ color: text }}>
        {children}
      </div>
    </div>
  );
}

export function TopLevelShape() {
  return (
    <DiagramWrapper title="The Shape of the System">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <FolderColumn theme="brain-content" root="brain/" bg="#F5F3FF" border="#7C3AED" text="#6D28D9">
          <TreeLine depth={0} text="aios-intake.md" />
          <TreeLine depth={0} text="connections.md" />
          <TreeLine depth={0} text="EXPANSIONS.md" />
          <TreeLine depth={0} last text="references/" />
          <TreeLine depth={1} text="3ms-framework.md" />
          <TreeLine depth={1} text="voice.md" />
          <TreeLine depth={1} last text="pointer-audit.md" />
        </FolderColumn>

        <FolderColumn theme="user" root="identity-context/" bg="#FFF1F2" border="#E11D48" text="#BE123C">
          <TreeLine depth={0} text="about-me.md" />
          <TreeLine depth={0} text="about-business.md" />
          <TreeLine depth={0} last text="priorities.md" />
          <TreeLine depth={0} dim last text="(human-maintained, Claude never overwrites)" />
        </FolderColumn>

        <FolderColumn theme="neutral" root="inbox/" bg="#f3f4f6" border="#d1d5db" text="#374151">
          <TreeLine depth={0} text="session-2026-06-30.md" />
          <TreeLine depth={0} last text="processed/" />
          <TreeLine depth={1} last dim text="(audit trail, never deleted)" />
        </FolderColumn>

        <FolderColumn theme="wiki-content" root="wiki/" bg="#ECFDF5" border="#059669" text="#047857">
          <TreeLine depth={0} text="index.md" />
          <TreeLine depth={0} text="schema.md" />
          <TreeLine depth={0} last text="pages/" />
          <TreeLine depth={1} last text="<project>/" />
          <TreeLine depth={2} text="context/" />
          <TreeLine depth={2} text="knowledge/" />
          <TreeLine depth={2} text="log/" />
          <TreeLine depth={2} text="plan/" />
          <TreeLine depth={2} last text="archives/" />
        </FolderColumn>
      </div>

      <p className="text-[11px] text-stone-400 font-sans text-center mt-4">
        Just files in a folder — no magic. This is one way to shape it; the part that matters is maintaining whatever shape you pick.
      </p>
    </DiagramWrapper>
  );
}
