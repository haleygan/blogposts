/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArrowLeft, Share2, Eye, EyeOff, Type, ZoomIn, ZoomOut, Check, Sparkles } from 'lucide-react';

interface BlogPostReaderProps {
  post: BlogPost;
  onBack: () => void;
  allPosts: BlogPost[];
  onSelectPost: (postId: string) => void;
}

export function BlogPostReader({ post, onBack, allPosts, onSelectPost }: BlogPostReaderProps) {
  // Reading preference states
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [distractionFree, setDistractionFree] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'prose-sm';
      case 'md': return 'prose';
      case 'lg': return 'prose-lg';
      case 'xl': return 'prose-xl';
      default: return 'prose';
    }
  };

  const fontStyleClass = fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  // Extract related posts based on matching tags
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 2);

  return (
    <div className="relative pb-24 font-sans select-text">
      
      {/* Scroll indicator */}
      <div className="fixed top-[64px] left-0 right-0 h-1 bg-gray-100 dark:bg-zinc-900 z-30">
        <div 
          className="h-full bg-emerald-500 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reader Toolbox wrapper - Sticky relative widget */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 my-6 flex flex-wrap justify-between items-center gap-4 py-2.5 border-b border-stone-100 dark:border-zinc-900/60 text-stone-500 font-sans text-xs">
        
        {/* Back navigation */}
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors bg-stone-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-stone-200/20 active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Back to posts</span>
        </button>

        {/* Floating Custom Display Widget */}
        <div className="flex items-center gap-3 bg-stone-50 dark:bg-zinc-900/80 p-1.5 rounded-xl border border-stone-200/10 shadow-sm">
          
          {/* Zoom controls */}
          <div className="flex items-center border-r border-stone-200 dark:border-zinc-800 pr-2">
            <button 
              onClick={() => {
                if (fontSize === 'xl') setFontSize('lg');
                else if (fontSize === 'lg') setFontSize('md');
                else if (fontSize === 'md') setFontSize('sm');
              }}
              disabled={fontSize === 'sm'}
              className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30"
              title="Decrease Font Size"
            >
              <ZoomOut size={13} />
            </button>
            <span className="w-8 text-center text-[10px] uppercase font-mono font-bold">{fontSize}</span>
            <button 
              onClick={() => {
                if (fontSize === 'sm') setFontSize('md');
                else if (fontSize === 'md') setFontSize('lg');
                else if (fontSize === 'lg') setFontSize('xl');
              }}
              disabled={fontSize === 'xl'}
              className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30"
              title="Increase Font Size"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Serif vs Sans Serif */}
          <button
            onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : 'serif')}
            className="flex items-center gap-1 px-2 py-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded transition-colors text-[10px] uppercase font-mono font-bold"
            title="Toggle Serif & Sans Fonts"
          >
            <Type size={13} />
            <span>{fontFamily}</span>
          </button>

          {/* Distraction free toggle */}
          <button
            onClick={() => setDistractionFree(!distractionFree)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-[10px] uppercase font-mono font-bold ${
              distractionFree ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold' : 'hover:bg-stone-200 dark:hover:bg-zinc-800'
            }`}
            title="Toggle Distraction-free Reader Layout"
          >
            {distractionFree ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>Stealth Reading</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded transition-colors relative"
            title="Copy post link to clipboard"
          >
            {shareCopied ? (
              <Check size={13} className="text-emerald-500" />
            ) : (
              <Share2 size={13} />
            )}
          </button>

        </div>

      </div>

      {/* Main post canvas */}
      <article className={`max-w-2xl mx-auto px-4 md:px-0 mt-8 ${getFontSizeClass()} ${fontStyleClass}`}>
        
        {/* Category tags */}
        {!distractionFree && (
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
        <h1 className="text-3xl sm:text-4.5xl font-bold text-stone-900 dark:text-white leading-tight font-sans tracking-tight mb-6">
          {post.title}
        </h1>

        {/* Author Board */}
        {!distractionFree && (
          <div className="flex items-center gap-3.5 pb-8 border-b border-stone-100 dark:border-zinc-900/60 mb-8 font-sans">
            {post.author.avatar && (
              <img 
                src={post.author.avatar} 
                alt={post.author.name} 
                className="w-11 h-11 rounded-full border border-stone-200 dark:border-zinc-800 object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900 dark:text-white text-sm">{post.author.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-stone-400 dark:text-zinc-500">{post.readTime}</span>
              </div>
              <p className="text-xs text-stone-400 dark:text-zinc-500 leading-snug font-light mt-0.5 max-w-md">
                {post.author.bio}
              </p>
            </div>
          </div>
        )}

        {/* Cover Image */}
        {!distractionFree && post.coverImage && (
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
        <div className="markdown-body text-zinc-900 dark:text-zinc-100">
          <MarkdownRenderer content={post.content} fontFamilyClass={fontStyleClass} />
        </div>

      </article>

      {/* Related Posts Recommendation Row */}
      {!distractionFree && relatedPosts.length > 0 && (
        <section className="bg-stone-50/50 dark:bg-zinc-900/20 border-t border-stone-100 dark:border-zinc-900 mt-16 pt-12 pb-6">
          <div className="max-w-3xl mx-auto px-4 md:px-0">
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
