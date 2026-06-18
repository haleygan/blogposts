/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, Sparkles } from 'lucide-react';

interface MainHeaderProps {
  onPostsClick: () => void;
}

export function MainHeader({ onPostsClick }: MainHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-100 bg-white/75 backdrop-blur-md transition-colors dark:border-zinc-900 dark:bg-zinc-950/75">
      <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={onPostsClick} className="group flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/15 transition-transform group-hover:rotate-6 dark:bg-emerald-500">
            <Sparkles size={17} fill="white" className="text-emerald-300" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[1.05rem] font-bold tracking-tight text-stone-900 dark:text-white">
              haley's blogposts
            </span>
            <span className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Data Person By Day... and Night!
            </span>
          </div>
        </button>

        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onPostsClick}
            className="flex items-center gap-1.5 rounded-xl bg-stone-100 px-4 py-2 text-[0.95rem] font-medium text-stone-900 transition-all dark:bg-zinc-900 dark:text-white"
          >
            <BookOpen size={15} />
            Posts
          </button>
        </nav>
      </div>
    </header>
  );
}
