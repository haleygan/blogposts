---
id: personal-ai-operating-system
title: How I'm building my own second brain
date: July 4, 2026
excerpt: Sharing my experience on curating a LLM-based self-maintaining knowledge and daily workflow optimization system.
readTime: 11 minutes read
tags:
  - AI Workflows
  - Second Brain
  - Claude Code
category: AI/LLM
coverImage: assets/aios-brain-cover.svg
---
Hi all, recently I've been trying to build my own second brain, it's a very interesting discovery process (and a pleasant one) as I get a feel on how the brain accelerates my workflow.

## What's needed in a brain?

It's been months since the AI engineering community started to utilise LLMs to curate their own contained personal knowledge system for day to day work with highly efficient info retrieval. Andrej Karpathy introduced the concept of [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) where the general idea is to have a proper structure to keep personal documents and files and add tags or reference to cross-link related info as a pointer to guide LLMs where they should go next. This helps the LLM to easily navigate only the necessary, related files instead of consuming *every* document in *every* new session which will blow the context window out. It beats RAG and ML models for simplicity in terms of required knowledge, setup and maintenance, and would be more than sufficient for personal use case for most people.

The other one I've discovered recently is "AI OS" - it's an idea to keep our working system truly "AI native": you build agentic workflows and AI automations whenever possible with an engineering mindset to optimise for performance. So instead of passing pure text instructions in chat sessions, you would write agent skills with reusable scripts, setup connections and tune configurations for controlling accesses, schedule tasks for repeated work and design frameworks that orchestrates complex workflows for larger projects. The AI OS concept focuses more on "*How to make AI really work for you*" without you giving explicit instructions every single time. 

I happened to come across Nate Herk's [AI Operating System starter kit](https://github.com/nateherkai/AIS-OS) on Github and got very intrigued with his 3Ms (how you build automations) and 4Cs (how you audit them after) framework as they covered the core philosophy of building and maintaining a personal brain. Here's his [youtube video](https://www.youtube.com/watch?v=bCljOfCH8Ms) that explains the concept and how to use his AI OS system.

For my own use case, I'm taking both the LLM Wiki and AI OS concept for consideration to my personal brain - with some twist on folder structure and workflow to suit my own liking.

## The folder structure

<Diagram id="top-level-shape" />

There are many ways to organize this, but here's mine. 

- **`wiki/`**: the actual knowledge base for projects and custom knowledge 
	- `index.md` navigation index at the top
	- `schema.md` with guide on the expected folder structure and how the wiki folder should be maintained
	- `pages/<project>/` folders, one per project, each split into `context/`, `knowledge/`, `log/`, `plan/`, and `archives/`.
- **`brain/`**: the system's own intelligence about itself, extracted mostly from Nate Herk's starter kit.
	- `aios-intake.md` the intake questionnaire that seeds everything else for initial kickoff
	- `connections.md` for what's reachable and how
	- `references/` subfolder with standing docs like the Three Ms framework and a voice guide.
- **`identity-context/`**: the knowledge base about yourself (optional)
	- kept in separate folder as it is project agnostic
	- useful to keep context about yourself, e.g. side income context, detailed list of past job experience, pending TODO list, etc
	- though you need to make sure you don't pass private info such as full name, email or phone number for security purposes
- **`inbox/`**: the audit layer for raw capture queue. 
	- unprocessed files are dropped here, e.g., session summaries for project updates, weekly linting on AI OS system health, raw ideation notes, etc. 
	- will need to set up a separate workflow to pick these files up, process them, and integrate/merge them to the wiki/AI OS system with intentional human review to ensure the quality of the brain

## Knowledge Maintenance (LLM Wiki)

<Diagram id="library-of-books" />

> A bigger library doesn't help if you can't find the shelf.

The core idea of Karpathy's "LLM Wiki" is to build a persistent wiki that sits between the user and the raw sources. There are two main parts to it:

Firstly, **it should know where to find information.**

It's easy to simply add all your existing documents to the library, but what's next? We can't expect the LLM to run recursive `ls`, `grep` or `find` on every chat session to find the information you need. This is where `index.md` comes in to act as the semantic pointer layer as a guide to the agent on where to find the information. It's just a short file listing what topics or projects exist and where each one lives, kept small enough to scan in a few seconds.

The cleanest example of this in action is how a session starts in Claude Code:
<Diagram id="how-you-enter-the-system" />

`CLAUDE.md` is Claude Code's system prompt loaded at the start of every session. From there you can add instructions to first check `wiki/index.md` for proper project navigation. The index file consists of project names, project descriptions, directory paths and topic tags - this will be the agent's discovery portal. 

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
- **blender-project** — `wiki/pages/blender-project/` — tags: #3d-modelling #side-project
```

```markdown
# wiki/pages/recipe-app/knowledge/setup.md (excerpt)
How the local dev environment is configured, and why each piece is there.

For actual connection details, check path brain/connections.md
```

With this approach you can build a web of knowledge where information can either be tagged and labelled in `index.md`, or you can reference one knowledge file in another knowledge file. The most important thing is to make sure the LLM knows how to find its way to the target document you are interested in. If a document is not referenced anywhere, the LLM will not know about its existence.

The second part is about **maintaining the knowledge and the index**.

Now you have the structure and you added your knowledge and index, how do you update them? What happens if you changed a strategy for your project after a chat session and you have to change multiple files across? What happens if you have a new project and you need to now recreate similar folder structures across? Would you really remember to always register your new file or project to the index for LLM discovery?  

Manual editing is bound to introduce gaps, hence maintenance can't just be "remember to write things down." It needs dedicated skills that handle registering and linking as a matter of course, not as an afterthought.

Here are some **wiki maintenance skills** suggested by Karpathy:

- **Ingest**: takes raw captured material from the inbox and files it into the right place in the knowledge base, registering and cross-linking it as it goes.
- **Lint**: a health check across the wiki: flags stale pages, orphaned content, and anything still sitting unprocessed.
- **Query**: answers a question using only what's already stored, and cites where the answer came from. If the answer doesn't exist yet, that's a signal the wiki has a gap, not a failure of the question.

I'm also having a separate ideation folder, a space to draft freely without any pressure to structure things properly yet. A dedicated skill picks up a finished draft from there and folds it into the curated wiki once it's actually ready. I like keeping the knowledge folder itself fully LLM-managed. Drafts stay messy and separate until they've earned their place. Then, I'll semi-automate those skills via my AI OS so I don't even need to remember to invoke them myself - we'll discuss more about this in the next section.

## Brain Maintenance (AI OS)

<Diagram id="deliberate-upkeep" />
> Left alone, a system drifts. Tended, it stays yours.

Nate Herk's [Three Ms](https://github.com/nateherkai/AIS-OS/blob/main/references/3ms-framework.md) concept is a philosophy to drive an AI native system strategically, instead of letting the system overrun your authority. The goal of an AI OS is to create a comfortable environment to focus on your goals rather than becoming your replacement.

The Three Ms:
- **Mindset**: For every single task, ask: "to what extent can AI be leveraged here?" You treat AI as an interactive mentor rather than a basic output vending machine.
- **Method**: Evaluate and stop unnecessary processes before you try to automate them. Full automation should take up to 60% of the case, 30% AI-assisted, and the rest 10% to be completely manual. Before developing new automations, you are clear on the exact process that is expected to happen during the workflow and are able to list them down accordingly together with end goals.
- **Machine**: Building modular, single-purpose steps like an assembly line, and rolling them out gradually from "training wheels" (manual) to "hands-off" (autonomous).

Once you've built something with the Three Ms, the [Four Cs](https://github.com/nateherkai/AIS-OS/blob/main/.claude/skills/audit/SKILL.md) come in as the audit layer, evaluation pointers to check if your workflow is actually half baked or genuinely solid.

The Four Cs:
- **Context**: What the system knows: the wiki of all custom knowledge about you and your projects
- **Connections**: What the system is allowed to do: proper credentials and permission settings on all integrations so the system can actively read and write data across your dynamic platforms.
- **Capabilities**: How the system should do it: SOPs bundled as agent skills so the LLM follows instructions.
- **Cadence**: How automated the system is: scheduled background routines and cron jobs that execute completely unattended.

Here are some **brain maintenance skills** from Nate Herk's project:

- **Onboard (first-day)**: one-time wizard, scaffolds the system from a short interview.
- **Onboard (re-run)**: re-syncs the system's understanding of the user when context changes.
- **Audit**: scores the system against its own framework based on the 4 Cs, ranks top gaps by leverage.
- **Level-up**: recurring ritual, finds one manual task worth automating, ships a first version using the 3Ms concept.

As priorities shift, technologies evolve and working styles change, you would also update your connections, configurations and automations to keep your efficiency intact. By having an AI OS in place, you can adjust your workflows with a lot less friction compared to the manual approach.

Here's two concrete examples of what I created with AI OS to automate the brain maintenance process itself.

**Example 1: the inbox digest loop.** 

As mentioned previously, I prepared an **inbox/** folder that keeps all raw and unprocessed updates, plans and ideas and we can use them to update information accordingly later. There are two steps for this: 1. adding a new file with raw content to inbox/, and 2. processing information accordingly and removing the raw file.

This one spans both wiki maintenance and brain maintenance at once. To automate this, I configured **hooks** - an automated trigger tied to a session-lifecycle event, [documented here for Claude Code](https://code.claude.com/docs/en/hooks-guide).
1. Send to inbox: On every session close, a **sub-agent** is fired to summarize what changed or got discussed, and writes that summary to the inbox as unprocessed information as a new file in the inbox folder. It could be a new project, a change to an existing one, or just a stray idea for an automation. 
2. Digest from inbox: On every new session start, a second hook checks whether anything's waiting in the inbox and offers to process it, either folding it into the wiki or spinning up a brand-new skill. You can come up with some file naming standards on creation so we can process different types of files uniquely via custom skills. E.g. If it's for updating or adding new wiki, it will trigger the wiki ingest skill accordingly.

<Diagram id="inbox-loop" />

Here's roughly what that looks like end to end, hook config, the file it produces, and what shows up next time you open a session:

```json
// .claude/settings.json (excerpt)
{
  "hooks": {
    "SessionEnd": [
      { "hooks": [{ "type": "agent", "prompt": "Summarize this session and write a short file to inbox/." }] }
    ],
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": ".claude/scripts/check-inbox.sh" }] }
    ]
  }
}
```

```markdown
# inbox/session-recipe-app-add-auth-2026-07-06.md (excerpt)
Explored adding login to the recipe app. Decided on NextAuth over rolling our own.

## Decisions
- Use NextAuth with Google as the provider

## Next steps
- Wire up protected routes
```

```text
SESSION START — 1 pending inbox file:
session-recipe-app-add-auth-2026-07-06.md
Run wiki ingest to process, or skip for now.
```

**Example 2: scheduled weekly linting.** 

I've set up a [Claude routine](https://code.claude.com/docs/en/routines) on the claude.ai site to fire a new Claude session that checks against my second brain private repo (that records everything - all my skills, scripts, permissions, wiki etc) on Github. This job does the following:
1. Use the wiki lint skill to cross check if there's any gaps in the content
2. Does linting on the config, connections, etc to capture potential missing gaps and suggest improvement on my workflow.
3. Sends the output as a new file in the inbox folder, waiting to be ingested on the next session

<Diagram id="weekly-linting-schedule" />

This is just one way to do it. Be creative based on your needs and budget. Over time the workflow will be even further optimised and we'll be adding more and more automations to the brain. Keep iterating - the recurring rituals will keep the brain itself sharp.

## Putting it all together

The wiki side handles *what the system knows*: capture through the inbox, ingest into the right project folder, lint for staleness, query for answers with citations. The brain side handles *how well the system is set up and growing*: onboard when context shifts, audit on a cadence to catch structural drift, level up to ship the next automation.

It is important to build your system very mindfully and gatekeep the quality of both your custom knowledge and the workflow processes. Don't let the LLM dominate the process, or the brain quietly starts speaking a different language than you do. Remember - the system should serve as a representation of YOU. The last thing you want is a generic AI robot that churns garbage under your name.
