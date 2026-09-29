---
id: the-complexity-series-part-9-memory-profiling
title: "The Complexity Series · Part 9: Your Job Got OOM-Killed. Now What? Memory Profiling"
date: August 21, 2026
excerpt: Big O told you the shape of the memory curve. It never told you which line of code is about to get your process killed at 3 AM, and that gap is exactly what memory profiling closes.
readTime: 16 minutes read
tags:
  - Python
  - Performance
  - Data Engineering
  - Big O
category: Data Engineering
---

**The Complexity Series**

1. [Why Your Code Slows Down](#/post/the-complexity-series-part-1-why-your-code-slows-down)
2. [O(1) and the Free Lunch](#/post/the-complexity-series-part-2-o1-and-the-free-lunch)
3. [O(log n) and the Magic of Halving](#/post/the-complexity-series-part-3-olog-n-magic-of-halving)
4. [O(n) and Touching Everything Once](#/post/the-complexity-series-part-4-on-touching-everything-once)
5. [O(n log n) and Why Sorting Costs More Than You Think](#/post/the-complexity-series-part-5-onlogn-sorting-costs)
6. [O(n²) and the Nested Loop Trap](#/post/the-complexity-series-part-6-on2-nested-loop-trap)
7. [O(2ⁿ) and O(n!) When Compute Stops Being the Answer](#/post/the-complexity-series-part-7-o2n-when-compute-dies)
8. [Your Code Is Slow. Now What? Time Profiling](#/post/the-complexity-series-part-8-time-profiling)
9. **Your Job Got OOM-Killed. Now What? Memory Profiling** _(you are here)_

---

Your job passed every test. It ran fine in staging. It ran fine for the first two weeks in production. Then, three weeks in, it got OOM-killed at 3 AM, and the on-call engineer who picked it up had no idea where to even start looking.

The last post in this series covered time profiling: `cProfile`, `ncalls`, `cumtime`, finding which function is eating your CPU cycles. This post covers the other half of the same question. Not "why is this slow" but "where are the bytes actually going, right now, in this specific run."

That distinction matters more than it sounds like it should, because people conflate these two constantly.

## Big O Is the Policy. Profiling Is the Warehouse Floor.

Imagine you're managing a warehouse. Big O tells you the policy: *as we receive more shipments, storage requirements grow proportionally, this is O(n) space.* That's the scaling law. It tells you whether you'll run out of room in three months.

Memory profiling tells you the operational reality of one specific moment: *right now, Shelf B is at 94% capacity, and it's all bubble wrap from the returns department.* It tells you where the bytes are coming from today.

You need both. The scaling law tells you whether you'll OOM eventually. The profiling tells you which line of code is responsible for it.

## The First Question: Is It Actually Growing?

Before you instrument a single line of code, answer this at the process level: is your job accumulating memory, or does it just look that way? Sometimes what looks like a leak is a one-time startup allocation that never grows again. Sometimes what looks fine is slowly climbing toward an OOM that lands at 3 AM on a Tuesday.

The cheapest tool for this question is [`psutil`](https://pypi.org/project/psutil/). No code instrumentation, no slowdown, just reading the process's RSS: **Resident Set Size**, the actual physical RAM your process currently occupies.

```python
import psutil
import os

proc = psutil.Process(os.getpid())

def check_memory(label: str) -> float:
    rss_mb = proc.memory_info().rss / 1_048_576
    print(f"[{label}] RSS: {rss_mb:.1f} MiB")
    return rss_mb
```

You call `check_memory("before batch")` and `check_memory("after batch")` at strategic points. If the number keeps climbing with each batch, that's accumulation. If it stabilizes, you're fine.

Why RSS specifically, and not virtual memory? Virtual memory can look enormous and mean almost nothing. It's reserved and mapped, not necessarily used. RSS is what the OS actually had to provision in physical RAM. It's what will actually get you OOM-killed.

And here's the part that matters more than the absolute number: it's not the number itself, it's **the pattern over time**. Look at two jobs doing the same workload, ten batches of 100,000 events each:

```python
import psutil, os, time

proc = psutil.Process(os.getpid())

def rss_mb():
    return proc.memory_info().rss / 1_048_576

def job_a():
    """streaming: process and discard each batch"""
    for batch_num in range(10):
        batch = [{"id": i, "value": i * 1.5} for i in range(100_000)]
        result = sum(r["value"] for r in batch)
        print(f"  batch {batch_num}: {rss_mb():.1f} MiB")

accumulated = []
def job_b():
    """accumulating: holds every batch forever"""
    for batch_num in range(10):
        batch = [{"id": i, "value": i * 1.5} for i in range(100_000)]
        accumulated.extend(batch)
        print(f"  batch {batch_num}: {rss_mb():.1f} MiB")
```

Job A stays flat: 52.1, 52.3, 52.1, all the way to 52.4 MiB. Job B climbs linearly: 60.1, 68.3, 76.5, up to 132.7 MiB by the last batch, roughly 8 MiB per batch.

![Two line charts on the same axes: one flat, one climbing steadily upward, both starting from a shelf of stacked boxes](assets/rss-pattern-streaming-vs-accumulating.svg)

Job B's RSS after `k` batches is approximately `baseline + k × (bytes per batch)`, which is a linear function of k. Plot RSS against batches processed and you get a straight line, the same visual signature as O(n) space from earlier in this series.

And this is exactly where the doubling test from the rest of the series applies to memory. Double the number of batches. If RSS roughly doubles, you have O(n) accumulation. If it quadruples, something O(n²) is hiding in there.

This gives you your first diagnostic question for any pipeline:

> Does the RSS line go flat after startup, climb linearly, or climb faster than linearly?

Each answer points to a different problem and a different fix.

## Which Line Is Responsible?

Once you know the job is accumulating, the next question is code-level: which line of code is responsible? This is where you reach for [`tracemalloc`](https://docs.python.org/3/library/tracemalloc.html), in the standard library, zero installation required. It takes snapshots of the memory allocator at two points in time and shows you the difference.

If `psutil` told you "the warehouse is getting full," `tracemalloc` is the security camera footage: "Shelf B received 500 boxes between 2pm and 3pm, and they came from Loading Dock 3." It records *where* each allocation came from, down to the line of code.

```python
import tracemalloc

tracemalloc.start()
snapshot_before = tracemalloc.take_snapshot()

data = [{"id": i, "value": i * 1.5} for i in range(500_000)]

snapshot_after = tracemalloc.take_snapshot()
tracemalloc.stop()

top_stats = snapshot_after.compare_to(snapshot_before, "lineno")
for stat in top_stats[:5]:
    print(stat)
```

The output:

```text
example.py:8: size=57.2 MiB (+57.2 MiB), count=500000 (+500000), average=120 B
```

Three numbers. `count` is 500,000 because that's the loop count. `size` is the total memory those 500,000 dicts occupy: 57.2 MiB. `average` is `size / count`: 57,200,000 bytes divided by 500,000 objects, which is 114.4 bytes per object, rounded to 120.

That 120 bytes is worth pausing on, because it surprises people. A dict holding one integer and one float feels like it should cost maybe 16 bytes. But CPython dicts carry real overhead: roughly 200 bytes for the dict object itself, the hash table structure, pointers to keys and values, reference counting metadata. This is why space complexity matters even when n "seems small." 500,000 dicts at 120 bytes each is 57 MiB. At 5,000,000 it's 570 MiB. The constant factor is real, even though Big O deliberately ignores it.

### Multiple Allocating Lines

The real power of `tracemalloc` shows up when you have several allocations in one function and need to find which one is the problem:

```python
def process_events(n):
    raw_events = [{"id": i, "value": i * 1.5} for i in range(n)]              # line A
    enriched = [{"id": e["id"], "value": e["value"],
                 "label": f"event_{e['id']}"} for e in raw_events]             # line B
    totals = [e["value"] * 2 for e in enriched]                                # line C
    return totals
```

Running `process_events(200_000)` under a snapshot comparison:

| Line | Purpose | `+size` | `count` | average |
| :--- | :--- | :--- | :--- | :--- |
| B (`enriched`) | adds a `label` string field | 38.1 MiB | 200,000 | 200 B |
| A (`raw_events`) | id + value dict | 22.9 MiB | 200,000 | 120 B |
| C (`totals`) | value floats only | 3.1 MiB | 200,000 | 16 B |

Line B costs the most per object because it carries an extra string field. Line C, just floats, is cheapest.

Here's the reading habit worth building: **don't look at `size` first, look at `+size` first.** `size` is cumulative, it includes everything alive at that moment. `+size` is the delta, what this specific code block added. That's the column that answers "what did my function actually cost."

## Cutting Peak Memory Without Changing the Output

Say you had to reduce peak memory by 50% on `process_events` without changing what it returns. The highest-delta line is the obvious target: `enriched` duplicates the id and value fields from `raw_events` just to add a label. Eliminate the intermediate list and build the label directly.

```python
# original: two full lists alive at peak
def process_events_original(n):
    raw_events = [{"id": i, "value": i * 1.5} for i in range(n)]
    enriched = [{"id": e["id"], "value": e["value"],
                 "label": f"event_{e['id']}"}
                for e in raw_events]
    totals = [e["value"] * 2 for e in enriched]
    return totals

# fix: label built from birth, no intermediate copy
def process_events_fixed(n):
    raw_events = [{"id": i, "value": i * 1.5,
                   "label": f"event_{i}"}
                  for i in range(n)]
    totals = [e["value"] * 2 for e in raw_events]
    return totals
```

At peak, the original holds **both** `raw_events` and `enriched` alive simultaneously, because Python can't release `raw_events` until `enriched` finishes building:

```text
original peak = raw_events + enriched + totals
              = (120 × n) + (200 × n) + (16 × n)
              = 336n bytes

fixed peak    = raw_events + totals
              = (200 × n) + (16 × n)
              = 216n bytes
```

That's a 36% reduction, same output, same O(n) space class, just a smaller constant factor.

But push one step further. `totals` is the only thing the function returns, it never needs `raw_events` and `totals` alive at the same time. What if neither list gets built in full, and you process one event at a time instead? This is the generator pattern from earlier in the series:

```python
def process_events_generator(n):
    def _generate():
        for i in range(n):
            value = i * 1.5
            yield value * 2
    return list(_generate())
```

Now only one event exists in memory at any moment inside the generator. Auxiliary space for the processing stage drops from O(n) to O(1):

| Version | Peak bytes per n | Intermediate lists |
| :--- | :--- | :--- |
| original | 336n | 2 |
| fixed | 216n | 1 |
| generator | 16n (if materialized) | 0 |

All three are technically O(n) space class. A complexity analysis alone says they're equivalent. But the constants differ by 21x between worst and best, and that's exactly the point where Big O alone would mislead you.

> **Never materialize what you don't need to keep.** The output requirement drives the space requirement, not the input size.

## The Bug That Only Shows Up Three Weeks Later

Here's a Kafka consumer pattern that looks completely reasonable:

```python
seen_ids = set()   # module-level, lives for the process lifetime

def process_batch(batch):
    results = []
    for event in batch:
        if event["id"] not in seen_ids:
            seen_ids.add(event["id"])
            results.append(event["value"] * 2)
    return results
```

On day one this works perfectly. RSS looks fine. Tests pass. Three weeks later the process gets OOM-killed.

`results` is O(n) **per batch**, it gets garbage collected the moment the function returns. `seen_ids` is O(n) **over the lifetime of the process**, and it never gets released. That's the bug. Not a logic bug, a **scope bug**. The deduplication itself is correct. `seen_ids` lives at module level, so Python's garbage collector never touches it. Every distinct id ever seen across every batch ever processed accumulates there permanently.

Do the math. In CPython, a small integer object costs roughly 28 bytes, and a set entry (the hash table slot pointing to it) costs about 8 bytes more, so each unique id costs roughly 36 bytes. At 1 million unique ids per day:

| Day | Unique ids | Memory |
| :--- | :--- | :--- |
| 1 | 1,000,000 | 34 MiB |
| 7 | 7,000,000 | 240 MiB |
| 30 | 30,000,000 | ~1,030 MiB |
| 90 | 90,000,000 | ~3,090 MiB, OOM on a 4 GB container |

The growth is perfectly linear, O(n) where n is total distinct ids ever seen. But because the process runs continuously, n grows without bound.

Here's what [`objgraph`](https://pypi.org/project/objgraph/) would have shown, before it ever reached production, if you'd checked during load testing:

```python
import objgraph
import gc

def checkpoint(label):
    gc.collect()
    print(f"\n=== {label} ===")
    objgraph.show_growth(limit=5)
```

Running three simulated batches of 100,000 events each, the `int` count climbs by exactly 100,000 after every batch and never drops. That's the fingerprint of unbounded accumulation: a delta that never returns to zero.

## Three Tools, One Funnel

You now have three diagnostic tools, and each answers a narrower question than the last:

```text
psutil      → is the process growing? how fast?
tracemalloc → which line is allocating?
objgraph    → which object type is accumulating and never releasing?
```

![Funnel diagram narrowing from psutil at the top, to tracemalloc in the middle, to objgraph at the point, ending in a single confirmed line of code](assets/memory-profiling-funnel.svg)

Broad to narrow. You wouldn't start with `objgraph` any more than you'd disassemble an engine before checking whether it has fuel.

## Fixing seen_ids

There are three broad approaches to fixing an unbounded module-level accumulator like `seen_ids`, and each trades off differently.

**Fix 1, time-windowed clearing:**

```python
import time

seen_ids = {}   # id -> timestamp first seen
WINDOW_SECONDS = 86_400   # 24 hours, agreed with stakeholders

def process_batch_windowed(batch):
    now = time.time()
    expired = [id for id, ts in seen_ids.items()
               if now - ts > WINDOW_SECONDS]
    for id in expired:
        del seen_ids[id]

    results = []
    for event in batch:
        if event["id"] not in seen_ids:
            seen_ids[event["id"]] = now
            results.append(event["value"] * 2)
    return results
```

Space is O(w), bounded by the number of distinct ids within the window, not the process lifetime.

**Fix 2, LRU bounded cache:**

```python
from collections import OrderedDict

class BoundedDeduplicator:
    def __init__(self, maxsize: int):
        self.seen = OrderedDict()
        self.maxsize = maxsize

    def is_duplicate(self, id) -> bool:
        if id in self.seen:
            self.seen.move_to_end(id)
            return True
        self.seen[id] = True
        if len(self.seen) > self.maxsize:
            self.seen.popitem(last=False)
        return False
```

Space is O(maxsize), a hard ceiling. The risk: if a legitimate id gets evicted and reappears, it passes through as a non-duplicate.

**Fix 3, [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter):**

```python
from pybloom_live import BloomFilter

bloom = BloomFilter(capacity=10_000_000, error_rate=0.01)

def process_batch_bloom(batch):
    results = []
    for event in batch:
        if event["id"] not in bloom:
            bloom.add(event["id"])
            results.append(event["value"] * 2)
    return results
```

Space is O(1) relative to ids seen: a fixed-size bit array, sized at initialization. At 1% error rate for 10 million ids, the sizing math (`bits = -n × ln(p) / (ln(2))²`) works out to roughly 11.4 MiB, forever, no matter how long the process runs.

| | Fix 1 (windowed) | Fix 2 (LRU) | Fix 3 (Bloom) |
| :--- | :--- | :--- | :--- |
| Space complexity | O(w) | O(maxsize) | O(1) |
| False positives | none | possible | possible (~1%) |
| False negatives | possible if id reappears after window expires | possible | never |
| Business fit | needs a time SLA | needs a size SLA | needs error tolerance |

> **Does this mean bounding is always the wrong call?**
>
> No. A bound isn't inherently bad practice if it's derived from a business rule rather than an arbitrary guess. "Deduplicate within a 24 hour window" is a legitimate requirement, and an LRU cache sized to "maximum distinct ids in any 24 hour period" is a principled bound. A naive size cap with no time semantics is the fragile version.

The decision is driven entirely by what a wrong answer costs downstream. A payments pipeline can't tolerate a false positive dropping a legitimate transaction, so a Bloom filter is off the table; windowed dedup with a carefully agreed window is the minimum acceptable approach. Log aggregation can tolerate an occasional false positive deduplicating a legitimate log line, so a Bloom filter is fine. A regulatory audit trail needs neither false positives nor false negatives nor expiry, which means it needs a persistent store, not an in-memory structure at all.

## Reading objgraph Across the Three Fixes

`objgraph.show_growth()` counts **live objects in memory right now**, not how many were ever created. For Fix 1 (windowed), ids expire and get deleted, so the live `int` count oscillates: it grows, then shrinks, then grows again, trending toward a stable level as expiry keeps working.

For Fix 3 (Bloom filter), the picture is completely different. A Bloom filter doesn't store the ids themselves, it hashes each id into a fixed bit array. The integer object for the id exists momentarily during the `add()` call, then gets garbage collected immediately because nothing holds a reference to it afterward. `objgraph` after ten batches shows near-zero `int` accumulation, even though the filter is genuinely using 11.4 MiB of memory. That memory is a contiguous block of bits, invisible to `objgraph`'s object-type tracking. `psutil` would show you the 11.4 MiB in RSS. `objgraph` would show you almost nothing growing. Both are telling the truth about different things.

## The Doubling Test Has Noise, Not Just Signal

A teammate runs a memory doubling test and reports: *"The ratio showed 1.9x at n=10,000 and 2.1x at n=100,000. Sometimes it goes below 2x, so maybe the space complexity is sub-linear, maybe O(log n)?"*

The observation is accurate, the interpretation isn't. A ratio of 1.9x and 2.1x isn't two different complexity classes, it's the same class with measurement noise. Python interpreter overhead, CPython's memory alignment, garbage collector timing, and OS page allocation all add a roughly constant offset to every measurement. At small n, that constant swamps the algorithm's own allocation and pushes the ratio away from 2x. At large n, the algorithm's allocation dominates and the ratio converges toward the true value.

```text
O(n)       → ratio clusters around 2.0x at large n
O(n log n) → ratio clusters around 2.1x to 2.2x
O(log n)   → ratio clusters around 1.0x, barely changes
O(n²)      → ratio clusters around 4.0x
```

A ratio of 1.9x to 2.1x is nowhere near the 1.0x you'd expect from O(log n). That's O(n), full stop, with normal noise around it.

As a rule of thumb, trust the ratio once the algorithm's own allocation dominates Python's constant overhead, typically n ≥ 100,000 for lightweight objects like integers and small dicts, n ≥ 10,000 for larger objects like nested dicts or strings. And don't trust a single measurement. Run the doubling test across several successive doublings and look for the ratio to stabilize:

| n | ratio |
| :--- | :--- |
| 10,000 | 1.6x, overhead swamping signal |
| 50,000 | 1.8x |
| 100,000 | 1.95x |
| 200,000 | 1.98x, trustworthy |
| 400,000 | 1.99x, confirmed O(n) |

## From Development to Production

Everything above answers "how do I diagnose a memory problem." The harder question is where each tool belongs in your actual engineering workflow, because the right tool changes depending on the stage.

| Stage | Key question | Primary tool | What to look for | Red flag |
| :--- | :--- | :--- | :--- | :--- |
| Development | Which line is allocating? | `memory_profiler` `@profile` on a representative sample (1% of prod volume, minimum 100k rows) | highest `+Increment`, not highest total | large increment on a line inside a loop |
| Testing | Does memory grow at the rate space complexity predicts? | `tracemalloc` doubling test as an automated pytest, run nightly in CI | ratio ~1x for O(1), ~2x for O(n), ~4x for O(n²) | ratio outside the expected band, or drifting across successive doublings |
| Peer Review | Can risks be spotted by reading code alone? | pattern checklist: module-level structures, materialization before filtering, slice copies, nested loops that append | any structure that grows on every call with no corresponding clear | a module-level `list`/`dict`/`set` that's never cleared or bounded |
| Release | Does memory behave safely under real conditions? | `psutil` shadow test on production data sample + soak test + staged rollout | RSS slope near zero, concurrency calculation passes, no surprise skew | positive RSS slope in soak test, or real data revealing a hot key uniform test data missed |
| Monitoring | Is the process drifting from baseline over time? | `psutil` per-batch metrics + rolling-window trend detector | RSS flat around baseline | RSS exceeding 150% of baseline, or a positive slope trend |

The `memory_profiler` decorator is deliberately intrusive, it slows the function down. That's fine in development. It's never acceptable in production, and must come out before code leaves your machine.

The testing stage is where the doubling test becomes a formal, automated assertion instead of an ad hoc diagnostic:

```python
import tracemalloc

def measure_peak_memory(fn, *args) -> float:
    tracemalloc.start()
    fn(*args)
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return peak / 1_048_576

class TestMemoryProfile:

    def test_space_complexity_is_linear(self):
        peak_n = measure_peak_memory(build_index, make_events(100_000))
        peak_2n = measure_peak_memory(build_index, make_events(200_000))
        ratio = peak_2n / peak_n
        assert 1.8 <= ratio <= 2.2, (
            f"Expected O(n) memory ratio ~2x, got {ratio:.2f}x. "
            f"Possible O(n²) accumulation."
        )
```

The tolerance band, 1.8x to 2.2x rather than an exact 2.0x, accounts for the same measurement noise discussed above. You're not testing for a precise number, you're testing that the ratio is consistent with O(n) and inconsistent with O(n²).

At release, the reason data shape matters is that your test data was probably uniform, and production data almost never is. Real user behavior follows a power law. A hot key that generates 30% of all events skews peak memory well past what a uniform test predicted, and the mitigation is a shadow test against a real production sample before rollout.

At the monitoring stage, alert thresholds should come from the soak test baseline, never from a guess. A common starting point: warn at 150% of baseline RSS, go critical at 200%, page on-call at 250% or a sustained positive slope. Too tight and engineers get alert fatigue and start ignoring pages. Too loose and the OOM happens before the alert fires.

When something does escape all five layers, the investigation in production follows the same funnel, just applied live: confirm the growth with `psutil` metrics on a dashboard, check whether batch delta or baseline is off, enable `tracemalloc` temporarily on one isolated worker (never the full fleet, the overhead is too high), then check `objgraph` on that same worker to see which object type is accumulating. Fix, deploy to one worker, watch RSS for 24 hours, then roll out to the fleet.

Each layer catches what the previous one missed. Problems that escape development get caught in testing. Problems that escape testing get caught in review. What escapes review gets caught before release. What escapes all of that gets caught by monitoring, before it turns into a page.

> A ratio consistently near 2x when n doubles is the O(n) signature. Small fluctuation around it is noise, not a different complexity class, and the moment you catch yourself reasoning about a single measurement instead of a trend across several doublings, you're looking at the wrong number.

Big O tells you the shape of the curve. Profiling tells you the constants inside it. The engineers who get paged at 3 AM are the ones who only ever checked the first one.
