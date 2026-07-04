---
id: personal-ai-operating-system
title: Building a Personal AI Operating System for a Second Brain
date: July 4, 2026
excerpt: A personal AI Operating System pairs Karpathy's LLM Wiki pattern for accumulating knowledge with Nate Herk's Three Ms for keeping the whole system honest over time.
readTime: 11 minutes read
tags:
  - AI Workflows
  - Second Brain
  - Claude Code
category: AI/LLM
coverImage: assets/aios-brain-cover.svg
---

I built a personal AI Operating System around one core tension: a knowledge base only stays useful if it keeps building on what's already there, and only if I actually keep it maintained instead of just meaning to. Structure without a ritual goes stale. A ritual without structure has nowhere to land. This is how I built mine, by pairing two ideas that weren't originally about the same problem.

The knowledge half borrows from [Andrej Karpathy's "LLM Wiki" gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): instead of an LLM re-deriving answers from raw documents at query time, it incrementally builds and maintains a persistent wiki, and the human's job narrows to curating sources and asking good questions. The maintenance-cadence half borrows from Nate Herk's Three Ms (Mindset, Method, Machine) and his `AIS-OS` starter kit: a repeatable loop for finding a manual task worth automating and actually shipping it. Everything below runs inside Claude Code, and the hooks and skills mentioned throughout are Claude Code's own mechanisms.

## The shape of the system

There's nothing magic underneath this. It's files in a folder, read and edited like any other markdown, in my case through Obsidian because it makes skimming and linking notes fast.

There are many ways to organize this. Pick whatever structure makes sense for how you think, not the one below specifically. What actually matters is understanding how to *maintain* whatever shape you land on, not copying mine. Here's mine, because it's a concrete starting point:

- **`wiki/`**: the actual knowledge base. An `index.md` navigation index at the top, then `pages/<project>/` folders, one per project, each split into `context/`, `knowledge/`, `log/`, `plan/`, and `archives/`.
- **`brain/`**: the system's own intelligence about itself. Holds `aios-intake.md` (the intake questionnaire that seeds everything else), `connections.md` (what's reachable and how), and a `references/` subfolder with standing docs like the Three Ms framework and a voice guide.
- **`inbox/`**: the raw capture queue. Individual dropped files (`session-<project>-<name>-<date>.md`, a rough design note, a job description) plus a `processed/` subfolder that keeps the audit trail after each file gets filed.

<Diagram id="top-level-shape" />

## Intro to Knowledge Maintenance (LLM Wiki)

<Diagram id="library-of-books" />

> A bigger library doesn't help if you can't find the shelf.

Karpathy's "LLM Wiki" framing is specific: instead of retrieving from raw documents fresh every time, the LLM incrementally builds and maintains a persistent wiki that sits between the user and the raw sources. That distinction matters more than it first sounds. Chat history evaporates the moment a session ends. A wiki doesn't. Every cross-reference you add today is still there next month, and the next question builds on it instead of starting over. The wiki is the accumulating artifact. The chat is just how you talk to it.

Accumulation only helps if things can be found again, which is where "index" and "pointer" earn their keep. An index is just a short file listing what topics or projects exist and where each one lives, kept small enough to scan in a few seconds. A pointer file is what actually lets the agent jump straight to the right place instead of two worse options: reading every file in the folder to find the answer, or you telling it the exact path by hand every single time. Concretely: `wiki/index.md` is a pointer. It doesn't contain the knowledge itself, it contains where the knowledge is.

The cleanest example of this in action is how a session starts:

<Diagram id="how-you-enter-the-system" />

`CLAUDE.md` loads automatically at the start of every session and tells the agent who I am and how to work. From there it checks `wiki/index.md` to see what projects and topics exist. From there it goes straight to the one file relevant to the question actually being asked. No need to read the whole wiki. No need to hand over a manual path. Two small, stable files do the routing. Stripped to the essentials, that's:

```markdown
# CLAUDE.md (excerpt)
You are my personal AI Operating System.
## Where to look first
- `wiki/index.md` — navigation index, read before any project question
```

```markdown
# wiki/index.md (excerpt)
- **recipe-app** — `wiki/pages/recipe-app/` — tags: #cooking #side-project
- **job-search** — `wiki/pages/job-search/` — tags: #career
```

```markdown
# wiki/pages/recipe-app/knowledge/setup.md (excerpt)
How the local dev environment is configured, and why each piece is there.
```

One small addition worth stealing: tag topics consistently in `index.md` (`#cooking`, `#career`, whatever categories fit your own life). Two projects sharing a tag link up immediately from the index itself, instead of you hunting for a cross-reference buried in a knowledge file.

Here's the part that's actually hard about keeping this working: it's not writing the note. Writing a note is easy. The hard part is that a new file needs to be *registered*, added to the index so anything downstream can find it, and *cross-linked* whenever it references something nested somewhere else in the wiki. Skip that step and the note technically exists but is invisible, an orphan the agent will never think to check. This is exactly why maintenance can't just be "remember to write things down." It needs dedicated skills that handle registering and linking as a matter of course, not as an afterthought.

I call these **wiki maintenance skills**:

- **Ingest**: takes raw captured material from the inbox and files it into the right place in the knowledge base, registering and cross-linking it as it goes.
- **Lint**: a health check across the wiki: flags stale pages, orphaned content, and anything still sitting unprocessed.
- **Query**: answers a question using only what's already stored, and cites where the answer came from. If the answer doesn't exist yet, that's a signal the wiki has a gap, not a failure of the question.
- **Debrief**: a fast end-of-session capture: a handful of fixed questions, written straight to the inbox before I close the laptop.

One more pattern worth naming: a separate ideation folder, a space to draft freely without any pressure to structure things properly yet. A dedicated skill picks up a finished draft from there and folds it into the curated wiki once it's actually ready. I like keeping the knowledge folder itself fully LLM-managed. Drafts stay messy and separate until they've earned their place.

## Intro to AI OS Maintenance (the BRAIN)

<Diagram id="deliberate-upkeep" />

> Left alone, a system drifts. Tended, it stays yours.

Everything above is about keeping *knowledge* honest. This section is about keeping the *system itself* honest, which is a different problem. Left alone, an AI system quietly drifts: priorities shift but the persona section of `CLAUDE.md` still reflects last quarter, capabilities stall because no new automation shipped in weeks, structural gaps compound because nobody's looking for them. None of that is the model's fault. It's deliberate upkeep work that only the human can decide to do, because the point of it is making sure the system stays a true reflection of you, not something that quietly absorbed noise from stale context or drifted priorities. My own setup is built on top of Nate Herk's [`AIS-OS` starter kit](https://github.com/nateherkai/AIS-OS/blob/main/references/3ms-framework.md), not just inspired by it at a distance.

Two concrete examples of what this upkeep looks like in practice.

**Example 1: scheduled weekly linting.** On a fixed cadence, review what happened over the past week and use it to revise or plan new automations. I run this as a Claude routine, a scheduled cloud session, rather than something I have to remember to kick off myself.

<Diagram id="weekly-linting-schedule" />

**Example 2: the inbox loop.** This one spans both wiki maintenance and brain maintenance at once. A **hook** (an automated trigger tied to a session-lifecycle event, [documented here for Claude Code](https://code.claude.com/docs/en/hooks-guide)) fires when a session closes, spins up a **sub-agent** (a separate Claude instance given one focused task, rather than continuing in the same conversation) that summarizes what changed or got discussed, and writes that summary to the inbox as unprocessed information. It could be a new project, a change to an existing one, or just a stray idea for an automation. On the next session start, a second hook checks whether anything's waiting in the inbox and offers to process it, either folding it into the wiki or spinning up a brand-new skill.

<Diagram id="inbox-loop" />

This is just one way to do it. Be creative based on what you actually need. Worth flagging honestly: spinning up a full sub-agent session for Example 2 isn't necessarily the best token spend if you're watching a budget. I'm on a $20/mo plan and rarely come close to the limit, so it works for me, but a plain script doing the same mechanical extraction is a completely valid, lower-cost alternative to a sub-agent session for the same job.

The recurring rituals that keep the brain itself sharp, which I call **brain maintenance skills**:

- **Onboard (first-day)**: one-time wizard, scaffolds the system from a short interview.
- **Onboard (re-run)**: re-syncs the system's understanding of the user when context changes.
- **Audit**: scores the system against its own framework, ranks top gaps by leverage.
- **Level-up**: recurring ritual, finds one manual task worth automating, ships a first version.

Most of these originate from [Nate Herk's own GitHub](https://github.com/nateherkai), renamed for my own setup rather than written from scratch.

## Putting it all together

- The wiki side handles *what the system knows*: capture through the inbox, ingest into the right project folder, lint for staleness, query for answers with citations.
- The brain side handles *how well the system is set up and growing*: onboard when context shifts, audit on a cadence to catch structural drift, level up to ship the next automation.
- Both sides share the same entry point every session: `CLAUDE.md` loads first, `wiki/index.md` gets checked next, and only then does the agent go looking at the specific file the question actually needs.
- Both sides also share the same inbox loop: a session-close hook captures what happened, a session-start hook surfaces it, and a human decides whether it becomes wiki content, a new automation, or nothing at all.
- None of this needs to be elaborate to work. It needs registering, cross-linking, and a cadence that actually runs, not a bigger folder tree.
- Build and maintain this deliberately. Don't let the LLM dominate the process, or the brain quietly starts speaking a different language than you do. No system can imitate or replace you without explicit instruction and guidance from you.

<Diagram id="aios-full-round-trip" />
