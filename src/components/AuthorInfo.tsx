/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BlogPost } from '../types';

interface AuthorInfoProps {
  author: BlogPost['author'];
  readTime: string;
}

export function AuthorInfo({ author, readTime }: AuthorInfoProps) {
  return (
    <div className="flex items-center gap-3.5 pb-8 border-b border-stone-100 dark:border-zinc-900/60 mb-8 font-sans">
      {author.avatar && (
        <img
          src={author.avatar}
          alt={author.name}
          className="w-11 h-11 rounded-full border border-stone-200 dark:border-zinc-800 object-cover"
          referrerPolicy="no-referrer"
        />
      )}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-900 dark:text-white text-sm">{author.name}</span>
          <span className="w-1.5 h-1 rounded-full bg-emerald-500" />
          <span className="text-xs text-stone-400 dark:text-zinc-500">{readTime}</span>
        </div>
        <p className="text-xs text-stone-400 dark:text-zinc-500 leading-snug font-light mt-0.5 max-w-md">
          {author.bio}
        </p>
      </div>
    </div>
  );
}
