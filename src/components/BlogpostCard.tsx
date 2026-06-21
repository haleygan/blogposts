/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogPost } from '../types';
import { BookOpen, Calendar, ArrowRight, Cloud, Server, Shield, Code2, Cpu, FileText } from 'lucide-react';

interface BlogpostCardProps {
  post: BlogPost;
  onSelect: (postId: string) => void;
  key?: string | number;
}

const CATEGORY_THEMES: Record<string, { from: string; via: string; to: string; logo?: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = {
  Cloud:    { from: '#1565C0', via: '#1a73e8', to: '#0D47A1', logo: 'https://api.iconify.design/logos:google-cloud.svg', Icon: Cloud },
  DevOps:   { from: '#374151', via: '#4B5563', to: '#1F2937', Icon: Server },
  Security: { from: '#7C3AED', via: '#8B5CF6', to: '#5B21B6', Icon: Shield },
  Backend:  { from: '#065F46', via: '#059669', to: '#064E3B', Icon: Cpu },
  Frontend: { from: '#0E7490', via: '#0891B2', to: '#164E63', Icon: Code2 },
};

function GeneratedThumbnail({ post }: { post: BlogPost }) {
  const theme = CATEGORY_THEMES[post.category ?? ''] ?? { from: '#44403C', via: '#57534E', to: '#292524', Icon: FileText };
  const { Icon } = theme;

  if (theme.logo) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center p-12">
        <img src={theme.logo} alt={post.category} className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(145deg, ${theme.from}, ${theme.via} 55%, ${theme.to})` }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="relative flex flex-col items-center gap-2.5">
        <Icon size={34} strokeWidth={1.5} color="rgba(255,255,255,0.92)" />
        {post.category && (
          <span className="text-white/75 text-[11px] font-semibold font-mono uppercase tracking-[0.2em]">
            {post.category}
          </span>
        )}
      </div>
      {post.tags[0] && (
        <div className="absolute bottom-3 left-3">
          <span className="text-white/70 text-[10px] font-sans font-medium bg-white/10 border border-white/15 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {post.tags[0]}
          </span>
        </div>
      )}
    </div>
  );
}

export function BlogpostCard({ post, onSelect }: BlogpostCardProps) {
  return (
    <article
      onClick={() => onSelect(post.id)}
      className="group flex flex-col md:flex-row gap-6 p-6 md:p-8 bg-white hover:bg-stone-50 border border-stone-100 hover:border-stone-300 rounded-2xl cursor-pointer hover:shadow-xl hover:shadow-stone-200/40 hover:scale-[1.008] transition-all duration-300"
    >
      {post.coverImage && (
        <div className="w-full md:w-48 lg:w-60 h-44 md:h-auto rounded-xl overflow-hidden shrink-0 relative bg-stone-100">
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
        <div className="w-full md:w-48 lg:w-60 min-h-36 md:h-auto rounded-xl overflow-hidden shrink-0 relative">
          <GeneratedThumbnail post={post} />
        </div>
      )}

      <div className="flex flex-col flex-grow justify-between min-w-0">
        <div>
          <div className="flex flex-wrap gap-2 mb-3.5">
            {post.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-emerald-50 text-emerald-700 font-sans font-medium text-xs tracking-wide px-2.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-stone-900 transition-colors line-clamp-2 leading-snug font-sans mb-2">
            {post.title}
          </h3>

          <p className="text-stone-500 text-sm md:text-base font-light font-serif line-clamp-3 leading-relaxed mb-4">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100 text-xs text-stone-400 font-sans">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-stone-400" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={13} className="text-stone-400" />
              {post.readTime}
            </span>
          </div>

          <span className="flex items-center gap-1 text-emerald-600 font-semibold group-hover:translate-x-1.5 transition-transform">
            Read Post <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </article>
  );
}
