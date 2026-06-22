import React, { useState, useEffect, useRef, useCallback, useDeferredValue, Suspense } from 'react';
import { BookOpen, Search } from 'lucide-react';
import type { BlogPostMeta } from './types';
import { SITE_AUTHOR } from './data/siteAuthor';
import { MainHeader } from './components/MainHeader';
import { BlogpostCard } from './components/BlogpostCard';

const BlogPostReader = React.lazy(() => import('./components/BlogPostReader').then(m => ({ default: m.BlogPostReader })));

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/post/')) return hash.slice(7).split('#')[0] || null;
    return null;
  });
  const [postContent, setPostContent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);

  const contentCache = useRef(new Map<string, string>());

  useEffect(() => {
    fetch(`${BASE}/posts-index.json`)
      .then(r => r.json())
      .then((data: Omit<BlogPostMeta, 'author'>[]) => {
        const sorted = data
          .map(p => ({ ...p, author: SITE_AUTHOR }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPosts(sorted);
      })
      .catch(() => {});
  }, []);

  const fetchContent = useCallback(async (id: string): Promise<string> => {
    if (contentCache.current.has(id)) return contentCache.current.get(id)!;
    const text = await fetch(`${BASE}/posts/${id}.md`).then(r => r.text());
    contentCache.current.set(id, text);
    return text;
  }, []);

  const prefetchPost = useCallback((id: string) => {
    if (contentCache.current.has(id)) return;
    fetchContent(id).catch(() => {});
  }, [fetchContent]);

  useEffect(() => {
    if (!selectedPostId) { setPostContent(null); return; }
    setPostContent(null);
    fetchContent(selectedPostId).then(setPostContent).catch(() => setPostContent(''));
  }, [selectedPostId, fetchContent]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/post/')) {
        const parts = hash.slice(7).split('#');
        setSelectedPostId(parts[0] || null);
        const headingId = parts[1];
        if (headingId) {
          window.requestAnimationFrame(() => {
            document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth' });
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

  const activePost = posts.find(p => p.id === selectedPostId);

  const filteredPosts = posts.filter(post => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const openPost = useCallback((postId: string) => {
    window.location.hash = `#/post/${postId}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const scrollToPosts = useCallback(() => {
    window.location.hash = '#/';
    setSelectedPostId(null);
    window.requestAnimationFrame(() => {
      document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  return (
    <div className="min-h-screen font-sans bg-white text-[#292929]">
      <MainHeader onPostsClick={scrollToPosts} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedPostId && activePost ? (
          <Suspense fallback={
            <div className="space-y-4 animate-pulse mt-12 max-w-3xl mx-auto">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-stone-100 rounded" style={{ width: `${60 + (i % 4) * 10}%` }} />
              ))}
            </div>
          }>
            <BlogPostReader
              post={activePost}
              content={postContent}
              onBack={() => { window.location.hash = '#/'; }}
              allPosts={posts}
              onSelectPost={openPost}
            />
          </Suspense>
        ) : (
          <div id="posts" className="space-y-8 pb-16">
            <section className="flex flex-col gap-5 pb-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Posts</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                    Technical dumps
                  </h1>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-stone-500">Stuff I spent time on.</p>
              </div>

              <div className="relative w-full max-w-md">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search titles, tags, or phrases..."
                  className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-9 pr-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </section>

            <div className="h-[2px] w-full bg-stone-200 -mt-2 mb-6" />

            {filteredPosts.length > 0 ? (
              <div className="grid gap-6">
                {filteredPosts.map(post => (
                  <BlogpostCard key={post.id} post={post} onSelect={openPost} onPrefetch={prefetchPost} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-lg shadow-stone-200/30">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                  <BookOpen size={18} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">No posts match that search</h3>
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
