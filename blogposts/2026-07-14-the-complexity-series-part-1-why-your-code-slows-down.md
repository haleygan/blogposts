---
id: the-complexity-series-part-1-why-your-code-slows-down
title: "The Complexity Series · Part 1: Why Your Code Slows Down"
date: July 14, 2026
excerpt: Wall-clock time tells you how slow your code is today. Algorithmic complexity tells you whether it can survive tomorrow.
readTime: 18 minutes read
tags:
  - Python
  - Performance
  - Data Engineering
  - Big O
category: Data Engineering
coverImage: assets/big-o-series-cover.png
---

**The Complexity Series**

1. **Why Your Code Slows Down** _(you are here)_
2. [O(1) and the Free Lunch](#/post/the-complexity-series-part-2-o1-and-the-free-lunch)
3. [O(log n) and the Magic of Halving](#/post/the-complexity-series-part-3-olog-n-magic-of-halving)
4. [O(n) and Touching Everything Once](#/post/the-complexity-series-part-4-on-touching-everything-once)
5. [O(n log n) and Why Sorting Costs More Than You Think](#/post/the-complexity-series-part-5-onlogn-sorting-costs)
6. [O(n²) and the Nested Loop Trap](#/post/the-complexity-series-part-6-on2-nested-loop-trap)
7. [O(2ⁿ) and O(n!) When Compute Stops Being the Answer](#/post/the-complexity-series-part-7-o2n-when-compute-dies)
8. [Your Code Is Slow. Now What? Time Profiling](#/post/the-complexity-series-part-8-time-profiling)
9. [Your Job Got OOM-Killed. Now What? Memory Profiling](#/post/the-complexity-series-part-9-memory-profiling)

---

Your data pipeline processes 1,000 customer records in development. It finishes in two seconds. Unit tests pass, pull request merges, the team ships it.

Six months later, production volume hits 10,000,000 records.

Your pipeline now takes either 20 seconds or 55 hours. Both implementations produce identical output. Both run on the same cloud hardware. The difference has nothing to do with server specs, network bandwidth, or Python version.

The difference is one mathematical property: how your code scales its workload as input grows.

Time and space complexity is the tool that lets you predict that difference before you run the code, before you have 10 million records, and before your pipeline is on fire at 2am.

That is what this series is about. Not algorithms for their own sake. Not academic notation exercises. The specific, practical intuition a data engineer needs to look at a function, understand how it will behave at scale, and make better architecture decisions because of it.

This first post covers the foundation everything else builds on. We will get into individual complexity classes in Part 2. Before that, you need the core mechanics solid: what complexity actually measures, how [Big O notation](https://en.wikipedia.org/wiki/Big_O_notation) works, and what the notation is actually telling you when you read or write it.

---

## The two questions that define algorithmic complexity

Time and space complexity are two separate questions about the same piece of code.

**Time complexity asks:** how does the number of operations grow as the input size grows?

**Space complexity asks:** how does memory usage grow as the input size grows?

Both are about growth, not absolute values. Neither is interested in how many milliseconds something takes on your specific machine today. They are interested in the shape of the curve: what happens to cost when your data doubles, or multiplies by a thousand.

Why growth instead of raw speed? Because raw speed depends on the machine. Operation count depends on the algorithm.

![The Two Dimensions of Complexity: Time vs Space](assets/time-vs-space-dimensions.jpg)

Consider a function that scans through every transaction in a list to find one matching ID:

```python
def find_transaction(transactions: list[dict], target_id: str) -> dict | None:
    for tx in transactions:
        if tx["id"] == target_id:   # the comparison is our basic operation
            return tx
    return None
```

On a laptop this might take 2ms for 10,000 transactions. On a cloud cluster it might take 0.1ms. On a saturated VM under load it might take 50ms. The wall-clock time tells you about the hardware. The operation count tells you about the algorithm.

Count the comparisons:

| Input Size (n) | Comparisons (worst case) |
| :--- | :--- |
| 10 | 10 |
| 10,000 | 10,000 |
| 1,000,000 | 1,000,000 |

That count is the same everywhere. It is what we care about.

---

## What counts as a basic operation?

When we say "operations," we do not mean lines of code. We mean the basic unit of work that repeats with the data. Things like:

- A comparison: `if amount > 10000`
- An array access: `records[i]`
- An arithmetic step: `total += amount`
- A function call

In the fraud check above, the basic operation that scales with our input is the comparison inside the loop. The function also has a `return None` at the end, which executes exactly once regardless of how large `n` is. We do not count it. We only count operations whose repetition is driven by input size.

This matters more than it sounds. In production code you will see many lines in a function. The skill is identifying which operations actually grow with n. Everything else is noise at scale.

---

## Big O notation: a deliberate simplification

Now that we are counting operations, we need a clean way to express that count mathematically. That is what Big O notation does.

Consider a slightly more verbose version of our fraud check:

```python
def has_large_transaction(transactions: list[float]) -> bool:
    print("Starting fraud scan...")     # runs once
    count = 0                           # runs once

    for amount in transactions:
        if amount > 10000:              # operation 1: comparison
            return True
        count += 1                      # operation 2: increment
        print(f"Checked: {amount}")     # operation 3: log

    return False                        # runs once
```

Counting everything honestly:

> Total operations = 3 + 3n

Three fixed operations before and after the loop. Three operations per iteration, n iterations.

At one million transactions: `3 + 3,000,000 = 3,000,003` operations.

Now here is the important question. Does that leading `+3` meaningfully affect how this scales when your data grows from one million to one hundred million? And does the multiplier `3` change the shape of that scaling curve?

Let us look at the numbers:

| Input Size (n) | Clean (n) | Instrumented (3 + 3n) | Ratio |
| :--- | :--- | :--- | :--- |
| 10 | 10 | 33 | 3.300x |
| 1,000 | 1,000 | 3,003 | 3.003x |
| 100,000 | 100,000 | 300,003 | 3.00003x |
| 10,000,000 | 10,000,000 | 30,000,003 | 3.0000003x |

The fixed `+3` vanishes into decimal noise. The ratio converges to exactly `3.0`.

Now compare that 3x multiplier to an algorithm with a fundamentally different growth shape:

| Input Size (n) | Algorithm A (n) | Algorithm B (3n) | Algorithm C (n²) |
| :--- | :--- | :--- | :--- |
| 10 | 10 | 30 | 100 |
| 1,000 | 1,000 | 3,000 | 1,000,000 |
| 1,000,000 | 1,000,000 | 3,000,000 | 1,000,000,000,000 |

At one million records, Algorithm B requires 3x more work than Algorithm A. Algorithm C requires one million times more work.

The multiplier `3` is a pebble. A quadratic curve is an avalanche.

Big O notation drops constants and multipliers so you can focus on the shape of the curve. The simplification rule is:

> **Keep only the fastest-growing term. Drop everything else.**

Applied to our examples:

- `3 + 3n → O(n)`
- `5n² + 300n + 7 → O(n²)`
- `2n log n + n → O(n log n)`

For that last expression, you might wonder why we keep `n log n` over the plain `n`. At large values of n, `n log n` grows considerably faster than `n`, so it dominates. The rule always keeps the fastest-growing term.

> **Does this mean constant multipliers never matter in production?**
>
> No. Constants matter a lot when two algorithms share the same complexity class. If you have two `O(n)` solutions and one does `n` operations while the other does `3n`, the first one finishes 3x faster. At one billion rows that could be the difference between a 10-minute job and a 30-minute job. But you fix the curve first. You tune constants after. Shaving a 3x constant from an `O(n²)` algorithm is useless when your data doubles next month.

---

## Upper bound, lower bound, tight bound: O, Ω, and Θ

Big O tells you the worst case. But there are two other symbols that complete the picture, and you will see all three in real conversations about performance.

Go back to our fraud check:

```python
def has_large_transaction(transactions: list[float]) -> bool:
    for amount in transactions:
        if amount > 10000:
            return True        # exits immediately when found
    return False
```

Consider two very different input lists:

```python
# List A: fraud is the very first transaction
transactions_a = [50000, 200, 450, 300, ...]  # 1 million items

# List B: fraud is the very last transaction (or absent entirely)
transactions_b = [200, 450, 300, ..., 50000]  # 1 million items
```

For List A: the loop hits the condition on the first comparison and exits. One operation.

For List B: the loop scans all one million items before finding fraud. One million operations.

Same algorithm. Same input size. Completely different cost. Big O alone only captures one of those scenarios.

![Algorithmic Bounds and Growth Curves: Upper Bound O(n) Ceiling vs Lower Bound Ω(1) Floor](assets/big-o-bounds-curves.jpg)

| Symbol | Name | Meaning | Our fraud example |
| :--- | :--- | :--- | :--- |
| O(n) | Big O | Upper bound: worst case, never worse than this | Fraud is last or absent |
| Ω(1) | Big Omega | Lower bound: best case, never better than this | Fraud is first |
| Θ(n) | Big Theta | Tight bound: both upper and lower are the same shape | Only when best equals worst |

The complete honest picture for our fraud check:

- **Best case:** `Ω(1)` (fraud is the first item, exit immediately)
- **Worst case:** `O(n)` (fraud is last or absent, scan everything)
- **Average:** `Θ(n)` (fraud somewhere in the middle)

Θ (theta) can only be claimed when best and worst case share the same shape. If you have a function that always touches every item no matter what, like summing a list:

```python
def total(transactions: list[float]) -> float:
    total = 0.0
    for amount in transactions:
        total += amount     # always runs n times, no early exit
    return total
```

Then:

- **Best case:** `Θ(n)` (always visits every item)
- **Worst case:** `Θ(n)` (always visits every item)
- **Therefore:** `Θ(n)` (tight bound, no ambiguity)

The key distinction is whether there is an early exit. A `return` or `break` inside a loop creates a gap between best and worst case. A `continue` does not: it skips work per iteration but still visits every item to check the condition. If all items are skipped via `continue`, the loop still performs n checks.

In day-to-day engineering conversations, "this is O(n)" almost always means worst case. Big O is the most commonly used of the three because real data does not cooperate. Fraud is not always the first item. Production pipelines have to survive the worst shape of input, not just the lucky one.

---

## The complexity class family

Here is the full family of complexity classes you will encounter. Each one represents a different growth shape, from the most desirable to the least survivable at scale:

| Notation | Name | Example expression | Behaviour when n doubles |
| :--- | :--- | :--- | :--- |
| O(1) | Constant | 7 | No change |
| O(log n) | Logarithmic | 3 + 2 log n | Adds one step |
| O(n) | Linear | 3 + 3n | Doubles |
| O(n log n) | Linearithmic | 2n log n + 5n | Slightly more than doubles |
| O(n²) | Quadratic | 4n² + 2n + 1 | Quadruples |
| O(2ⁿ) | Exponential | 2ⁿ + n² | Squares |
| O(n!) | Factorial | n! + 2ⁿ | Explodes catastrophically |

Each of these is a full post in this series. For now the important thing is the last column: what happens to your pipeline's runtime when your data doubles. That behaviour when n doubles is the core intuition that everything else in this series builds on.

![Algorithmic Complexity Big O Growth Curves](assets/complexity-growth-curves.jpg)

---

## The empirical cheat code: the Doubling Test

You do not always have time to read every line of a third-party library or manually trace a complex SQL execution plan to determine its complexity class.

Fortunately, you can often infer the complexity class empirically. Run the same operation at input size n, then at 2n, and observe how the output changes. Every major complexity class has a distinct fingerprint:

| Complexity Class | What happens when you double n |
| :--- | :--- |
| O(1) | Runtime does not change |
| O(log n) | Runtime increases by one small fixed step |
| O(n) | Runtime doubles |
| O(n log n) | Runtime slightly more than doubles (around 2.1x) |
| O(n²) | Runtime quadruples |
| O(2ⁿ) | Runtime squares or becomes catastrophically larger |

If your pipeline processes 100,000 records in 4 seconds and 200,000 records in 16 seconds, you are not looking at an O(n) linear pipeline. The 4x jump is the quadratic fingerprint: an O(n²) nested loop or unindexed cross join is hiding somewhere in your transformation logic.

The numbers reveal the architecture before you open a single profiler trace.

---

## Two dimensions: time and space are always in tension

Complexity has two axes, and they frequently pull against each other.

Consider our fraud check again. We ran it with a list:

```python
seen_ids = []

def process(event):
    if event.id in seen_ids:     # O(n) scan through list
        return
    seen_ids.append(event.id)
    handle(event)
```

The `in` operator on a list scans every item sequentially. After processing 10 million events, each new event check scans up to 10 million previous IDs. The pipeline slows down progressively over time. This is a real pattern that takes down real streaming pipelines.

The fix is a set:

```python
seen_ids = set()

def process(event):
    if event.id in seen_ids:     # O(1) hash lookup
        return
    seen_ids.add(event.id)
    handle(event)
```

A set uses a hash table internally. Instead of scanning sequentially, it hashes the ID to a bucket and jumps directly there. One step, always, regardless of how many IDs we have seen before.

You traded time complexity for space complexity. The set delivers O(1) lookup but it holds every seen ID in memory. After 10 million events, the set occupies meaningful RAM. At 100 million events it may not fit.

This is the tension you will navigate constantly in production. Better time complexity often costs you space. Better space efficiency often costs you time. Neither axis is free.

Space complexity follows the same Big O rules:

> **Auxiliary space** = the extra memory your algorithm allocates, beyond the input

The input is a given. The question is what your algorithm creates on top of it.

```python
def double_all(transactions: list[float]) -> list[float]:
    result = []
    for tx in transactions:
        result.append(tx * 2)    # new list grows with n
    return result
# Auxiliary space: O(n)

def double_inplace(transactions: list[float]) -> list[float]:
    for i in range(len(transactions)):
        transactions[i] *= 2     # modifies input, creates nothing new
    return transactions
# Auxiliary space: O(1)
```

Both functions produce the same output. The second one does it without allocating any additional memory proportional to n. Whether that matters depends on your context. Mutating input is more memory efficient. Creating a new structure is safer if something downstream needs the original unchanged.

Neither is universally right. Understanding both dimensions lets you make that decision deliberately rather than by accident.

---

## The two passes of real-world optimization

This distinction between time and space, and between constants and complexity class, leads to a professional workflow for tackling performance problems:

> **Pass 1: Complexity class optimization**
> Are we running O(n²) or O(n)? Can we add a data structure to reduce a scan to a lookup? This decides whether the pipeline can scale at all.
>
> **Pass 2: Constant factor optimization**
> Can we remove redundant operations inside the hot loop? Can we go from 3n to 1n? This decides how much the pipeline costs to run.

Never invert this sequence. Shaving CPU cycles inside an O(n²) loop while leaving the nested structure intact is classic premature optimization. You are polishing a broken engine.

Fix the growth curve first. Tune the multipliers after.

---

## What's next

You now have the foundation. You know what time and space complexity measure, how Big O notation works mechanically, what Ω and Θ add to the picture, and how to read the doubling signature of an algorithm empirically.

In Part 2, we start with O(1): the complexity class every engineer wishes their code lived in. We will look at how Python hash tables deliver constant-time lookup, why dictionary keys need high cardinality to keep that guarantee, and the string concatenation trap that silently turns innocent-looking code into an O(n²) memory disaster.
