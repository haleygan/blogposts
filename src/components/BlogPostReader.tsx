/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArrowLeft, Eye, EyeOff, Type, Sparkles } from 'lucide-react';
import { AuthorInfo } from './AuthorInfo';

interface BlogPostReaderProps {
  post: BlogPost;
  onBack: () => void;
  allPosts: BlogPost[];
  onSelectPost: (postId: string) => void;
}

export function BlogPostReader({ post, onBack, allPosts, onSelectPost }: BlogPostReaderProps) {
  // Reading preference states
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [distractionFree, setDistractionFree] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Monitor scroll progression for Medium-style reading indicators
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Back to top on post change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [post.id]);

  const fontStyleClass = fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  // Extract related posts based on matching tags
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 2);

  const isStealth = distractionFree;

  return (
    <div className={`relative pb-24 select-text transition-colors ${isStealth ? 'bg-[#f7f2e8] text-[#231f18] dark:bg-[#101214] dark:text-zinc-100' : 'font-sans'}`}>
      
      {/* Scroll indicator */}
      {isStealth ? (
        <div className="fixed top-[64px] left-0 right-0 z-50 h-1 bg-[#e0d1b9] shadow-inner dark:bg-zinc-800">
          <div
            className="h-full bg-[#6c5136] transition-all duration-75 dark:bg-[#b38c63]"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      ) : (
        <div className="fixed top-[64px] left-0 right-0 z-30 h-1 bg-gray-100 dark:bg-zinc-900">
          <div
            className="h-full bg-emerald-500 transition-all duration-75"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* Reader Toolbox wrapper - Sticky relative widget */}
      <div className={`mx-auto my-6 flex flex-wrap items-center gap-4 px-4 md:px-6 py-3 text-sm ${isStealth ? 'max-w-3xl justify-between border-b border-[#d9cdb6] dark:border-zinc-800 text-[#6c5f4f]' : 'max-w-4xl justify-between border-b border-stone-100 dark:border-zinc-900/60 text-stone-500 font-sans'}`}>
        
        {/* Back navigation */}
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 font-semibold transition-colors px-4 py-2 rounded-xl border active:scale-95 text-[0.95rem] ${
            isStealth
              ? 'bg-black/5 border-black/10 hover:bg-black/10 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10'
              : 'hover:text-emerald-600 dark:hover:text-emerald-400 bg-stone-50 dark:bg-zinc-900 border-stone-200/20'
          }`}
        >
          <ArrowLeft size={15} />
          <span>Back to posts</span>
        </button>

        {!isStealth ? (
          <div className="flex items-center gap-3 bg-stone-50 dark:bg-zinc-900/80 p-2 rounded-xl border border-stone-200/10 shadow-sm">
          
          {/* Serif vs Sans Serif */}
          <button
            onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : 'serif')}
            className="flex items-center gap-2 px-3 py-2 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-xs uppercase font-mono font-bold"
            title="Toggle Serif & Sans Fonts"
          >
            <Type size={15} />
            <span>{fontFamily}</span>
          </button>

          {/* Distraction free toggle */}
          <button
            onClick={() => setDistractionFree(!distractionFree)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs uppercase font-mono font-bold ${
              distractionFree ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold' : 'hover:bg-stone-200 dark:hover:bg-zinc-800'
            }`}
            title="Toggle Distraction-free Reader Layout"
          >
            {distractionFree ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>Stealth Reading</span>
          </button>

          </div>
        ) : (
          <button
            onClick={() => setDistractionFree(false)}
            className="flex items-center gap-2 rounded-full border border-[#d9cdb6] bg-[#f1e8d8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f513d] transition-colors hover:bg-[#e8ddca] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Eye size={14} />
            Exit Stealth
          </button>
        )}

      </div>

      {/* Main post canvas */}
      <article className={`mx-auto px-4 md:px-0 mt-8 ${isStealth ? 'max-w-2xl lg:max-w-3xl' : 'max-w-3xl'} ${fontStyleClass}`}>
        
        {/* Category tags */}
        {!isStealth && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, i) => (
              <span 
                key={i} 
                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 font-sans tracking-tight text-xs px-3 py-1 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className={`font-bold leading-tight tracking-tight mb-6 ${isStealth ? 'text-2xl sm:text-3xl text-[#201911] dark:text-zinc-50 font-serif' : 'text-3xl sm:text-4.5xl text-stone-900 dark:text-white font-sans'}`}>
          {post.title}
        </h1>

        {/* Author Board */}
        {!isStealth && <AuthorInfo author={post.author} readTime={post.readTime} />}

        {/* Cover Image */}
        {!isStealth && post.coverImage && (
          <div className="my-8 rounded-2xl overflow-hidden border border-stone-200/55 dark:border-zinc-800 shadow bg-zinc-100 dark:bg-zinc-900">
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full h-80 sm:h-96 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Markdown Render Content dynamic payload */}
        <div className={`markdown-body ${isStealth ? 'text-[#231f18] dark:text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
          <MarkdownRenderer content={post.content} fontFamilyClass={fontStyleClass} />
        </div>

      </article>

      {/* Related Posts Recommendation Row */}
      {!isStealth && relatedPosts.length > 0 && (
        <section className="bg-stone-50/50 dark:bg-zinc-900/20 border-t border-stone-100 dark:border-zinc-900 mt-16 pt-12 pb-6">
          <div className="max-w-4xl mx-auto px-4 md:px-0">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} className="text-emerald-500" />
              <h3 className="text-lg font-bold text-stone-950 dark:text-white font-sans">
                More posts
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <div 
                  key={related.id}
                  onClick={() => onSelectPost(related.id)}
                  className="p-5 bg-white dark:bg-zinc-950 border border-stone-100 dark:border-zinc-800/80 rounded-2xl cursor-pointer hover:border-emerald-500/30 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase block mb-1">
                    {related.tags[0]}
                  </span>
                  <h4 className="font-semibold text-sm text-stone-900 dark:text-white line-clamp-2 leading-snug hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {related.title}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-stone-400 mt-3 pt-3 border-t border-stone-50 dark:border-zinc-905">
                    <span>{related.date}</span>
                    <span className="font-semibold text-emerald-600">Read &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
