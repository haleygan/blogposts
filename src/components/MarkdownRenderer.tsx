/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Link2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  fontFamilyClass?: string; // 'font-serif' or 'font-sans'
}

export function parseFrontmatter(markdown: string) {
  const frontmatter: Record<string, string> = {};
  let cleanMarkdown = markdown.trim();

  if (markdown.trim().startsWith('---')) {
    const endOfFrontmatter = markdown.indexOf('---', 3);
    if (endOfFrontmatter !== -1) {
      const rawFrontmatter = markdown.substring(3, endOfFrontmatter);
      cleanMarkdown = markdown.substring(endOfFrontmatter + 3).trim();

      const lines = rawFrontmatter.split('\n');
      lines.forEach((line) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const key = line.substring(0, colonIndex).trim();
          const val = line.substring(colonIndex + 1).trim();
          frontmatter[key] = val;
        }
      });
    }
  }

  return { frontmatter, content: cleanMarkdown };
}

export function MarkdownRenderer({ content, fontFamilyClass = 'font-serif' }: MarkdownRendererProps) {
  // Extract and strip frontmatter to ensure clean content rendering
  const { content: cleanContent } = parseFrontmatter(content);
  const bodyTextClass = 'text-[0.98rem] md:text-[1.05rem] leading-relaxed';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const defaultLightboxScale = 1;
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [lightboxScale, setLightboxScale] = useState(defaultLightboxScale);
  const [lightboxOffset, setLightboxOffset] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [copiedHeadingId, setCopiedHeadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxImage) return;
    setLightboxScale(defaultLightboxScale);
    setLightboxOffset({ x: 0, y: 0 });
    setDragState(null);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const adjustLightboxScale = (delta: number) => {
    setLightboxScale((current) => {
      const next = Number((current + delta).toFixed(2));
      if (next <= defaultLightboxScale) {
        setLightboxOffset({ x: 0, y: 0 });
        return defaultLightboxScale;
      }
      return clamp(next, 1, 4);
    });
  };

  const copyHeadingLink = async (headingId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${headingId}`;
    await navigator.clipboard.writeText(url);
    setCopiedHeadingId(headingId);
    window.setTimeout(() => {
      setCopiedHeadingId((current) => (current === headingId ? null : current));
    }, 1500);
  };

  const resolveMarkdownUrl = (url: string) => {
    if (/^(https?:|data:|blob:|mailto:|tel:|#)/.test(url)) {
      return url;
    }

    const normalized = url
      .replace(/^(\.\.\/)+/, '')
      .replace(/^(\.\/)+/, '')
      .replace(/^\/+/, '');

    return `${baseUrl.replace(/\/?$/, '/')}${normalized}`;
  };

  // Simple, robust lines-based parsing to turn Markdown into React Components styled with Tailwind CSS
  const lines = cleanContent.split('\n');
  const components: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockLines: string[] = [];

  let inList = false;
  let listItems: string[] = [];
  let isOrderedList = false;

  let inTable = false;
  let tableRows: string[][] = [];
  const headingSlugCounts = new Map<string, number>();

  // Helper to parse inline styles: Bold, Italic, Code, Links
  const parseInlineStyles = (text: string): React.ReactNode[] => {
    if (!text) return [null];

    // Simple parser for inline tokens
    const tokens: Array<{ type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'image'; text: string; href?: string; alt?: string }> = [];
    let currentIdx = 0;

    while (currentIdx < text.length) {
      // Bold Check: **bold** or __bold__
      const boldMatch = text.slice(currentIdx).match(/^(\*\*|__)(.*?)\1/);
      if (boldMatch) {
        tokens.push({ type: 'bold', text: boldMatch[2] });
        currentIdx += boldMatch[0].length;
        continue;
      }

      // Italic Check: *italic* or _italic_
      const italicMatch = text.slice(currentIdx).match(/^(\*|_)(.*?)\1/);
      if (italicMatch && !italicMatch[2].startsWith('*')) {
        tokens.push({ type: 'italic', text: italicMatch[2] });
        currentIdx += italicMatch[0].length;
        continue;
      }

      // Inline Code Check: `code`
      const inlineCodeMatch = text.slice(currentIdx).match(/^`(.*?)`/);
      if (inlineCodeMatch) {
        tokens.push({ type: 'code', text: inlineCodeMatch[1] });
        currentIdx += inlineCodeMatch[0].length;
        continue;
      }

      // Link Check: [text](href)
      const linkMatch = text.slice(currentIdx).match(/^\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        tokens.push({ type: 'link', text: linkMatch[1], href: linkMatch[2] });
        currentIdx += linkMatch[0].length;
        continue;
      }

      // Image Check: ![alt](src)
      const imageMatch = text.slice(currentIdx).match(/^!\[(.*?)\]\((.*?)\)/);
      if (imageMatch) {
        tokens.push({ type: 'image', text: imageMatch[1], href: imageMatch[2], alt: imageMatch[1] });
        currentIdx += imageMatch[0].length;
        continue;
      }

      // Plain char
      const lastToken = tokens[tokens.length - 1];
      if (lastToken && lastToken.type === 'text') {
        lastToken.text += text[currentIdx];
      } else {
        tokens.push({ type: 'text', text: text[currentIdx] });
      }
      currentIdx++;
    }

    return tokens.map((token, idx) => {
      const key = `${idx}-${token.text}`;
      switch (token.type) {
        case 'bold':
          return <strong key={key} className="font-bold text-gray-900 dark:text-white">{token.text}</strong>;
        case 'italic':
          return <em key={key} className="italic text-gray-800 dark:text-gray-300">{token.text}</em>;
        case 'code':
          return <code key={key} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm text-amber-700 dark:text-amber-400 font-mono font-semibold">{token.text}</code>;
        case 'link':
          return <a key={key} href={token.href} className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors" target="_blank" rel="noopener noreferrer">{token.text}</a>;
        case 'image':
          const imageSrc = resolveMarkdownUrl(token.href || '');
          return (
            <button
              key={key}
              type="button"
              onClick={() => setLightboxImage({ src: imageSrc, alt: token.alt || token.text })}
              className="group my-8 block w-full overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm transition-colors hover:border-emerald-500/30 dark:border-zinc-800 dark:bg-zinc-950"
              title="Open image in a lightbox"
            >
              <figure>
                <img
                  src={imageSrc}
                  alt={token.alt || token.text}
                  className="h-[340px] w-full object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.04] cursor-zoom-in md:h-[420px] md:p-6 md:group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </figure>
            </button>
          );
        default:
          return token.text;
      }
    });
  };

  const renderCodeBlock = (lines: string[], lang: string, index: number) => {
    const rawCode = lines.join('\n');
    return <CodeBlockComponent key={`code-${index}`} code={rawCode} language={lang} />;
  };

  const renderList = (items: string[], isOrdered: boolean, index: number) => {
    const Tag = isOrdered ? 'ol' : 'ul';
    const listStyle = isOrdered ? 'list-decimal pl-6' : 'list-disc pl-6';
    return (
      <Tag key={`list-${index}`} className={`${listStyle} space-y-2 my-4 text-gray-700 dark:text-gray-300 ${fontFamilyClass} ${bodyTextClass}`}>
        {items.map((item, id) => (
          <li key={id} className="pl-1">
            {parseInlineStyles(item)}
          </li>
        ))}
      </Tag>
    );
  };

  const renderTable = (rows: string[][], index: number) => {
    if (rows.length === 0) return null;
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(r => r.length > 0 && !r.every(val => val.trim().startsWith('-')));

    return (
      <div key={`table-${index}`} className="my-6 overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
        <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left ${bodyTextClass}`}>
          <thead className="bg-gray-50 dark:bg-zinc-900/50">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="px-4 py-3 font-semibold text-gray-900 dark:text-white uppercase tracking-wider text-xs border-r border-gray-200 dark:border-gray-800 last:border-0">
                  {header.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-zinc-950">
            {dataRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-zinc-900/30 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-800 last:border-0">
                    {parseInlineStyles(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderHeading = (
    level: 1 | 2 | 3 | 4,
    text: string,
    index: number,
  ) => {
    const baseSlug = text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const slugKey = baseSlug || 'section';
    const nextCount = (headingSlugCounts.get(slugKey) || 0) + 1;
    headingSlugCounts.set(slugKey, nextCount);
    const headingId = nextCount === 1 ? slugKey : `${slugKey}-${nextCount}`;

    const headingClasses = {
      1: 'text-3xl md:text-4xl font-bold font-sans text-gray-900 dark:text-white tracking-tight',
      2: 'text-2xl md:text-3xl font-bold font-sans text-zinc-800 dark:text-zinc-100 tracking-tight',
      3: 'text-xl md:text-2xl font-bold font-sans text-zinc-800 dark:text-zinc-100',
      4: 'text-lg md:text-xl font-bold font-sans text-zinc-800 dark:text-zinc-100',
    }[level];

    const spacingClasses = {
      1: 'mt-10 mb-8',
      2: 'mt-9 mb-7',
      3: 'mt-8 mb-6',
      4: 'mt-7 mb-5',
    }[level];

    return (
      <div key={`h${level}-${index}`} id={headingId} className={`${spacingClasses} scroll-mt-28`}>
        <div className="group flex items-start gap-2">
          <a href={`#${headingId}`} className="block flex-1" title="Link to this section">
            {React.createElement(
              `h${level}`,
              { className: `${headingClasses} transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400` },
              parseInlineStyles(text),
            )}
          </a>
          <button
            type="button"
            onClick={() => copyHeadingLink(headingId)}
            className="mt-1 inline-flex shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white p-2 text-stone-400 transition-colors hover:border-emerald-500/30 hover:text-emerald-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500 dark:hover:text-emerald-400"
            title="Copy link to this section"
          >
            {copiedHeadingId === headingId ? <Check size={13} /> : <Link2 size={13} />}
          </button>
        </div>
        <div className="mt-4 border-t border-stone-200/80 dark:border-zinc-800" />
      </div>
    );
  };

  // Main iteration loop
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 1. CODE BLOCK TOGGLE
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        components.push(renderCodeBlock(codeBlockLines, codeBlockLanguage, i));
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLanguage = '';
      } else {
        // Open code block
        inCodeBlock = true;
        codeBlockLanguage = trimmedLine.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 2. UNORDERED / ORDERED LIST TOGGLE
    const isUnorderedMatch = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ');
    const isOrderedMatch = trimmedLine.match(/^\d+\.\s/);

    if (isUnorderedMatch || isOrderedMatch) {
      if (!inList) {
        inList = true;
        isOrderedList = !!isOrderedMatch;
      }
      const itemText = isUnorderedMatch 
        ? trimmedLine.slice(2) 
        : trimmedLine.substring(trimmedLine.indexOf(' ') + 1);
      listItems.push(itemText);
      continue;
    } else {
      if (inList) {
        components.push(renderList(listItems, isOrderedList, i));
        inList = false;
        listItems = [];
      }
    }

    // 3. TABLE PROCESSING
    const isTableRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|');
    if (isTableRow) {
      if (!inTable) {
        inTable = true;
      }
      // Split by pipe and remove empty first/last elements
      const cells = trimmedLine.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    } else {
      if (inTable) {
        components.push(renderTable(tableRows, i));
        inTable = false;
        tableRows = [];
      }
    }

    // 4. EMPTY LINE SPACING
    if (trimmedLine === '') {
      continue;
    }

    // 5a. STANDALONE IMAGES
    const standaloneImageMatch = trimmedLine.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (standaloneImageMatch) {
      const imageSrc = resolveMarkdownUrl(standaloneImageMatch[2]);
      components.push(
        <button
          key={`img-${i}`}
          type="button"
          onClick={() => setLightboxImage({ src: imageSrc, alt: standaloneImageMatch[1] })}
          className="group my-8 block w-full overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm transition-colors hover:border-emerald-500/30 dark:border-zinc-800 dark:bg-zinc-950"
          title="Open image in a lightbox"
        >
          <figure>
            <img
              src={imageSrc}
              alt={standaloneImageMatch[1]}
              className="h-[340px] w-full object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.04] cursor-zoom-in md:h-[420px] md:p-6 md:group-hover:scale-[1.03]"
              loading="lazy"
            />
          </figure>
        </button>
      );
      continue;
    }

    // 5. HEADINGS
    if (trimmedLine.startsWith('# ')) {
      components.push(renderHeading(1, trimmedLine.slice(2), i));
      continue;
    }
    if (trimmedLine.startsWith('## ')) {
      components.push(renderHeading(2, trimmedLine.slice(3), i));
      continue;
    }
    if (trimmedLine.startsWith('### ')) {
      components.push(renderHeading(3, trimmedLine.slice(4), i));
      continue;
    }
    if (trimmedLine.startsWith('#### ')) {
      components.push(renderHeading(4, trimmedLine.slice(5), i));
      continue;
    }

    // 6. BLOCKQUOTE
    if (trimmedLine.startsWith('> ')) {
      components.push(
        <blockquote key={`quote-${i}`} className={`border-l-4 border-emerald-500 pl-4 py-1.5 my-6 italic text-gray-700 dark:text-gray-300 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-r ${bodyTextClass}`}>
          {parseInlineStyles(trimmedLine.slice(2))}
        </blockquote>
      );
      continue;
    }

    // 7. HORIZONTAL RULE
    if (trimmedLine === '---' || trimmedLine === '***') {
      components.push(
        <hr key={`hr-${i}`} className="my-8 border-t border-gray-200 dark:border-gray-800" />
      );
      continue;
    }

    // 8. PARAGRAPH (DEFAULT)
    components.push(
      <p key={`p-${i}`} className={`my-4 text-gray-800 dark:text-zinc-200 ${fontFamilyClass} ${bodyTextClass} tracking-normal font-light`}>
        {parseInlineStyles(trimmedLine)}
      </p>
    );
  }

  // Handle lists or tables remaining open at the end
  if (inList) {
    components.push(renderList(listItems, isOrderedList, lines.length));
  }
  if (inTable) {
    components.push(renderTable(tableRows, lines.length));
  }

  return (
    <>
      <div className="space-y-4">{components}</div>

      {lightboxImage &&
        createPortal(
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
                onClick={(event) => event.stopPropagation()}
              >
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                  Image Viewer
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                    onClick={() => adjustLightboxScale(-0.25)}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                    onClick={() => {
                      setLightboxScale(defaultLightboxScale);
                      setLightboxOffset({ x: 0, y: 0 });
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                    onClick={() => adjustLightboxScale(0.25)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                    onClick={() => setLightboxImage(null)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div
                className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl"
                onClick={() => setLightboxImage(null)}
                onWheel={(event) => {
                  event.preventDefault();
                  adjustLightboxScale(event.deltaY > 0 ? -0.12 : 0.12);
                }}
                onPointerDown={(event) => {
                  if (lightboxScale <= 1) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDragState({
                    startX: event.clientX,
                    startY: event.clientY,
                    originX: lightboxOffset.x,
                    originY: lightboxOffset.y,
                  });
                }}
                onPointerMove={(event) => {
                  if (!dragState) return;
                  setLightboxOffset({
                    x: dragState.originX + (event.clientX - dragState.startX),
                    y: dragState.originY + (event.clientY - dragState.startY),
                  });
                }}
                onPointerUp={() => setDragState(null)}
                onPointerCancel={() => setDragState(null)}
                onPointerLeave={() => setDragState(null)}
              >
                <img
                  src={lightboxImage.src}
                  alt={lightboxImage.alt}
                  className={`absolute left-1/2 top-1/2 max-h-[92vh] max-w-[96vw] select-none rounded-2xl bg-white object-contain shadow-2xl ${
                    lightboxScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
                  }`}
                  style={{
                    transform: `translate(calc(-50% + ${lightboxOffset.x}px), calc(-50% + ${lightboxOffset.y}px)) scale(${lightboxScale})`,
                    transition: dragState ? 'none' : 'transform 120ms ease-out',
                  }}
                  draggable={false}
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// Separate Mini Component to Handle Syntax-Highlighted Code Block Copy State
interface CodeBlockProps {
  code: string;
  language?: string;
  key?: string | number;
}

function CodeBlockComponent({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 border border-gray-200/50 dark:border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900 shadow-lg font-mono text-zinc-200 text-sm">
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
      <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <code>{code}</code>
      </pre>
    </div>
  );
}
