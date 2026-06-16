/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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

  // Helper to parse inline styles: Bold, Italic, Code, Links
  const parseInlineStyles = (text: string): React.ReactNode[] => {
    if (!text) return [null];

    // Simple parser for inline tokens
    const tokens: Array<{ type: 'text' | 'bold' | 'italic' | 'code' | 'link'; text: string; href?: string }> = [];
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
      <Tag key={`list-${index}`} className={`${listStyle} space-y-2 my-4 text-gray-700 dark:text-gray-300 ${fontFamilyClass} text-base md:text-lg leading-relaxed`}>
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
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-sm md:text-base">
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

    // 5. HEADINGS
    if (trimmedLine.startsWith('# ')) {
      components.push(
        <h1 key={`h1-${i}`} className="text-3xl md:text-4xl font-bold font-sans text-gray-900 dark:text-white mt-8 mb-4 tracking-tight">
          {parseInlineStyles(trimmedLine.slice(2))}
        </h1>
      );
      continue;
    }
    if (trimmedLine.startsWith('## ')) {
      components.push(
        <h2 key={`h2-${i}`} className="text-2xl md:text-3xl font-bold font-sans text-zinc-800 dark:text-zinc-100 mt-6 mb-3 tracking-tight border-b border-light-divider pb-2 dark:border-zinc-800">
          {parseInlineStyles(trimmedLine.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmedLine.startsWith('### ')) {
      components.push(
        <h3 key={`h3-${i}`} className="text-xl md:text-2xl font-bold font-sans text-zinc-800 dark:text-zinc-100 mt-5 mb-2.5">
          {parseInlineStyles(trimmedLine.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmedLine.startsWith('#### ')) {
      components.push(
        <h4 key={`h4-${i}`} className="text-lg md:text-xl font-bold font-sans text-zinc-800 dark:text-zinc-100 mt-4 mb-2">
          {parseInlineStyles(trimmedLine.slice(5))}
        </h4>
      );
      continue;
    }

    // 6. BLOCKQUOTE
    if (trimmedLine.startsWith('> ')) {
      components.push(
        <blockquote key={`quote-${i}`} className="border-l-4 border-emerald-500 pl-4 py-1.5 my-6 italic text-gray-700 dark:text-gray-300 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-r text-lg md:text-xl">
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
      <p key={`p-${i}`} className={`my-4 text-gray-800 dark:text-zinc-200 ${fontFamilyClass} text-lg md:text-xl leading-relaxed tracking-normal font-light`}>
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

  return <div className="space-y-4">{components}</div>;
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
