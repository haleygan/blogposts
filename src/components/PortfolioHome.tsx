/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BlogPost, PortfolioProject } from '../types';
import { RAINFOREST_HERO_IMAGE, RAINFOREST_AVATAR_IMAGE } from '../data/defaultPosts';
import { DE_PROJECTS } from '../data/projectsData';
import { ArrowRight, BookOpen, ExternalLink, Shield, Cpu, Network, Thermometer, Droplets, BatteryCharging, Zap } from 'lucide-react';

interface PortfolioHomeProps {
  onNavigateToBlogs: () => void;
  onSelectPost: (postId: string) => void;
  onSelectProject: (projectId: string) => void;
  featuredPosts: BlogPost[];
}

export function PortfolioHome({ onNavigateToBlogs, onSelectPost, onSelectProject, featuredPosts }: PortfolioHomeProps) {
  // Simulated LIVE sensor data for immersive "Behind-the-Scenes" rainforest feel
  const [canopyMetrics, setCanopyMetrics] = useState({
    humidity: 89.4,
    temperature: 26.8,
    chargingState: 94,
    activeSensors: 12,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCanopyMetrics((prev) => ({
        humidity: parseFloat((prev.humidity + (Math.random() - 0.5) * 0.4).toFixed(1)),
        temperature: parseFloat((prev.temperature + (Math.random() - 0.5) * 0.2).toFixed(1)),
        chargingState: Math.min(100, Math.max(10, prev.chargingState + (Math.random() > 0.65 ? 1 : -1))),
        activeSensors: prev.activeSensors,
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Cpu': return <Cpu size={18} className="text-emerald-500" />;
      case 'Network': return <Network size={18} className="text-emerald-500" />;
      case 'Shield': return <Shield size={18} className="text-emerald-500" />;
      default: return <Cpu size={18} className="text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. HERO BANNER & MAIN HEADING */}
      <section className="relative rounded-3xl overflow-hidden border border-stone-200/60 dark:border-zinc-900/60 shadow-xl bg-stone-900/10">
        <div className="aspect-[16/7] md:aspect-[16/5] w-full min-h-[220px] relative">
          <img 
            src={RAINFOREST_HERO_IMAGE} 
            alt="Tropical Rainforest Animal Kingdom" 
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
          {/* Subtle shading filter overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 text-white flex flex-col justify-end">
            <span className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-widest bg-emerald-950/80 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-3">
              Canopy Ingestion Telemetry
            </span>
            <h1 className="text-2xl sm:text-3.5xl md:text-4.5xl font-bold tracking-tight font-sans leading-tight">
              Canopy Pipelines & High-Throughput Bio-Data Lakes
            </h1>
            <p className="text-stone-300 font-light font-serif mt-2 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed">
              Harnessing the natural flow metrics of tropical river networks and evolutionary organism swarms to build petabyte-scale, fault-tolerant distributed stream processing systems.
            </p>
          </div>
        </div>
      </section>

      {/* 2. RESEARCHER PROFILE & PORTFOLIO META */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white dark:bg-zinc-900/20 border border-stone-100 dark:border-zinc-900 p-8 sm:p-10 rounded-3xl transition-colors">
        
        {/* Avatar Area */}
        <div className="md:col-span-4 lg:col-span-3 flex justify-center">
          <div className="relative group select-none">
            <div className="absolute inset-0 bg-emerald-600 rounded-2xl rotate-3 scale-102 group-hover:rotate-6 transition-transform opacity-30 blur-md" />
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-emerald-600 dark:border-emerald-500 bg-emerald-50 bg-cover shadow-lg">
              <img 
                src={RAINFOREST_AVATAR_IMAGE} 
                alt="Woolly Monkey Avatar representation" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Online Pulse Indicator */}
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border border-white dark:border-zinc-950 shadow flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>LIVE CORE</span>
            </div>
          </div>
        </div>

        {/* Bio Details */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 dark:text-white leading-none">
                Haley G.
              </h2>
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider mt-1.5 inline-block">
                Principal Distributed Data Architect & Bio-mimicry Analyst
              </span>
            </div>
            
            <button
              onClick={onNavigateToBlogs}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 group shadow-md shadow-emerald-600/10 active:scale-95 self-start"
            >
              <BookOpen size={15} />
              <span>Explore Research Logs</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-stone-500 dark:text-zinc-400 font-serif leading-relaxed text-sm sm:text-base font-light">
            I build ultra-low power stream processing engines and highly-resilient, fault-tolerant data lake pipelines by day, and study natural computational heuristics inside rainforest canopies by night. This portfolio showcases production-grade streaming data architectures styled around biological optimization—mimicking sloth-digest backpressure thresholds, leafcutter ant routing algorithms, and stealth jaguar defensive masking proxies.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {["Distributed Systems", "IoT Stream Ingestion", "Organic Consensus", "Data Lakes"].map((badge, i) => (
              <span 
                key={i} 
                className="bg-stone-50 dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 font-mono text-[10px] uppercase font-medium px-2.5 py-1 rounded-md border border-stone-200/40 dark:border-zinc-800"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID - FEATURED PROJECT SITES & BEHIND-THE-SCENES LINKS */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-stone-900 dark:text-white leading-none">
            Personal Projects & Research Hub
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 mt-1.5 font-sans">
            Interactive system packages available for integration. Click to view bio-mimicry telemetry details, live stream flows, and behind the scenes architectural tradeoffs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {DE_PROJECTS.map((proj, idx) => (
            <div 
              key={proj.id}
              className="group bg-white dark:bg-zinc-900/10 border border-stone-100 dark:border-zinc-900 p-6 rounded-2.5xl flex flex-col justify-between hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
              onClick={() => onSelectProject(proj.id)}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                    {getIcon(proj.iconName)}
                  </div>
                  <h3 className="font-semibold text-stone-900 dark:text-white text-base font-sans group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {proj.title}
                  </h3>
                </div>
                
                <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 leading-relaxed font-light mb-4 flex-grow">
                  {proj.description}
                </p>
              </div>

              <div>
                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {proj.tags.map((tag, tIdx) => (
                    <span 
                      key={tIdx} 
                      className="bg-stone-50 dark:bg-zinc-900 text-stone-500 dark:text-zinc-400 font-mono text-[9px] px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Simulated Links */}
                <div className="flex items-center gap-3 pt-3 border-t border-stone-100 dark:border-zinc-900/50 text-xs">
                  <a 
                    href={proj.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    <span>Project Site</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. BEHIND-THE-SCENES FIELD LABORATORY TERMINAL (IMMERSIVE INTERACTIVE UI) */}
      <section className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-zinc-300 shadow-xl border border-zinc-800 overflow-hidden relative select-none">
        {/* Absolute Background Jungle Flora Watermark decoration */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-5 pointer-events-none flex items-center justify-center select-none overflow-hidden">
          <span className="text-[12rem] text-emerald-500 select-none animate-jungle-leaf">🌿</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Behind-The-Scenes: Canopy Bio-Telemetry Node #04 (Costa Rica)
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Volatile telemetry streaming directly over low-power physical mesh relays
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span className="flex items-center gap-1 text-emerald-400">
              <Zap size={11} />
              ONLINE
            </span>
            <span>|</span>
            <span>LATENCY: 142ms</span>
          </div>
        </div>

        {/* Telemetry metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 font-mono">
          
          <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1.5 opacity-20">
              <Thermometer size={14} className="text-zinc-400" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Canopy Temp</span>
            <div className="text-lg sm:text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
              <span>{canopyMetrics.temperature}</span>
              <span className="text-xs text-zinc-500">°C</span>
            </div>
            <div className="w-full bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(canopyMetrics.temperature / 40) * 100}%` }} 
              />
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1.5 opacity-20">
              <Droplets size={14} className="text-zinc-400" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Relative Humidity</span>
            <div className="text-lg sm:text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
              <span>{canopyMetrics.humidity}</span>
              <span className="text-xs text-zinc-500">%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${canopyMetrics.humidity}%` }} 
              />
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1.5 opacity-20">
              <BatteryCharging size={14} className="text-zinc-400" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Battery Charge (Solar)</span>
            <div className="text-lg sm:text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
              <span>{canopyMetrics.chargingState}</span>
              <span className="text-xs text-zinc-500">%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${canopyMetrics.chargingState}%` }} 
              />
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl relative overflow-hidden group">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Mesh Node Peers</span>
            <div className="text-lg sm:text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
              <span>{canopyMetrics.activeSensors}</span>
              <span className="text-xs text-emerald-500">Nodes Active</span>
            </div>
            <div className="flex gap-1.5 mt-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <span 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full ${idx < 6 ? 'bg-emerald-500' : 'bg-zinc-800'}`} 
                />
              ))}
            </div>
          </div>

        </div>

        {/* Terminal Logs readout */}
        <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl mt-6 font-mono text-[11px] text-zinc-400 space-y-1.5 max-h-[140px] overflow-y-auto">
          <p className="text-zinc-500">[2026-06-16 09:12:05] <span className="text-amber-500">WARN</span> sloth-vm-digestion-buffer queue utilization high: 87%</p>
          <p className="text-zinc-500">[2026-06-16 09:12:08] <span className="text-emerald-400">INFO</span> formica-swarm pheromone path consensus converged on route ID #7b9</p>
          <p className="text-zinc-500">[2026-06-16 09:12:12] <span className="text-blue-400">INFO</span> camouflage-net spoof target updated - simulating regular horticultural crawl patterns</p>
          <p className="text-zinc-500">[2026-06-16 09:12:15] <span className="text-emerald-400">INFO</span> core heartbeat packet telemetry exported successfully (solar collector operating at optimum azimuth)</p>
        </div>
      </section>

      {/* 5. SELECTED FEATURED ARTICLES FEED */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-900 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-stone-900 dark:text-white leading-none">
              Featured Articles & Case Studies
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 mt-1.5">
              Deep dives linking natural ecosystems to cloud infrastructure issues
            </p>
          </div>
          <button
            onClick={onNavigateToBlogs}
            className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline flex items-center gap-1.5 font-sans"
          >
            All Articles
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredPosts.slice(0, 2).map((post) => (
            <div 
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              className="group bg-white dark:bg-zinc-900/10 border border-stone-100 dark:border-zinc-900 rounded-2.5xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
            >
              {post.coverImage && (
                <div className="w-full h-44 overflow-hidden bg-stone-100 dark:bg-zinc-800">
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="p-6 space-y-3">
                <div className="flex gap-2">
                  {post.tags.slice(0, 2).map((tag, i) => (
                    <span 
                      key={i} 
                      className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-sans font-medium text-[10px] tracking-wide px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h3 className="font-semibold text-stone-950 dark:text-white text-base font-sans line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-stone-500 dark:text-zinc-400 font-serif text-xs leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-stone-400 font-sans">
                  <span>{post.date}</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Read Article <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
