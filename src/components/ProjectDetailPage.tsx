/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PortfolioProject } from '../types';
import { Cpu, Network, Shield, ArrowLeft, ExternalLink, Database, Activity, Code, GitCommit, Info } from 'lucide-react';

interface ProjectDetailPageProps {
  project: PortfolioProject;
  onBack: () => void;
}

export function ProjectDetailPage({ project, onBack }: ProjectDetailPageProps) {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Cpu': return <Cpu size={28} className="text-emerald-500" />;
      case 'Network': return <Network size={28} className="text-emerald-500" />;
      case 'Shield': return <Shield size={28} className="text-emerald-500" />;
      default: return <Database size={28} className="text-emerald-500" />;
    }
  };

  return (
    <div id="project-detail" className="space-y-12 pb-24 max-w-4xl mx-auto animate-fade-in">
      {/* Back Button and Core Header Metadata */}
      <div>
        <button 
          id="back-to-portfolio"
          onClick={onBack}
          className="flex items-center gap-2 text-stone-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-sans text-sm font-semibold transition-colors group cursor-pointer mb-6"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Portfolio Home</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-stone-100 dark:border-zinc-900 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                {getIcon(project.iconName)}
              </div>
              <div>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                  Telemetry Module
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-stone-900 dark:text-white mt-1">
                  {project.title}
                </h1>
              </div>
            </div>
            
            <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-semibold italic">
              {project.tagline}
            </p>
            
            <p className="text-stone-600 dark:text-zinc-300 font-serif text-base leading-relaxed max-w-3xl">
              {project.description}
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-3 min-w-[200px]">
            <a 
              id="live-project-link"
              href={project.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 active:scale-95 text-center"
            >
              <span>Visit Actual Website</span>
              <ExternalLink size={12} />
            </a>
            
            <span className="text-[11px] text-stone-400 dark:text-zinc-500 text-center md:text-left font-mono block px-1">
              Stable Build: v2.4.0-stable
            </span>
          </div>
        </div>
      </div>

      {/* Behind the Scenes Comprehensive deep dive */}
      <div id="bts-section" className="space-y-10">
        
        {/* Simple Introduction */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
            <h2 className="text-lg font-bold font-sans tracking-tight text-stone-900 dark:text-white">
              Project Introduction & Bio-Mimicry Basis
            </h2>
          </div>
          <p className="text-stone-600 dark:text-zinc-300 font-serif leading-relaxed text-sm sm:text-base">
            {project.architectureIntro}
          </p>
        </section>

        {/* Data Engineering Pipeline Stream Flow visualization */}
        {project.dataPipelineFlow && (
          <section className="space-y-4 bg-stone-50 dark:bg-zinc-900/20 rounded-2.5xl p-6 border border-stone-200/40 dark:border-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-500" />
                <h3 className="font-mono text-xs font-bold text-stone-800 dark:text-zinc-200 uppercase tracking-wider">
                  Live Architectural Data Pipeline Stream Flow
                </h3>
              </div>
              <span className="font-mono text-[9px] text-stone-400 dark:text-zinc-600 uppercase">
                Active telemetry layout
              </span>
            </div>

            <div className="flex flex-col gap-3 py-2 font-mono">
              {project.dataPipelineFlow.map((step, sIdx) => {
                const [phase, description] = step.split(': ');
                return (
                  <div key={sIdx} className="flex items-start md:items-center gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shadow-sm">
                        {sIdx + 1}
                      </div>
                      {sIdx < project.dataPipelineFlow!.length - 1 && (
                        <div className="w-0.5 h-6 bg-stone-200 dark:border-zinc-800 border-dashed border-l mt-1.5" />
                      )}
                    </div>
                    <div className="bg-white dark:bg-zinc-950/70 py-2.5 px-4 rounded-xl border border-stone-100 dark:border-zinc-900 flex-grow shadow-xs group-hover:border-emerald-500/20 transition-all">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide mr-2">
                        [{phase}]
                      </span>
                      <span className="text-xs text-stone-700 dark:text-zinc-300">
                        {description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* High-Level Architecture Explanation */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-emerald-500" />
            <h2 className="text-lg font-bold font-sans tracking-tight text-stone-900 dark:text-white">
              High-Level Infrastructure Architecture & Topology
            </h2>
          </div>
          <p className="text-stone-600 dark:text-zinc-300 font-serif leading-relaxed text-sm sm:text-base">
            {project.highLevelArchitecture}
          </p>
        </section>

        {/* Tech Stack Table / Badge layout */}
        <section className="space-y-4">
          <h3 className="font-sans font-bold text-stone-900 dark:text-white text-base">
            Tech Stack Decisions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {project.techStack.map((tech, idx) => (
              <div 
                key={idx} 
                className="bg-stone-50 dark:bg-zinc-900/30 border border-stone-200/40 dark:border-zinc-900 py-3.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-xs font-semibold text-stone-800 dark:text-zinc-200 text-center break-words">
                  {tech}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Decisions and Tradeoff logs */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pl-1">
            <GitCommit size={18} className="text-emerald-500" />
            <h2 className="text-lg font-bold font-sans tracking-tight text-stone-900 dark:text-white">
              Engineering Tradeoff & Architectural Decision Log
            </h2>
          </div>
          
          <div className="border border-stone-200/60 dark:border-zinc-900 rounded-2.5xl overflow-hidden shadow-xs bg-white dark:bg-zinc-950/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-zinc-900/50 border-b border-stone-200/60 dark:border-zinc-900 text-[10px] text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    <th className="py-4 px-5">Design Decision</th>
                    <th className="py-4 px-5">Implementation Strategy</th>
                    <th className="py-4 px-5">Engineering Tradeoff / Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-900 text-xs text-stone-600 dark:text-zinc-300">
                  {project.designDecisions.map((decision, dIdx) => (
                    <tr key={dIdx} className="hover:bg-stone-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                      <td className="py-4 px-5 font-semibold text-stone-900 dark:text-white align-top min-w-[160px]">
                        {decision.title}
                      </td>
                      <td className="py-4 px-5 font-serif leading-relaxed align-top md:max-w-xs">
                        {decision.description}
                      </td>
                      <td className="py-4 px-5 align-top min-w-[200px]">
                        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                          <span className="font-mono text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block mb-1">
                            Tradeoff analysis:
                          </span>
                          <span className="text-[11px] font-sans text-stone-500 dark:text-zinc-400">
                            {decision.tradeoff}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Operational Warning Disclaimer block */}
        <div className="flex gap-3 bg-stone-50 dark:bg-zinc-900/15 border border-stone-200/40 dark:border-zinc-900 p-5 rounded-2.5xl">
          <Info className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" size={18} />
          <div className="space-y-1">
            <h4 className="font-mono text-xs font-bold text-stone-900 dark:text-zinc-200 uppercase tracking-wide">
              Live Field Node Verification Notice
            </h4>
            <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed font-light">
              This node architecture runs off actual microcontrollers mounted in the Costa Rican Monteverde Cloud Forest. Continuous payload latency can drop slightly depending on heavy rains and cloud cover constraints.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
