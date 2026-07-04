import React from 'react';
import { DiagramNode } from './shared/DiagramNode';
import { DiagramWrapper } from './shared/DiagramWrapper';
import { ICONS } from './shared/icons';

interface ShelfProps {
  label: string;
  highlighted?: boolean;
  books: { n: number; found?: boolean }[];
}

function Shelf({ label, highlighted, books }: ShelfProps) {
  return (
    <div
      className={`rounded-xl border-2 p-3 flex flex-col gap-2 ${highlighted ? '' : 'border-stone-200 bg-stone-50'}`}
      style={highlighted ? { backgroundColor: '#FFFBEB', borderColor: '#D97706' } : undefined}
    >
      <span
        className="text-[11px] font-semibold font-sans uppercase tracking-wider"
        style={{ color: highlighted ? '#92400E' : '#78716c' }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {books.map(({ n, found }) => (
          <DiagramNode
            key={n}
            theme={found ? 'spotlight' : 'neutral'}
            label={`#${n}`}
            icon={found ? ICONS.book : undefined}
            tooltip={found ? 'The pointer file — this is what gets found first, not the whole shelf.' : undefined}
            className={found ? 'ring-4 ring-amber-300/50' : ''}
          />
        ))}
      </div>
    </div>
  );
}

export function LibraryOfBooks() {
  return (
    <DiagramWrapper title="Library of Books" icon={ICONS.book}>
      <div className="flex flex-col gap-3">
        <Shelf label="Shelf 1" books={[{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }]} />
        <Shelf
          label="Shelf 2 — the one you needed"
          highlighted
          books={[{ n: 6 }, { n: 7 }, { n: 8, found: true }, { n: 9 }, { n: 10 }]}
        />
        <Shelf label="Shelf 3" books={[{ n: 11 }, { n: 12 }, { n: 13 }, { n: 14 }, { n: 15 }]} />
      </div>

      <p className="text-sm text-stone-600 font-sans text-center italic mt-5">
        &ldquo;A bigger library doesn&apos;t help if you can&apos;t find the shelf.&rdquo;
      </p>
    </DiagramWrapper>
  );
}
