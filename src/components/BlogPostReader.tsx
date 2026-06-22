/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BlogPostMeta } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArrowLeft, Type, Sparkles } from 'lucide-react';
import { AuthorInfo } from './AuthorInfo';
import { CONTENT_LOADERS } from '../data/defaultPosts';

interface BlogPostReaderProps {
  post: BlogPostMeta;
  onBack: () => void;
  allPosts: BlogPostMeta[];
  onSelectPost: (postId: string) => void;
}

export function BlogPostReader({ post, onBack, allPosts, onSelectPost }: BlogPostReaderProps) {
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    setContent(null);
    const loader = CONTENT_LOADERS[post.id];
    if (loader) loader().then(setContent);
  }, [post.id]);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [post.id]);

  const fontStyleClass = fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 2);

  return (
    <div className="relative pb-24 select-text font-sans">

      {/* Scroll progress bar */}
      <div className="fixed top-[4.75rem] left-0 right-0 z-50 h-[2px] bg-[#e5e7eb]">
        <div
          className="h-full bg-[#0d9488] transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reader toolbar */}
      <div className="mx-auto my-6 flex flex-wrap items-center gap-4 px-4 md:px-6 py-3 text-sm max-w-3xl justify-between border-b border-stone-100 text-stone-500 font-sans">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-semibold transition-colors px-4 py-2 rounded-xl border active:scale-95 text-[0.95rem] hover:text-emerald-600 bg-stone-50 border-stone-200/40"
        >
          <ArrowLeft size={15} />
          <span>Back to posts</span>
        </button>

        <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-xl border border-stone-200/20 shadow-sm">
          <button
            onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : 'serif')}
            className="flex items-center gap-2 px-3 py-2 hover:bg-stone-200 rounded-lg transition-colors text-xs uppercase font-mono font-bold"
            title="Toggle Serif & Sans Fonts"
          >
            <Type size={15} />
            <span>{fontFamily}</span>
          </button>
        </div>
      </div>

      {/* Main post canvas */}
      <article className={`mx-auto px-4 md:px-0 mt-8 max-w-3xl ${fontStyleClass}`}>

        {/* Category tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className="bg-emerald-50 text-emerald-800 font-sans tracking-tight text-xs px-3 py-1 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="font-bold leading-tight tracking-tight mb-6 font-sans text-4xl sm:text-5xl text-stone-900">
          {post.title}
        </h1>

        {/* Author */}
        <AuthorInfo author={post.author} readTime={post.readTime} />

        {/* Cover Image */}
        {post.coverImage && (
          <div className="my-8 rounded-2xl overflow-hidden border border-stone-200/55 shadow bg-stone-100">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-80 sm:h-96 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Content */}
        <div className="markdown-body text-[#292929]">
          {content === null ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-stone-100 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
            </div>
          ) : (
            <MarkdownRenderer content={content} fontFamilyClass={fontStyleClass} postId={post.id} />
          )}
        </div>

      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-stone-50/50 border-t border-stone-100 mt-16 pt-12 pb-6">
          <div className="max-w-3xl mx-auto px-4 md:px-0">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} className="text-emerald-500" />
              <h3 className="text-lg font-bold text-stone-950 font-sans">More posts</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <div
                  key={related.id}
                  onClick={() => onSelectPost(related.id)}
                  className="p-5 bg-white border border-stone-100 rounded-2xl cursor-pointer hover:border-emerald-500/30 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase block mb-1">
                    {related.tags[0]}
                  </span>
                  <h4 className="font-semibold text-sm text-stone-900 line-clamp-2 leading-snug transition-colors">
                    {related.title}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-stone-400 mt-3 pt-3 border-t border-stone-100">
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
