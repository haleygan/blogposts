/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { BlogPostMeta } from './types';
import { DEFAULT_POSTS } from './data/defaultPosts';
import { MainHeader } from './components/MainHeader';
import { BlogpostCard } from './components/BlogpostCard';
import { BlogPostReader } from './components/BlogPostReader';

export default function App() {
  const [posts] = useState<BlogPostMeta[]>(DEFAULT_POSTS);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/post/')) {
      const pathPart = hash.slice(7);
      return pathPart.split('#')[0] || null;
    }
    return null;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const activePost = posts.find((post) => post.id === selectedPostId);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/post/')) {
        const pathPart = hash.slice(7);
        const parts = pathPart.split('#');
        const postId = parts[0] || null;
        const headingId = parts[1] || null;

        setSelectedPostId(postId);

        if (headingId) {
          window.requestAnimationFrame(() => {
            const element = document.getElementById(headingId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          });
        }
      } else {
        setSelectedPostId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const openPost = (postId: string) => {
    window.location.hash = `#/post/${postId}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const scrollToPosts = () => {
    window.location.hash = '#/';
    setSelectedPostId(null);
    window.requestAnimationFrame(() => {
      document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="min-h-screen font-sans bg-white text-[#292929]">
      <MainHeader onPostsClick={scrollToPosts} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedPostId && activePost ? (
          <BlogPostReader
            post={activePost}
            onBack={() => window.location.hash = '#/'}
            allPosts={posts}
            onSelectPost={openPost}
          />
        ) : (
          <div id="posts" className="space-y-8 pb-16">
            <section className="flex flex-col gap-5 pb-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Posts
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                    Technical dumps
                  </h1>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-stone-500">
                  Stuff I spent time on.
                </p>
              </div>

              <div className="relative w-full max-w-md">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search titles, tags, or phrases..."
                  className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-9 pr-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </section>

            <div className="h-[2px] w-full bg-stone-200 -mt-2 mb-6" />

            {filteredPosts.length > 0 ? (
              <div className="grid gap-6">
                {filteredPosts.map((post) => (
                  <BlogpostCard key={post.id} post={post} onSelect={openPost} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-lg shadow-stone-200/30">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                  <BookOpen size={18} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">
                  No posts match that search
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
                  Try a different keyword or clear the search box to bring the full feed back.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200/70 py-8 text-center text-xs text-stone-400">
        What's going on?
      </footer>
    </div>
  );
}
