/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Moon, Sun, Sparkles, BookOpen } from 'lucide-react';

interface MainHeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeView: 'home' | 'posts';
  onNavigate: (view: 'home' | 'posts') => void;
}

export function MainHeader({ darkMode, onToggleDarkMode, activeView, onNavigate }: MainHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-100 bg-white/75 backdrop-blur-md transition-colors dark:border-zinc-900 dark:bg-zinc-950/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/15 transition-transform group-hover:rotate-6 dark:bg-emerald-500">
            <Sparkles size={16} fill="white" className="text-emerald-300" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-base font-bold tracking-tight text-stone-900 dark:text-white">
              blogposts
            </span>
            <span className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Technical notes
            </span>
          </div>
        </button>

        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onNavigate('home')}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeView === 'home'
                ? 'bg-stone-100 text-stone-900 dark:bg-zinc-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onNavigate('posts')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeView === 'posts'
                ? 'bg-stone-100 text-stone-900 dark:bg-zinc-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            Posts
          </button>
        </nav>

        <button
          onClick={onToggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition-all active:scale-90 hover:bg-stone-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          title="Toggle theme mode"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}

