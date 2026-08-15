---
id: the-complexity-series-part-8-time-profiling
title: "The Complexity Series · Part 8: Your Code Is Slow. Now What? Time Profiling"
date: August 15, 2026
excerpt: Big O tells you the shape of the cost curve. It never tells you which function is actually eating your 45-minute job right now, on this hardware, with this data. That gap is what profiling closes.
readTime: 16 minutes read
tags:
  - Python
  - Performance
  - Data Engineering
  - Big O
category: Data Engineering
coverImage: assets/big-o-series-cover.png
---

**The Complexity Series**

1. [Why Your Code Slows Down](#/post/the-complexity-series-part-1-why-your-code-slows-down)
2. [O(1) and the Free Lunch](#/post/the-complexity-series-part-2-o1-and-the-free-lunch)
3. [O(log n) and the Magic of Halving](#/post/the-complexity-series-part-3-olog-n-magic-of-halving)
4. [O(n) and Touching Everything Once](#/post/the-complexity-series-part-4-on-touching-everything-once)
5. [O(n log n) and Why Sorting Costs More Than You Think](#/post/the-complexity-series-part-5-onlogn-sorting-costs)
6. [O(n²) and the Nested Loop Trap](#/post/the-complexity-series-part-6-on2-nested-loop-trap)
7. [O(2ⁿ) and O(n!) When Compute Stops Being the Answer](#/post/the-complexity-series-part-7-o2n-when-compute-dies)
8. **Your Code Is Slow. Now What? Time Profiling** _(you are here)_
9. [Your Job Got OOM-Killed. Now What? Memory Profiling](#/post/the-complexity-series-part-9-memory-profiling)

---

A colleague hands you a Spark job. It's taking 45 minutes. You look at the code and it looks fine: no obvious nested loops, no red flags. What do you do?

Every post in this series up to now has given you a way to read code and name its complexity class before you run it. That's a real skill, and it's the right first move. But it has a hard limit: Big O tells you the shape of a function's growth curve. It deliberately throws away everything else. It doesn't tell you *which* function is actually consuming those 45 minutes, on this specific machine, with this specific data, right now.

Two functions can both be O(n²), and one can be 50 times slower than the other in practice. Big O can't distinguish them. Profiling is what closes that gap.

## The Shape and the Constants Are Different Questions

Here's a way to hold both ideas in your head at once:

| | What it tells you | What it misses |
| :--- | :--- | :--- |
| Big O | This scales quadratically | Which function is actually slow today |
| Profiling | This specific function took 38 of your 45 minutes | Whether it gets 4x worse when data doubles next month |

Neither replaces the other. If you only have profiling numbers, you know where today's time went, but not whether the pipeline survives next quarter's data volume. If you only have Big O, you know the shape, but not whether the expensive-looking O(n log n) function is even the one that matters.

That second failure mode is easy to underestimate, so make it concrete. Say your pipeline runs two operations:

```text
Operation A: O(n)   processing a stream of events, n = 10,000,000
Operation B: O(n²)  joining against a static reference table, n = 50
```

If you only looked at the complexity labels, you'd flag B: quadratic sounds scarier than linear. Plug in the real numbers and the picture flips:

| Operation | Complexity | n | Actual work |
| :--- | :--- | :--- | :--- |
| A | O(n) | 10,000,000 | 10,000,000 units |
| B | O(n²) | 50 | 2,500 units |

A is doing 4,000 times more work than B, despite having the "better" complexity class. A profiler would show A eating nearly the entire runtime. Big O alone would have pointed you at B. This is exactly why the question "what is n, actually, at this scale?" has to come before you trust a complexity label to predict where the time goes.

## Meet tottime

`cProfile`, Python's [built-in profiler](https://docs.python.org/3/library/profile.html), answers one question: for each function in your program, how much time was spent there, and how many times was it called? It doesn't tell you complexity class. It doesn't tell you why something is slow. It tells you where the time actually went, with real numbers.

The first column worth understanding is `tottime`, and it's also the most commonly misread:

```text
tottime = time spent inside this function itself,
          not counting time spent in functions it called
```

Take this code:

```python
def process_batch(records):
    results = []
    for r in records:
        results.append(transform(r))
    return results

def transform(record):
    return record * 2
```

If `process_batch` takes 10 seconds total and `transform` accounts for 9 of those seconds, the profiler attributes the split precisely:

```text
tottime for process_batch = 1 second   (just the loop overhead)
tottime for transform     = 9 seconds  (the actual work)
```

The 9 seconds inside `transform` are stripped out of `process_batch`'s `tottime` and attributed directly to `transform`. If you saw those two numbers, you'd correctly focus on `transform`. But that instinct only gets you halfway, and the second half is where people go wrong.

## ncalls: Frequency Problem or Efficiency Problem

Suppose the actual output looked like this instead:

| function | ncalls | tottime |
| :--- | :--- | :--- |
| process_batch | 1 | 1.00s |
| transform | 1,000,000 | 9.00s |

Same 9 seconds. But now the question changes shape entirely. It's no longer "transform is slow." It's:

```text
Is transform slow because each individual call is expensive?
Or is transform cheap per call, but called an enormous number of times?
```

Do the arithmetic: `9.00s / 1,000,000 calls = 0.000009s per call`, nine microseconds. That's fast. The problem isn't that `transform` is slow, it's that something is calling it a million times. The fix isn't to speed up `transform`. It's to ask why it's being called that often and whether that can be reduced.

`ncalls` is the column that makes this distinction visible without any manual counting: it's simply how many times a function was called during the run, tracked automatically. Combined with `tottime`, you get a derived signal:

```text
High ncalls, low cost per call  → frequency problem
                                   the function is fine,
                                   something calls it too often

Low ncalls, high cost per call  → efficiency problem
                                   the function is genuinely slow,
                                   the algorithm inside needs work
```

These two failure modes point at opposite fixes, and you cannot tell them apart from `tottime` alone. A `write_to_db` function with `ncalls=1` and a large `tottime` means one massive batched write; the fix is streaming smaller chunks more often. The same function with `ncalls=1,000,000` and a tiny per-call cost means too many round trips; the fix is batching larger chunks less often. Read the wrong signal and you optimize in exactly the wrong direction.

![Two paths branching from the same tottime number: one toward a single dense block labeled expensive call, the other toward a long row of many small identical blocks labeled frequent calls](assets/frequency-vs-efficiency-branch.svg)

## cumtime: When the Function Itself Isn't the Problem

There's a third column, and it completes the picture. Where `tottime` strips out everything a function called, `cumtime` includes it:

```text
cumtime = total time in this function,
          including everything it called
```

Put all three together with a small pipeline:

```python
def run_pipeline(records):
    cleaned = clean(records)      # 2s
    enriched = enrich(cleaned)    # 15s
    write_to_db(enriched)         # 8s
```

| function | ncalls | tottime | cumtime |
| :--- | :--- | :--- | :--- |
| run_pipeline | 1 | 0.01s | 25.01s |
| clean | 1 | 2.00s | 2.00s |
| enrich | 1 | 15.00s | 15.00s |
| write_to_db | 1 | 8.00s | 8.00s |

`run_pipeline` has `tottime = 0.01s`, almost nothing, because it's just calling other functions. Its `cumtime = 25.01s` is the entire pipeline, everything included. That contrast is the pattern worth memorizing:

```text
Large cumtime, tiny tottime  → coordinator function
                                real work is in its callees,
                                look at what it calls, not at it

Large cumtime, large tottime → this function does real work itself
                                AND calls expensive functions,
                                investigate both
```

Now push one layer deeper. Say `enrich` itself calls `lookup_feature_store`, and that inner call accounts for 14 of `enrich`'s 15 seconds:

| function | ncalls | tottime | cumtime |
| :--- | :--- | :--- | :--- |
| run_pipeline | 1 | 0.01s | 25.01s |
| clean | 1 | 2.00s | 2.00s |
| enrich | 1 | 1.00s | 15.00s |
| lookup_feature_store | 1 | 14.00s | 14.00s |
| write_to_db | 1 | 8.00s | 8.00s |

If you'd only sorted by `cumtime`, you'd stop at `enrich` and start optimizing the wrong function: it's only doing 1 second of genuine work. The actual target, `lookup_feature_store`, is one level deeper. That gives you a reliable three-step reading strategy:

```text
Step 1: sort by cumtime descending
        → find the expensive branch of the pipeline

Step 2: follow that branch down
        → find the function where tottime is large

Step 3: that function is your actual target
```

![A shallow wide tree: a root node branching into three children, one child dimmed with a thin outline (small tottime, large cumtime), a grandchild beneath it drawn as a solid filled block (large tottime), the path between them highlighted](assets/coordinator-vs-real-cost.svg)

## Running It for Real

Theory settles fast once you see one actual profiler run. Take this pipeline:

```python
import cProfile
import time

def fetch_records(n):
    return list(range(n))

def transform(record):
    time.sleep(0.00001)   # simulates a small per-record cost
    return record * 2

def enrich(records):
    return [transform(r) for r in records]

def write_to_db(records):
    time.sleep(0.5)   # simulates a single bulk write
    return

def run_pipeline(n):
    records = fetch_records(n)
    enriched = enrich(records)
    write_to_db(enriched)

cProfile.run('run_pipeline(10000)')
```

Before looking at the output, reason it through: `transform` runs in a loop of 10,000, so it should have the highest `ncalls` and, since it's doing the real per-record work, the highest `tottime`. `enrich` wraps that loop, so it should have the highest `cumtime` among the non-root functions. Here's the actual output:

```text
         30004 function calls in 0.623 seconds

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.001    0.001    0.623    0.623 <string>:1(<module>)
        1    0.000    0.000    0.623    0.623 pipeline.py:18(run_pipeline)
        1    0.000    0.000    0.082    0.082 pipeline.py:14(write_to_db)
        1    0.002    0.002    0.541    0.541 pipeline.py:10(enrich)
        1    0.000    0.000    0.001    0.001 pipeline.py:5(fetch_records)
    10000    0.539    0.000    0.539    0.000 pipeline.py:7(transform)
    10000    0.000    0.000    0.000    0.000 {built-in method time.sleep}
```

The `ncalls` and `cumtime` predictions land exactly right. But look at `tottime` again: `transform` at 0.539s makes sense, it's doing the actual work 10,000 times. `enrich` at 0.002s also makes sense, it's just looping. But `write_to_db` shows `tottime = 0.082s`, and it does almost nothing but sleep for half a second. Where did that come from?

The answer is a real limitation worth knowing before it costs you an afternoon of confused debugging. `cProfile` intercepts pure Python function calls cleanly and strips their cost out of the caller's `tottime`. That's why 10,000 calls to `transform` get fully removed from `enrich`'s `tottime`, leaving it at a bare 0.002s of loop overhead. But `time.sleep` is a C-level built-in, and `cProfile` cannot intercept those calls the same way. Some of that sleep time leaks directly into the caller's `tottime` instead of being cleanly attributed to `time.sleep` itself.

```text
Python function calls  → cProfile intercepts cleanly
                          time is stripped from the caller's tottime

C-level built-ins      → cProfile cannot always intercept cleanly
                          time can leak into the caller's tottime
```

> **Does this mean `tottime` is unreliable?**
>
> Not in general, just in this specific case. `tottime` is trustworthy for pure Python code. It gets murky the moment a function calls into C extensions: `numpy` operations, database drivers, compression libraries, anything with a compiled core. If you see a function with a surprisingly low `tottime` despite doing something that should be expensive, that's your cue to check what it's calling underneath, not to trust the number at face value.

When you hit that wall, the fix is a different tool: [`line_profiler`](https://pypi.org/project/line-profiler/), which measures time at the line level instead of the function level. It sidesteps the whole C-built-in ambiguity, because it shows you the cost sitting directly next to the line that caused it:

```python
# pip install line_profiler

@profile
def write_to_db(records):
    time.sleep(0.5)   # line_profiler attributes this line directly
    return
```

```text
Line #    Hits    Time  Per Hit   % Time  Line Contents
──────────────────────────────────────────────────────
     1       1     0.0      0.0      0.0  def write_to_db(records):
     2       1   500.1    500.1    100.0      time.sleep(0.5)
     3       1     0.0      0.0      0.0      return
```

No ambiguity. `cProfile` finds which branch and which function to look at. `line_profiler` finds which exact line inside it.

## Mapping the Numbers Back to a Complexity Class

Everything so far tells you where time is going in one specific run, at one specific input size. It doesn't tell you what happens when that input doubles. That's where the doubling test from earlier in this series meets profiling directly: instead of running it once, run it at n, 2n, and 4n, and watch how `tottime` for the expensive function responds.

```text
n              tottime for transform
──────────────────────────────────
10,000         0.54s
20,000         1.08s
40,000         2.16s
```

Time doubles every time n doubles. That's the O(n) signature. Now compare a different pattern for the same function at the same input sizes:

```text
n              tottime for transform
──────────────────────────────────
10,000         0.54s
20,000         2.16s
40,000         8.64s
```

Every doubling of n quadruples the time, consistently: `0.54 → 2.16` is 4x, `2.16 → 8.64` is 4x. It's tempting to read "always 4x" as a constant multiplier sitting in front of an O(n) term, but that's not what's happening. The 4x is the mathematical consequence of n being squared: doubling n means `(2n)² = 4n²`. That's an O(n²) signature, and you reached it without opening the function's source once.

```text
time doubles on every n doubling     → O(n)       single pass, linear scan
time quadruples on every n doubling  → O(n²)      nested loop somewhere
time barely moves on every doubling  → O(log n)   some halving structure
time grows more than 2x, less than 4x → O(n log n) sort or divide and conquer
```

![Three arrows radiating from a single input-doubling point, each arrow ending at a different output multiplier: one labeled with a small gap, one with a matched double gap, one with a much larger quadrupled gap](assets/doubling-signature-branches.svg)

That signature turns a vague complaint into a specific, falsifiable claim. "Your function shows quadrupling behavior on every data doubling. That's an O(n²) signature. At your current growth rate, this function will take four times longer every time your data doubles. There is likely a nested loop that can be replaced with a hash lookup." That's not a guess about the code. It's a conclusion drawn entirely from timing evidence, and it tells you exactly what shape of fix to look for before you've read a single line.

## Turning a Vague Complaint Into a Timeline

This distinction matters most when you can't fix the code yourself. Picture a crawler from a third-party tool, pulling metadata into a database, where memory climbs steadily throughout every run until it hits a container limit. You don't own the source. Increasing the memory limit buys time but doesn't touch the underlying shape: the line's slope never changes, it just hits the ceiling later.

```text
Memory consumed at time t = c × n(t)

where n(t) = number of objects processed by time t
      c    = memory per object, fixed, you can't change it
```

This is exactly the situation where profiling stops being a debugging tool and becomes a negotiating one. A vague complaint like "your crawler is slow and uses too much memory" gets ignored. A profiling report doesn't:

> "Your crawler holds O(n) objects in memory simultaneously. At our current scale, that's X GB. Our data grows at Y objects per month. We will hit the hard limit of our infrastructure in Z months."

That's a mathematical argument with a timeline attached. Teams respond to that in a way they don't respond to "this feels slow." The same discipline that helps you fix your own code is what lets you make an evidence-based case about code you can't touch at all.

## The Workflow, and Where It Fits in Review

Put the pieces together and the practical order is:

```text
1. Write the code
2. Run cProfile to find the expensive functions
3. Run the doubling test on those specific functions
4. Read the complexity class from the timing ratios
5. Only then open the code for that one function
   and look for the structure that matches the class
```

The discipline is step 5. You don't read the whole codebase guessing at what's slow. You go directly to one function, already holding a specific hypothesis about what you'll find inside it.

That workflow doesn't mean every pull request needs a profiling run attached. Requiring representative data and a realistic environment for every code review is too heavy a bar for most teams, and most review environments don't have either. A more workable split is two stages:

```text
Stage 1: Code review
         catch obvious complexity issues by reading:
         nested loops, unbounded accumulation, repeated
         full scans inside other loops. Flag these as
         "needs profiling before merge."

Stage 2: Profiling gate
         only for flagged functions, or any function
         touching data at scale. Run the doubling test,
         confirm the complexity class is acceptable for
         the expected data volume.
```

The trigger for stage two is a single question: does this function touch data whose size is unpredictable or growing? If yes, profile before merge. If no, code review alone is enough.

> **Does this mean complexity review alone is enough for anything safe from that trigger?**
>
> No, and the two stages aren't substitutes for each other. Complexity review without data volume context is incomplete: you can spot a nested loop but not know if it matters at this scale. Profiling without complexity knowledge is just numbers: you can see a function is slow today but not know if it survives next quarter's growth. You need the structural read to know where to look, and the profiling evidence to know if it's actually a problem.

The next post in this series covers the other half of this question: not why your code is slow, but where your memory is actually going when a job gets OOM-killed at 3 AM.

Sort by `cumtime` first, follow the expensive branch down until `tottime` and `cumtime` converge, then run the doubling test on whatever you find there. That single sequence replaces reading the whole codebase with a hypothesis you can go verify.
