import React, { useState, useMemo, useCallback, useRef, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { Check, Copy, Link2 } from 'lucide-react';
import { DIAGRAMS } from './diagrams/index';
import { ErrorBoundary } from '../ErrorBoundary';

interface MarkdownRendererProps {
  content: string;
  fontFamilyClass?: string;
  postId?: string;
}

function preprocessDiagramTags(md: string): string {
  return md.replace(/<Diagram\s+id="([^"]+)"\s*\/?>/g, '<diagram id="$1"></diagram>');
}

const BODY_TEXT = 'text-[1.1rem] md:text-[1.2rem] leading-[1.8]';

function DiagramSlot({ id }: { id?: string }) {
  if (!id) return null;
  const Comp = DIAGRAMS[id];
  if (!Comp) {
    return <p className="text-xs text-red-400 font-mono my-2">[diagram not found: {id}]</p>;
  }
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-32 animate-pulse bg-stone-100 rounded-2xl my-8" />}>
        <Comp />
      </Suspense>
    </ErrorBoundary>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard permission denied — silently ignore
    }
  }, [code]);

  return (
    <div className="relative group my-6 border border-stone-200/50 rounded-xl overflow-hidden bg-zinc-900 shadow-lg font-mono text-zinc-200 text-sm">
      <div className="flex justify-between items-center px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-zinc-400 select-none text-xs">
        <span className="font-semibold tracking-wider uppercase text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-white/80">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/10 active:scale-95"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  fontFamilyClass = 'font-serif',
  postId,
}: MarkdownRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxOffset, setLightboxOffset] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{
    startX: number; startY: number; originX: number; originY: number;
  } | null>(null);
  // Ref so heading components can read the copied id without being recreated on each change
  const copiedHeadingIdRef = useRef<string | null>(null);
  const [, forceHeadingUpdate] = useState(0);

  const baseUrl = import.meta.env.BASE_URL ?? '/';
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!lightboxImage) return;
    lightboxCloseRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lightboxImage]);

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightboxImage({ src, alt });
    setLightboxScale(1);
    setLightboxOffset({ x: 0, y: 0 });
    setDragState(null);
  }, []);

  const adjustScale = useCallback((delta: number) => {
    setLightboxScale(current => {
      const next = Number((current + delta).toFixed(2));
      if (next <= 1) { setLightboxOffset({ x: 0, y: 0 }); return 1; }
      return Math.min(4, Math.max(1, next));
    });
  }, []);

  const copyHeadingLink = useCallback(async (headingId: string) => {
    const postSegment = postId ? `#/post/${postId}` : '';
    const url = `${window.location.origin}${window.location.pathname}${postSegment}#${headingId}`;
    try {
      await navigator.clipboard.writeText(url);
      copiedHeadingIdRef.current = headingId;
      forceHeadingUpdate(n => n + 1);
      window.setTimeout(() => {
        if (copiedHeadingIdRef.current === headingId) {
          copiedHeadingIdRef.current = null;
          forceHeadingUpdate(n => n + 1);
        }
      }, 1500);
    } catch {
      // clipboard permission denied — silently ignore
    }
  }, [postId]);

  const resolveUrl = useCallback((url: string) => {
    if (/^(https?:|data:|blob:|mailto:|tel:|#)/.test(url)) return url;
    const normalized = url.replace(/^(\.\.\/|\.\/|\/)+/, '');
    return `${baseUrl.replace(/\/?$/, '/')}${normalized}`;
  }, [baseUrl]);

  const processedContent = useMemo(() => preprocessDiagramTags(content), [content]);

  const makeHeading = useCallback((level: 1 | 2 | 3 | 4) => {
    const headingClasses: Record<number, string> = {
      1: 'text-3xl md:text-4xl font-bold font-sans text-stone-900 tracking-tight',
      2: 'text-2xl md:text-3xl font-bold font-sans text-stone-800 tracking-tight',
      3: 'text-xl md:text-2xl font-bold font-sans text-stone-800',
      4: 'text-lg md:text-xl font-bold font-sans text-stone-800',
    };
    const spacingClasses: Record<number, string> = {
      1: 'mt-10 mb-8', 2: 'mt-9 mb-7', 3: 'mt-8 mb-6', 4: 'mt-7 mb-5',
    };

    return function HeadingComponent({ id, children }: { id?: string; children?: React.ReactNode }) {
      const headingId = id ?? '';
      const postSegment = postId ? `#/post/${postId}` : '';
      const isCopied = copiedHeadingIdRef.current === headingId;
      return (
        <div id={headingId} className={`${spacingClasses[level]} scroll-mt-28`}>
          <div className="group flex items-start gap-2">
            <a href={`${postSegment}#${headingId}`} className="block flex-1" title="Link to this section">
              {React.createElement(`h${level}`, { className: headingClasses[level] }, children)}
            </a>
            <button
              type="button"
              onClick={() => copyHeadingLink(headingId)}
              className="mt-1 inline-flex shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white p-2 text-stone-400 transition-colors hover:border-emerald-500/30 hover:text-emerald-600"
              title="Copy link to this section"
            >
              {isCopied ? <Check size={13} /> : <Link2 size={13} />}
            </button>
          </div>
          <div className="mt-4 border-t border-stone-200/80" />
        </div>
      );
    };
  // copiedHeadingIdRef is a ref — stable reference, no dep needed; forceHeadingUpdate triggers re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copyHeadingLink, postId]);

  const components = useMemo(() => ({
    h1: makeHeading(1),
    h2: makeHeading(2),
    h3: makeHeading(3),
    h4: makeHeading(4),

    p: ({ children }: { children?: React.ReactNode }) => (
      <p className={`my-7 text-[#292929] ${fontFamilyClass} ${BODY_TEXT} tracking-normal font-light`}>
        {children}
      </p>
    ),

    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className={`list-disc pl-6 space-y-3 my-6 text-stone-900 ${fontFamilyClass} ${BODY_TEXT}`}>{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className={`list-decimal pl-6 space-y-3 my-6 text-stone-900 ${fontFamilyClass} ${BODY_TEXT}`}>{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => <li className="pl-1">{children}</li>,

    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className={`border-l-4 border-emerald-500 pl-4 py-1.5 my-6 italic text-stone-700 bg-emerald-50/30 rounded-r ${BODY_TEXT}`}>
        {children}
      </blockquote>
    ),

    hr: () => <hr className="my-8 border-t border-stone-200" />,

    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-6 overflow-x-auto border border-stone-200 rounded-lg">
        <table className={`min-w-full divide-y divide-stone-200 text-left ${BODY_TEXT}`}>{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-stone-50">{children}</thead>,
    tbody: ({ children }: { children?: React.ReactNode }) => <tbody className="divide-y divide-stone-200 bg-white">{children}</tbody>,
    tr: ({ children }: { children?: React.ReactNode }) => <tr className="hover:bg-stone-50 transition-colors">{children}</tr>,
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="px-4 py-3 font-semibold text-stone-900 uppercase tracking-wider text-xs border-r border-stone-200 last:border-0">{children}</th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="px-4 py-3 text-stone-900 border-r border-stone-200 last:border-0">{children}</td>
    ),

    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-stone-900">{children}</em>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
      const isExternal = !!href && /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          className="underline decoration-2 underline-offset-2 decoration-current/60 hover:decoration-current/90 transition-all"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
      );
    },

    code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
      const lang = /language-(\w+)/.exec(className ?? '')?.[1] ?? '';
      if (lang || className?.startsWith('language-')) {
        const code = String(children ?? '').replace(/\n$/, '');
        return <CodeBlock code={code} language={lang} />;
      }
      return (
        <code className="bg-stone-100 px-1.5 py-0.5 rounded text-sm text-amber-700 font-mono font-semibold">
          {children}
        </code>
      );
    },

    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,

    img: ({ src, alt }: { src?: string; alt?: string }) => {
      const resolved = resolveUrl(src ?? '');
      return (
        <button
          type="button"
          onClick={() => openLightbox(resolved, alt ?? '')}
          className="group my-8 block w-full overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm transition-colors hover:border-emerald-500/30"
          title="Open image in a lightbox"
        >
          <figure>
            <img
              src={resolved}
              alt={alt ?? ''}
              className="h-[340px] w-full object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.04] cursor-zoom-in md:h-[420px] md:p-6 md:group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          </figure>
        </button>
      );
    },

    // Custom diagram element rendered from preprocessed <diagram id="..."> tags
    diagram: (props: React.HTMLAttributes<HTMLElement>) => (
      <DiagramSlot id={props.id} />
    ),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [makeHeading, fontFamilyClass, resolveUrl, openLightbox]);

  return (
    <>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={components as never}
      >
        {processedContent}
      </ReactMarkdown>

      {lightboxImage && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.alt}
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative flex h-[96vh] w-[98vw] max-w-[98vw] flex-col gap-3">
            <div
              className="flex items-center justify-between rounded-2xl bg-black/40 px-3 py-2 text-white shadow-lg backdrop-blur"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Image Viewer</div>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20" onClick={() => adjustScale(-0.25)}>-</button>
                <button type="button" className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20" onClick={() => { setLightboxScale(1); setLightboxOffset({ x: 0, y: 0 }); }}>Reset</button>
                <button type="button" className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20" onClick={() => adjustScale(0.25)}>+</button>
                <button ref={lightboxCloseRef} type="button" className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20" onClick={() => setLightboxImage(null)}>Close</button>
              </div>
            </div>

            <div
              className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl"
              onClick={() => setLightboxImage(null)}
              onWheel={(e) => { e.preventDefault(); adjustScale(e.deltaY > 0 ? -0.12 : 0.12); }}
              onPointerDown={(e) => {
                if (lightboxScale <= 1) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                setDragState({ startX: e.clientX, startY: e.clientY, originX: lightboxOffset.x, originY: lightboxOffset.y });
              }}
              onPointerMove={(e) => {
                if (!dragState) return;
                setLightboxOffset({ x: dragState.originX + (e.clientX - dragState.startX), y: dragState.originY + (e.clientY - dragState.startY) });
              }}
              onPointerUp={() => setDragState(null)}
              onPointerCancel={() => setDragState(null)}
              onPointerLeave={() => setDragState(null)}
            >
              <img
                src={lightboxImage.src}
                alt={lightboxImage.alt}
                className={`absolute left-1/2 top-1/2 max-h-[92vh] max-w-[96vw] select-none rounded-2xl bg-white object-contain shadow-2xl ${lightboxScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                style={{
                  transform: `translate(calc(-50% + ${lightboxOffset.x}px), calc(-50% + ${lightboxOffset.y}px)) scale(${lightboxScale})`,
                  transition: dragState ? 'none' : 'transform 120ms ease-out',
                }}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
});
