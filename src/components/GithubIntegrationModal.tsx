/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GithubConfig, BlogPost } from '../types';
import { Github, Folder, GitBranch, Key, Check, AlertCircle, HelpCircle, Loader, RefreshCw, Layers } from 'lucide-react';
import { parseFrontmatter } from './MarkdownRenderer';

interface GithubIntegrationModalProps {
  onClose: () => void;
  onImportsUpdated: (posts: BlogPost[], activeConfig: GithubConfig) => void;
  currentConfig?: GithubConfig;
}

export function GithubIntegrationModal({ onClose, onImportsUpdated, currentConfig }: GithubIntegrationModalProps) {
  const [config, setConfig] = useState<GithubConfig>(
    currentConfig || {
      owner: 'octocat',
      repo: 'Spoon-Knife',
      branch: 'main',
      folderPath: '',
      accessToken: '',
    }
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'instructions'>('settings');

  const handleFetchMarkdown = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessCount(null);

    const { owner, repo, branch, folderPath, accessToken } = config;

    if (!owner.trim() || !repo.trim()) {
      setErrorMessage("GitHub Owner and Repository Name are required.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch directory contents from Github REST API
      const cleanPath = folderPath.replace(/^\/+|\/+$/g, ''); // remove leading/trailing slashes
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}`;
      
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (accessToken && accessToken.trim()) {
        headers['Authorization'] = `token ${accessToken.trim()}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Repository or directory folder path not found. Please verify spelling, branch name, or repo visibility.");
        } else if (response.status === 403) {
          throw new Error("GitHub API rate limit exceeded or forbidden. Providing an optional personal access token will lift public rate limits.");
        } else {
          throw new Error(`GitHub API returned error status: ${response.status} ${response.statusText}`);
        }
      }

      const files = await response.json();
      if (!Array.isArray(files)) {
        throw new Error("The specified path does not represent a folder directory in this repository.");
      }

      // Filter only files ending with .md or .markdown
      const mdFiles = files.filter(
        (file: any) =>
          file.type === 'file' &&
          (file.name.endsWith('.md') || file.name.endsWith('.markdown'))
      );

      if (mdFiles.length === 0) {
        throw new Error("No markdown (.md or .markdown) files were found in the specified path.");
      }

      // 2. Fetch file contents in parallel
      const fetchedPosts: BlogPost[] = [];

      await Promise.all(
        mdFiles.map(async (file: any) => {
          try {
            const rawUrl = file.download_url; // Direct un-authenticated raw file CDN URL
            const rawResponse = await fetch(rawUrl);
            if (!rawResponse.ok) return;

            const textContent = await rawResponse.text();
            const { frontmatter, content } = parseFrontmatter(textContent);

            // Synthesize values, backing up with metadata default values
            const cleanTitle = frontmatter.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            const cleanDate = frontmatter.date || "Imported Post";
            const cleanReadTime = frontmatter.readTime || `${Math.max(1, Math.ceil(textContent.split(/\s+/).length / 200))} min read`;
            
            // Extract custom tags
            let cleanTags = ["GitHub Import"];
            if (frontmatter.tags) {
              cleanTags = frontmatter.tags.split(',').map((t) => t.trim());
            }

            fetchedPosts.push({
              id: `github-${repo}-${file.name.replace(/\.[^/.]+$/, "")}`,
              title: cleanTitle,
              excerpt: frontmatter.excerpt || content.slice(0, 150).trim() + "...",
              content: textContent, // Preserve full content with frontmatter or raw content for MarkdownRenderer
              date: cleanDate,
              readTime: cleanReadTime,
              tags: cleanTags,
              githubUrl: file.html_url,
              coverImage: frontmatter.coverImage || "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80", // default moody nature layout
              author: {
                name: frontmatter.author || `${owner} (GitHub Developer)`,
                avatar: `https://github.com/${owner}.png`,
                bio: frontmatter.bio || `Dynamic importer content from ${owner}/${repo}`
              }
            });
          } catch (e) {
            console.error(`Failed to load individual file contents for fallback`, e);
          }
        })
      );

      if (fetchedPosts.length === 0) {
        throw new Error("Discovered markdown references but failed to pull their individual file streams.");
      }

      onImportsUpdated(fetchedPosts, config);
      setSuccessCount(fetchedPosts.length);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during import synchronization.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-zinc-900 bg-stone-50 dark:bg-zinc-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Github size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white font-sans">
                GitHub Repository Integration
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Load markdown articles dynamic from open-source repositories as a Headless CMS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-100 dark:border-zinc-900 font-sans text-sm">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <RefreshCw size={14} /> Repository Sync Settings
            </span>
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'instructions'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <HelpCircle size={14} /> GitHub Pages Deployment Guide
            </span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-5">
          {activeTab === 'settings' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Repository Owner */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 tracking-wide uppercase mb-1.5 font-sans">
                    Repo Owner / Organization
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={config.owner}
                      onChange={(e) => setConfig({ ...config, owner: e.target.value.trim() })}
                      placeholder="e.g. facebook"
                      className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 rounded-xl px-3 py-2.5 pl-9 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <Github className="absolute left-3 top-3.5 text-stone-400" size={14} />
                  </div>
                </div>

                {/* Repository Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 tracking-wide uppercase mb-1.5 font-sans">
                    Repository Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={config.repo}
                      onChange={(e) => setConfig({ ...config, repo: e.target.value.trim() })}
                      placeholder="e.g. react"
                      className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 rounded-xl px-3 py-2.5 pl-9 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <Layers className="absolute left-3 top-3.5 text-stone-400" size={14} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Branch */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 tracking-wide uppercase mb-1.5 font-sans">
                    Target Branch
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={config.branch}
                      onChange={(e) => setConfig({ ...config, branch: e.target.value.trim() })}
                      placeholder="e.g. main"
                      className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 rounded-xl px-3 py-2.5 pl-9 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <GitBranch className="absolute left-3 top-3.5 text-stone-400" size={14} />
                  </div>
                </div>

                {/* Folder Path */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 tracking-wide uppercase mb-1.5 font-sans">
                    Directory Folder (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={config.folderPath}
                      onChange={(e) => setConfig({ ...config, folderPath: e.target.value })}
                      placeholder="e.g. posts (leave blank if root)"
                      className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 rounded-xl px-3 py-2.5 pl-9 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <Folder className="absolute left-3 top-3.5 text-stone-400" size={14} />
                  </div>
                </div>
              </div>

              {/* Personal Access Token (PAT) */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 tracking-wide uppercase mb-1 font-sans">
                  Personal Access Token (Highly Recommended)
                </label>
                <p className="text-[11px] text-stone-400 mb-2 leading-snug">
                  Unauthenticated requests to the GitHub API are limited to 60/hr. Adding a read-only token prevents rate limiting during development.
                </p>
                <div className="relative">
                  <input
                    type="password"
                    value={config.accessToken || ''}
                    onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 rounded-xl px-3 py-2.5 pl-9 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Key className="absolute left-3 top-3.5 text-stone-400" size={14} />
                </div>
              </div>

              {/* Notifications */}
              {errorMessage && (
                <div className="flex gap-2.5 p-4 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              )}

              {successCount !== null && (
                <div className="flex gap-2.5 p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs">
                  <Check size={16} className="shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Success! Pull completed. Successfully imported <strong>{successCount}</strong> technical markdown files as active articles. Your dashboard feed has been updated dynamically.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 font-sans text-xs sm:text-sm text-stone-600 dark:text-zinc-300">
              <h3 className="font-semibold text-sm text-stone-800 dark:text-white">
                How to Host Your Technical Blog on GitHub Pages
              </h3>
              <p className="leading-relaxed">
                This template is optimized to be deployed as a static client-side application directly on **GitHub Pages**, querying either this repo or a completely separate "Headless CMS" repo for markdown files.
              </p>

              <div className="space-y-3.5 pl-2.5 border-l-2 border-stone-200 dark:border-zinc-800 pt-1">
                <div>
                  <h4 className="font-semibold text-stone-800 dark:text-white mb-1">
                    1. Structure Your Markdown Post
                  </h4>
                  <p className="leading-relaxed">
                    Place markdown files (e.g., <code className="bg-stone-50 dark:bg-zinc-900 px-1 py-0.5 text-stone-900 dark:text-stone-300 rounded font-mono">my-aws-tips.md</code>) in your target directory with the following front-matter configurations:
                  </p>
                  <pre className="mt-2 p-3 bg-stone-900 text-stone-200 rounded-lg text-xs leading-relaxed font-mono select-all overflow-x-auto">
{`---
title: My Advanced AWS Systems Setup
excerpt: Inside details on caching, buffer-throttling and security.
date: Oct 20, 2026
readTime: 5 min read
tags: Cloud, Architecture, Unsplash
coverImage: https://images.unsplash.com/photo-1555066931-4365d14bab8c
author: Haley G.
bio: Cloud SRE & Canopy enthusiast.
---

# Your Article Markdown Content Starts Here...`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-800 dark:text-white mb-1">
                    2. Dynamic Client-Side Integration (Static SPA)
                  </h4>
                  <p className="leading-relaxed">
                    Because this is an SPA, the hosting remains completely serverless! When you build the project (<code className="bg-stone-50 dark:bg-zinc-900 px-1 py-0.5 text-stone-900 rounded font-mono">npm run build</code>) it puts the outputs in <code className="bg-stone-50 dark:bg-zinc-900 px-1 py-0.5 text-stone-900 rounded font-mono">/dist</code>. Push this build folder, or configure a **GitHub Action** to automatically build and deploy it on push.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-800 dark:text-white mb-1">
                    3. Continuous Integration Workflow
                  </h4>
                  <p className="leading-relaxed">
                    By saving Repository settings, your reader audience gets immediate updates directly from your GitHub commit push histories—zero re-deployment required. The markdown file changes on GitHub instantly sync live in your reader feeds dynamically.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-stone-50 dark:bg-zinc-900/40 border-t border-stone-100 dark:border-zinc-900 flex justify-end gap-3 font-sans">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-stone-600 dark:text-zinc-300 bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 font-semibold text-sm transition-all"
          >
            Close
          </button>
          {activeTab === 'settings' && (
            <button
              onClick={handleFetchMarkdown}
              disabled={isLoading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 disabled:bg-emerald-500/50 shadow-md shadow-emerald-600/10 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={15} />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  <span>Sync Repository Markdown</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
