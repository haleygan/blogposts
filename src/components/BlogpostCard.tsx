/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogPost } from '../types';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';

interface BlogpostCardProps {
  post: BlogPost;
  onSelect: (postId: string) => void;
  key?: string | number;
}

export function BlogpostCard({ post, onSelect }: BlogpostCardProps) {
  return (
    <article 
      onClick={() => onSelect(post.id)}
      className="group flex flex-col md:flex-row gap-6 p-6 md:p-8 bg-white dark:bg-zinc-900/30 hover:bg-stone-50 dark:hover:bg-zinc-900/60 border border-stone-100 dark:border-zinc-800/50 rounded-2xl cursor-pointer hover:shadow-xl hover:shadow-stone-200/40 dark:hover:shadow-none transition-all duration-300"
    >
      {post.coverImage && (
        <div className="w-full md:w-48 lg:w-60 h-44 md:h-auto rounded-xl overflow-hidden shrink-0 relative bg-zinc-100 dark:bg-zinc-800">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent mix-blend-multiply" />
        </div>
      )}

      {!post.coverImage && (
        <div className="w-full md:w-48 lg:w-60 min-h-36 rounded-xl overflow-hidden shrink-0 relative border border-stone-100 bg-gradient-to-br from-emerald-500/15 via-white to-stone-50 dark:border-zinc-800 dark:from-emerald-500/10 dark:via-zinc-900 dark:to-zinc-900 flex items-end">
          <div className="p-4">
            <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <BookOpen size={13} />
              <span>Draft</span>
            </div>
            <p className="mt-2 text-sm font-medium text-stone-700 dark:text-zinc-200 leading-snug">
              Technical notes, screenshots, and plain-English explanations.
            </p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col flex-grow justify-between min-w-0">
        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3.5">
            {post.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-sans font-medium text-xs tracking-wide px-2.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-stone-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug font-sans mb-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-stone-500 dark:text-zinc-400 text-sm md:text-base font-light font-serif line-clamp-3 leading-relaxed mb-4">
            {post.excerpt}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100 dark:border-zinc-800/40 text-xs text-stone-400 dark:text-zinc-500 font-sans">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-stone-400 dark:text-zinc-500" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={13} className="text-stone-400 dark:text-zinc-500" />
              {post.readTime}
            </span>
          </div>

          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-1.5 transition-transform">
            Read Post <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </article>
  );
}
