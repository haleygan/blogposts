---
id: the-complexity-series-part-3-olog-n-magic-of-halving
title: "The Complexity Series · Part 3: O(log n) and the Magic of Halving"
date: July 22, 2026
excerpt: The difference between a 48-second query and a sub-millisecond one is not hardware or tuning — it is a single missing index and the mathematics of halving.
readTime: 17 minutes read
tags:
  - Python
  - Performance
  - Data Engineering
  - Big O
category: Data Engineering
---

Part 2 showed that O(1) is constant time: hash tables give you a direct jump to any value regardless of data size. O(log n) is the next best thing, and it powers a different class of problem: searching sorted data.

Understanding O(log n) properly closes a gap that shows up constantly in senior engineering interviews and in real database debugging. The gap is this: a query that says `WHERE id = 42` looks like O(1) at the SQL level. It's actually O(log n) underneath. You cannot see the mechanism from the surface syntax. The execution plan tells you what's happening. The mathematics tells you why it's still very fast.

---

## The doubling signature

O(log n) is the second-best complexity class. The key property: when n doubles, you add roughly one step, not another n steps.

| Complexity | n = 1,000 | n = 2,000 | n = 1,000,000 | When n doubles |
| :--- | :--- | :--- | :--- | :--- |
| O(1) | 1 op | 1 op | 1 op | No change |
| O(log n) | ~10 ops | ~11 ops | ~20 ops | Adds ~1 step |
| O(n) | 1,000 ops | 2,000 ops | 1,000,000 ops | Doubles |
| O(n²) | 1,000,000 ops | 4,000,000 ops | 10¹² ops | Quadruples |

That one-step increase when n doubles is the O(log n) fingerprint. Run your operation at n = 1,000, then at n = 1,000,000 — a 1,000× increase in data. If the time barely moves (from ~10 steps to ~20), you're looking at O(log n).

---

## The phone book intuition

Before the formula, the intuition. Imagine you're looking for "Nguyen, Haley" in a physical phone book with 1 million entries.

You don't start at page 1. You open the book to the middle, see you're in the M's, eliminate the entire first half, open to the middle of the second half, and repeat. After about 20 openings, you've found the entry or confirmed it doesn't exist.

The crucial point: you didn't look at 1 million entries. You looked at 20. And if the phone book doubled to 2 million entries, you'd need 21 openings instead of 20. One extra step for a 2× increase in data size. That's the O(log n) signature.

In code, this is binary search:

```python
def binary_search(arr, target):
    low, high = 0, len(arr) - 1

    while low <= high:
        mid = (low + high) // 2   # find the middle

        if arr[mid] == target:
            return mid            # found it
        elif arr[mid] < target:
            low = mid + 1         # eliminate left half
        else:
            high = mid - 1        # eliminate right half

    return -1                     # not found
```

Trace through a 16-element sorted array looking for 14:

```text
arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

Step 1: low=0, high=15  →  mid=7  →  arr[7]=8   →  8 < 14  →  low = 8
Step 2: low=8, high=15  →  mid=11 →  arr[11]=12  →  12 < 14 →  low = 12
Step 3: low=12, high=15 →  mid=13 →  arr[13]=14  →  FOUND ✓

3 steps for 16 elements. log₂(16) = 4, so worst case is 4. We found it in 3.
```

![Binary Search Halving Elimination Steps Across Sorted Array](assets/binary-search-halving.jpg)

---

## Deriving the formula

Why exactly log₂(n)? Because each step cuts the problem in half. Start with n elements:

```text
After step 1:  n/2 elements remain
After step 2:  n/4 elements remain
After step 3:  n/8 elements remain
After step k:  n/2ᵏ elements remain
```

The algorithm stops when the search space hits 1:

```text
n/2ᵏ = 1
n = 2ᵏ
k = log₂(n)
```

That's the maximum number of steps: log₂(n). For n = 1 billion:

```text
log₂(1,000,000,000) ≈ 30 steps
```

30 comparisons to find one record in a billion. Contrast that with linear search: a sequential scan through 1 billion rows. The gap between O(log n) and O(n) keeps widening as n grows.

---

## Why the base doesn't matter for Big O (but does for counting)

Binary search has a branching factor of 2: every step eliminates exactly half the remaining data. But not all O(log n) algorithms halve the data. A database B-tree index has a branching factor of 100 to 400: every level eliminates all but 1/300th of the remaining candidates.

The first thing to note: for Big O notation, the base doesn't matter. All logarithms differ by a constant factor:

```text
log₂(n)   = log₁₀(n) / log₁₀(2)
           = log₁₀(n) × 3.32
```

3.32 is a constant. Big O drops constants. So log₂(n) and log₁₀(n) and log₃₀₀(n) are all the same complexity class. They're all written O(log n) without specifying the base.

But when you're counting actual operations for capacity planning, the base matters enormously:

| Context | What to use | Why |
|---|---|---|
| Big O classification | Any base, write O(log n) | Base is a constant, drops out |
| Actual operation count | Match base to branching factor | You need the real step count |

For a Postgres B-tree with branching factor 300, looking up one row in a 200 million row table:

```text
log₃₀₀(200,000,000) = log(200,000,000) / log(300)
                    = 8.3 / 2.477
                    ≈ 4 levels
```

4 levels. 4 page reads. Compare that to binary search on the same data:

```text
log₂(200,000,000) ≈ 27 steps
```

Both are O(log n). But the B-tree needs 4 actual operations where binary search needs 27. Higher branching factor means fewer levels means fewer disk reads per lookup. The Big O class is the same; the real cost is very different.

![Log Base: Big O Notation Complexity vs Physical Hardware Reads](assets/log-base-complexity-vs-counting.jpg)

---

## How to find the branching factor

You cannot read branching factor from surface code syntax. `WHERE id = x` in SQL looks like O(1). The actual mechanism is O(log n) B-tree traversal. The query looks identical regardless of whether the planner uses an index scan or a sequential scan. You need to look elsewhere.

There's a hierarchy for finding the branching factor:

**1. Read the code** — if you wrote the data structure, the mechanism is visible. The line `mid = (low + high) // 2` tells you the branching factor is 2.

**2. Read the documentation** — Postgres B-tree branching factor is documented and depends on page size and row size; typically 100–400 for integer keys.

**3. Look at the data structure** — binary tree: factor 2. Trie: factor equal to alphabet size (26 for lowercase, 128 for ASCII). B-tree: factor equal to keys per page.

**4. Empirical doubling test** — run your operation at n, then at 2n. If the step count increases by 1, the branching factor is 2 (pure halving). If it barely changes, the branching factor is high.

Rule of thumb table:

| If you see... | Mechanism | Branching factor |
|---|---|---|
| `(low + high) // 2` in code | Binary split | 2 |
| Database index lookup | B-tree traversal | 100–400 |
| Python `bisect` module | Binary search internally | 2 |
| Skip list | Probabilistic levels | ~2 on average |
| Trie lookup | Character-by-character descent | Alphabet size |

The key production insight: you cannot assume complexity from surface syntax. `WHERE id = x` looks like O(1). Whether it's O(1) or O(log n) or O(n) depends on whether an index exists and what the planner decides to use. The execution plan tells you the truth.

---

## Reading EXPLAIN ANALYZE

Here's the query:

```sql
SELECT * FROM orders WHERE order_id = 742891;
```

Without an index, Postgres does a sequential scan:

```text
Seq Scan on orders
  Filter: (order_id = 742891)
  Rows Removed by Filter: 199999983
Planning Time: 0.1 ms
Execution Time: 48000 ms
```

`Seq Scan` means: scan every row, apply the filter. 200 million rows touched. 48 seconds. O(n).

Now add the index and run EXPLAIN again:

```sql
CREATE INDEX idx_orders_order_id ON orders(order_id);

EXPLAIN ANALYZE SELECT * FROM orders WHERE order_id = 742891;
```

```text
Index Scan using idx_orders_order_id on orders
  (cost=0.43..8.45 rows=1 width=120)
  (actual time=0.031..0.033 rows=1 loops=1)
  Index Cond: (order_id = 742891)
Planning Time: 0.1 ms
Execution Time: 0.05 ms
```

Decode each field:

- `Index Scan`: mechanism is B-tree traversal, not sequential scan. O(log n).
- `cost=0.43..8.45`: Postgres internal cost units (not milliseconds). First number is startup cost, second is total cost estimate.
- `rows=1`: planner estimates 1 row returned.
- `actual time=0.031..0.033`: real wall-clock time in milliseconds. Two numbers: time to first row, time to last row.
- `loops=1`: this node executed once.
- `Index Cond: (order_id = 742891)`: the condition used to navigate the B-tree. This is the halving predicate.

48 seconds vs 0.05 milliseconds. Same query, same data, same hardware. One line changed the mechanism from O(n) to O(log n).

With branching factor ~300 and 200 million rows:

```text
log₃₀₀(200,000,000) ≈ 4 levels
```

The planner traverses 4 B-tree levels to reach the leaf node. 4 page reads instead of 200 million row comparisons.

![Halving Mechanics: Binary Search Branching Factor 2 vs Database B-Tree Branching Factor 300](assets/btree-branching-factor-ologn.jpg)

---

## When Postgres chooses Seq Scan even with an index

This is the part that trips people up. You add an index and still see `Seq Scan` in the plan. There are three main reasons:

**The filter matches a large fraction of the table.** If your query returns 80% of rows, random I/O from index lookups is slower than a sequential pass. Postgres estimates this and picks the scan.

**The table is very small.** For a few hundred rows, the B-tree overhead isn't worth it. Seq Scan is faster on tiny tables.

**Statistics are stale.** Postgres estimates row counts from table statistics. If `ANALYZE` hasn't run recently, the planner might estimate incorrectly and pick the wrong strategy.

You can force the planner to reveal both strategies:

```sql
-- Force sequential scan to compare
SET enable_indexscan = off;
EXPLAIN ANALYZE SELECT * FROM orders WHERE order_id = 742891;

-- Reset and see index plan
RESET enable_indexscan;
EXPLAIN ANALYZE SELECT * FROM orders WHERE order_id = 742891;
```

This shows you both plans side by side and their relative costs. It also tells you whether the index exists but isn't being used, versus isn't being used because it genuinely isn't optimal.

The rule: never assume your index is being used. Always verify with EXPLAIN.

---

## O(log n) in the DE stack

The halving pattern shows up anywhere data needs to be searched or structured for efficient retrieval.

**Partition pruning in Spark** — O(log n) file elimination:

```python
# Without partitioning: scans all 500 Parquet files
df = spark.read.parquet("s3://bucket/transactions/")
result = df.filter(df.date == "2026-01-15")

# With date partitioning: jumps directly to one day's files
df = spark.read.parquet("s3://bucket/transactions/")
# Spark reads only transactions/date=2026-01-15/*.parquet
result = df.filter(df.date == "2026-01-15")
```

The partition directory structure is sorted by date. Spark eliminates all partitions that don't match the filter — the same halving logic as binary search, applied to file selection instead of rows.

**Python's bisect module** — standard library binary search:

```python
import bisect

# Find insertion point in sorted list — O(log n)
sorted_amounts = [100, 250, 500, 1000, 2500, 5000]
pos = bisect.bisect_left(sorted_amounts, 750)
print(pos)  # 3 — 750 would go at index 3

# Check if value exists — O(log n)
def exists_in_sorted(arr, target):
    pos = bisect.bisect_left(arr, target)
    return pos < len(arr) and arr[pos] == target
```

`bisect` is useful when you have a sorted list you're querying repeatedly. It's not as flexible as a dict lookup (O(1)) but it works on any sorted sequence without building a hash table.

---

## Space complexity: iterative vs recursive binary search

Both implementations of binary search have O(log n) time complexity. But they have different space complexity, and this distinction shows up in production.

The iterative version:

```python
def binary_search_iterative(arr, target):
    low, high = 0, len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    return -1
```

Variables used: `low`, `high`, `mid`. That's 3 variables regardless of n. The input array `arr` was passed in — the function didn't allocate it. Space complexity (auxiliary space, the memory the function itself allocates): O(1).

The recursive version:

```python
def binary_search_recursive(arr, target, low, high):
    if low > high:
        return -1

    mid = (low + high) // 2

    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search_recursive(arr, target, mid + 1, high)
    else:
        return binary_search_recursive(arr, target, low, mid - 1)
```

Every recursive call creates a new stack frame holding its local variables. These frames stack up in memory, each waiting for the call below it to return:

```text
Call 1: binary_search_recursive(arr, 14, 0, 15)
  └── Call 2: binary_search_recursive(arr, 14, 8, 15)
        └── Call 3: binary_search_recursive(arr, 14, 12, 15)
              └── Call 4: binary_search_recursive(arr, 14, 12, 13)
                    └── found, start returning
```

At peak, all log₂(n) frames exist in memory simultaneously. Space complexity: O(log n).

Comparison:

| Version | Time | Space |
|---|---|---|
| Iterative (while loop) | O(log n) | O(1) |
| Recursive | O(log n) | O(log n) |

Same time complexity. Different space complexity. The only difference is how you wrote it.

---

## Recursion, stack depth, and when it breaks

O(log n) space from recursion sounds harmless. For binary search on 1 billion records:

```text
log₂(1,000,000,000) ≈ 30 stack frames
```

30 frames is genuinely fine. But the habit of reaching for recursion without asking about stack depth will eventually hurt you, because not every recursive algorithm has O(log n) depth.

Python's default recursion limit is 1000 calls:

```python
import sys
print(sys.getrecursionlimit())  # default: 1000
```

A naive recursive algorithm with O(n) depth on 10,000 rows hits this limit and crashes with `RecursionError: maximum recursion depth exceeded`.

| Algorithm | Recursion depth | Space | Safe at n = 1,000,000? |
|---|---|---|---|
| Binary search | log₂(n) ≈ 20 | O(log n) | Yes, nowhere near 1000 |
| Merge sort | log₂(n) ≈ 20 | O(log n) | Yes |
| Naive recursive scan | n | O(n) | No, crashes at n = 1000 |
| Naive recursive Fibonacci | 2ⁿ | O(2ⁿ) | Crashes almost immediately |

The judgment a senior engineer applies: if the recursion depth is O(log n), it's generally acceptable. If it's O(n) or worse, rewrite it as a loop.

The principle is not "avoid recursion." It's: always ask what the maximum depth is as a function of n, then decide whether that depth is safe given your production data size.

Python also has no tail-call optimisation (unlike Scala and Haskell). Even when the recursive call is the last operation in the function, Python still creates a new stack frame instead of reusing the current one. This is a Python-specific reason to prefer iterative over recursive — on top of the space complexity argument.

---

## The empirical benchmark

Everything above is mathematics. But you should verify it empirically, because real timing data is more convincing than any formula.

```python
import time
import random

def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

def linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1

sizes = [1_000, 10_000, 100_000, 1_000_000, 5_000_000]
REPS = 1000

for n in sizes:
    arr = sorted(random.sample(range(n * 10), n))
    target = arr[-1]  # worst case: last element

    t0 = time.perf_counter()
    for _ in range(REPS):
        binary_search(arr, target)
    binary_us = (time.perf_counter() - t0) / REPS * 1_000_000

    t0 = time.perf_counter()
    for _ in range(REPS):
        linear_search(arr, target)
    linear_us = (time.perf_counter() - t0) / REPS * 1_000_000

    print(f"n={n:>10,}  binary={binary_us:>7.2f}µs  linear={linear_us:>10.2f}µs  "
          f"speedup={linear_us/binary_us:>8.0f}x")
```

Real output from this benchmark:

```text
n =       1,000  binary =  0.91µs  linear =     49µs  speedup =      53x
n =      10,000  binary =  1.30µs  linear =    338µs  speedup =     260x
n =     100,000  binary =  1.35µs  linear =  3,436µs  speedup =   2,551x
n =   1,000,000  binary =  1.70µs  linear = 33,570µs  speedup =  19,739x
n =   5,000,000  binary =  1.99µs  linear =170,530µs  speedup =  85,740x
```

n grew 5,000×. Linear search time grew 5,000×. Binary search time grew from 0.91µs to 1.99µs — roughly 2×.

Now verify the binary search numbers against the math:

```text
log₂(1,000)     ≈ 10 steps  →  0.91µs
log₂(5,000,000) ≈ 22 steps  →  1.99µs

ratio of steps:  22 / 10 = 2.2x
ratio of time:   1.99 / 0.91 = 2.2x
```

The timing ratio matches the log ratio exactly. The benchmark is confirming the mathematics directly.

Translate to a real database table with 5 million rows:

```text
Sequential scan (no index):  170,530µs = ~170ms per lookup
B-tree index scan:             ~2µs per lookup

User waits 170ms vs 0.002ms.
```

And remember: a B-tree has branching factor ~300, not 2. It needs even fewer steps than binary search. The real gap in a database is wider than what this benchmark shows.

---

## The fix for a real slow query

You are a data engineer at a logistics company. The table has 200 million rows:

```sql
CREATE TABLE shipments (
    shipment_id     BIGINT PRIMARY KEY,
    customer_id     BIGINT,
    status          TEXT,
    created_at      TIMESTAMP
);
```

A colleague shows you this EXPLAIN output:

```text
Seq Scan on shipments
  Filter: (customer_id = 98765)
  Rows Removed by Filter: 199999983
Planning Time: 0.1 ms
Execution Time: 48000 ms
```

The diagnosis:
- `Seq Scan`: no index on `customer_id`, so Postgres scanned every row
- 200M - 17 = 199,999,983 rows removed by the filter
- 17 rows matched. But 200M rows were read to find them.
- Complexity: O(n), with n = 200,000,000

The fix:

```sql
CREATE INDEX idx_shipments_customer_id ON shipments(customer_id);
```

After indexing, the plan changes to:

```text
Index Scan using idx_shipments_customer_id on shipments
  Index Cond: (customer_id = 98765)
Execution Time: 0.05 ms
```

With branching factor 100 and 200M rows:

```text
log₁₀₀(200,000,000) ≈ 4 levels
```

Maximum 4 steps to find any customer's rows. The complexity changed from O(n) to O(log n). One SQL statement. Permanent improvement for every future query on that column.

5 steps vs 200 million row comparisons. That's the entire argument for database indexes, stated from first principles.

---

## The universal takeaway

O(log n) appears wherever you can eliminate a fraction of the search space at each step. The data must be sorted or structured so that at each step you know which half to eliminate. Binary search, B-tree indexes, partition pruning — they're all the same mathematical idea.

The branching factor determines how fast the halving actually is. A B-tree with branching factor 300 eliminates 299/300 of the remaining data at each level. Binary search eliminates exactly half. Both are O(log n). The B-tree needs far fewer actual steps.

You cannot see whether a query is O(n) or O(log n) from the SQL. The EXPLAIN plan is the only way to verify the mechanism. Check it. If you see `Seq Scan` where you expected `Index Scan`, either the index doesn't exist or the planner decided it wasn't worth using. Either way, you now know exactly what to fix.

Part 4 covers O(n): why some problems unavoidably require touching every record, the two kinds of O(n) space behaviour, and the Bloom filter pattern that trades exactness for bounded memory.

---

*The Complexity Series is a 10-part walkthrough of algorithmic complexity for practising data engineers, derived from real learning sessions.*
