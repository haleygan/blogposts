import React from 'react';
import type { BlogPostMeta } from '../types';

interface AuthorInfoProps {
  author: BlogPostMeta['author'];
  readTime: string;
}

export const AuthorInfo = React.memo(function AuthorInfo({ author, readTime }: AuthorInfoProps) {
  return (
    <div className="flex items-center gap-3.5 pb-8 border-b border-stone-100 mb-8 font-sans">
      {author.avatar && (
        <img
          src={author.avatar}
          alt={author.name}
          className="w-11 h-11 rounded-full border border-stone-200 object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      )}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-900 text-sm">{author.name}</span>
          <span className="w-1.5 h-1 rounded-full bg-emerald-500" />
          <span className="text-xs text-stone-400">{readTime}</span>
        </div>
        <p className="text-xs text-stone-400 leading-snug font-light mt-0.5 max-w-md">
          {author.bio}
        </p>
      </div>
    </div>
  );
});
