/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Calendar, Clock3, Search, Sparkles } from 'lucide-react';
import { BlogPost } from './types';
import { DEFAULT_POSTS } from './data/defaultPosts';
import { MainHeader } from './components/MainHeader';
import { BlogpostCard } from './components/BlogpostCard';
import { BlogPostReader } from './components/BlogPostReader';

type View = 'home' | 'posts';

export default function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [posts] = useState<BlogPost[]>(DEFAULT_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('blogposts-dark-mode');
    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'true');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('blogposts-dark-mode', String(darkMode));
  }, [darkMode]);

  const activePost = posts.find((post) => post.id === selectedPostId);
  const featuredPost = posts[0];

  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const openPost = (postId: string) => {
    setSelectedPostId(postId);
    setActiveView('posts');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 dark:bg-zinc-950 dark:text-zinc-200 transition-colors duration-300 font-sans">
      <MainHeader
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((value) => !value)}
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setSelectedPostId(null);
        }}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedPostId && activePost ? (
          <BlogPostReader
            post={activePost}
            onBack={() => setSelectedPostId(null)}
            allPosts={posts}
            onSelectPost={(id) => setSelectedPostId(id)}
          />
        ) : activeView === 'home' ? (
          <div className="space-y-8 pb-16">
            <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <article className="relative overflow-hidden rounded-3xl border border-stone-200/50 dark:border-zinc-900 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(39,39,42,0.92))]" />
                <div className="relative p-7 sm:p-10 lg:p-12">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    <Sparkles size={12} />
                    Latest draft
                  </span>
                  <h1 className="mt-5 max-w-3xl font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
                    {featuredPost.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-300">
                    {featuredPost.excerpt}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={() => openPost(featuredPost.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <BookOpen size={15} />
                      Read the post
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => setActiveView('posts')}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      Browse all notes
                    </button>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {featuredPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-zinc-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>

              <aside className="grid gap-4">
                <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-lg shadow-stone-200/40 dark:border-zinc-900 dark:bg-zinc-900/30 dark:shadow-none">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                    What this site is for
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-zinc-300">
                    A place to jot down technical findings, keep the flow conversational, and drop screenshots where the UI matters.
                  </p>
                </div>

                <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-lg shadow-stone-200/40 dark:border-zinc-900 dark:bg-zinc-900/30 dark:shadow-none">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-white">
                    <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-stone-500 dark:text-zinc-400">
                    <Clock3 size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-stone-500 dark:text-zinc-400">
                    The WIF article is already wired in as the first post, so the homepage can lead straight into the reader.
                  </p>
                </div>

                <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-lg shadow-stone-200/40 dark:border-zinc-900 dark:bg-zinc-900/30 dark:shadow-none">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                    Screenshot note
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-zinc-300">
                    Leave your UI screenshots in the post where the setup steps mention them. The reader already handles inline markdown cleanly.
                  </p>
                </div>
              </aside>
            </section>

            <section className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-stone-200/70 pb-5 dark:border-zinc-900 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                    Recent notes
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
                    What I'm writing about
                  </h2>
                </div>

                <button
                  onClick={() => setActiveView('posts')}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
                >
                  Open the article feed
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid gap-6">
                {posts.map((post) => (
                  <BlogpostCard key={post.id} post={post} onSelect={openPost} />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-8 pb-16">
            <section className="flex flex-col gap-5 border-b border-stone-200/70 pb-6 dark:border-zinc-900 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                    Article feed
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">
                    Technical writeups
                  </h1>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
                  Conversational notes, screenshots when they help, and the kind of explanations I wish more docs used.
                </p>
              </div>

              <div className="relative w-full max-w-md">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search posts, tags, or terms..."
                  className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-9 pr-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(posts.flatMap((post) => post.tags))).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {filteredPosts.length > 0 ? (
              <div className="grid gap-6">
                {filteredPosts.map((post) => (
                  <BlogpostCard key={post.id} post={post} onSelect={openPost} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-lg shadow-stone-200/30 dark:border-zinc-900 dark:bg-zinc-900/30 dark:shadow-none">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-zinc-900 dark:text-zinc-500">
                  <BookOpen size={18} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900 dark:text-white">
                  No matching posts
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
                  Try a different search term or clear the field to get the full list back.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200/70 py-8 text-center text-xs text-stone-400 dark:border-zinc-900 dark:text-zinc-500">
        Built for technical notes, screenshots, and less awkward explanations.
      </footer>
    </div>
  );
}
