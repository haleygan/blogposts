---
id: the-complexity-series-part-2-o1-and-the-free-lunch
title: "The Complexity Series · Part 2: O(1) and the Free Lunch"
date: July 17, 2026
excerpt: Constant-time lookup sounds like a free lunch, but the bill arrives when you pick the wrong key, write a loop around a hash check, or mistake two independent table sizes for a single n.
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
2. **O(1) and the Free Lunch** _(you are here)_
3. [O(log n) and the Magic of Halving](#/post/the-complexity-series-part-3-olog-n-magic-of-halving)
4. [O(n) and Touching Everything Once](#/post/the-complexity-series-part-4-on-touching-everything-once)
5. [O(n log n) and Why Sorting Costs More Than You Think](#/post/the-complexity-series-part-5-onlogn-sorting-costs)
6. [O(n²) and the Nested Loop Trap](#/post/the-complexity-series-part-6-on2-nested-loop-trap)
7. [O(2ⁿ) and O(n!) When Compute Stops Being the Answer](#/post/the-complexity-series-part-7-o2n-when-compute-dies)
8. [Your Code Is Slow. Now What? Time Profiling](#/post/the-complexity-series-part-8-time-profiling)
9. [Your Job Got OOM-Killed. Now What? Memory Profiling](#/post/the-complexity-series-part-9-memory-profiling)

---

Part 1 established that Big O describes growth, not speed. Now we look at the one complexity class where growth is zero: O(1).

Understanding O(1) properly matters more than you might expect. Not because constant time is rare — it shows up everywhere in production pipelines. But because the failure modes are subtle. Code that looks O(1) at the call site is sometimes O(n) underneath. And code that's genuinely O(1) per operation can become O(n²) the moment you put it inside a loop with a misnamed variable.

Let's work through it from first principles.

---

## The doubling signature

Before anything else: what does O(1) actually look like when n doubles?

| Complexity | n = 1,000 | n = 2,000 | n = 10,000 | Doubles? |
| :--- | :--- | :--- | :--- | :--- |
| O(1) | 1 op | 1 op | 1 op | Never changes |
| O(log n) | 10 ops | 11 ops | 14 ops | Adds ~1 step |
| O(n) | 1,000 ops | 2,000 ops | 10,000 ops | Doubles |
| O(n²) | 1,000,000 ops | 4,000,000 ops | 100,000,000 ops | Quadruples |

O(1) is flat. Zero slope. If your operation is genuinely constant time, it takes the same number of steps whether your table has 1,000 rows or 1,000,000,000. That's the promise. The rest of this post is about how easily that promise breaks.

---

## The mechanism behind constant time

O(1) means the number of operations does not change as n grows. That's only possible when the algorithm can jump directly to what it needs without searching.

Two data structures do this natively: arrays and hash tables.

With an array, the jump is arithmetic. Every element is the same size in memory and slots are contiguous. So if you know the starting address and the index, you can calculate the exact memory address in one step:

```text
address = base_address + (index × element_size)
```

Array size is irrelevant. The formula has no n in it. Whether the array holds 10 items or 10 million, the lookup costs exactly one calculation and one memory read. That's Θ(1): constant in every case, not just average.

Hash tables are different. The jump is probabilistic, not arithmetic. When you do `fraud_flags["tx_001"]`, Python doesn't scan through keys. It runs a hash function:

```text
hash("tx_001") → some number, e.g. 482991
482991 % table_size → bucket 3
go directly to bucket 3 → value is True
```

One calculation, one jump. O(1) average.

![Hash Table Direct Jump Lookup Mechanism](assets/hash-table-lookup-flow.jpg)

The word "average" matters. Here's what's happening in memory:

```text
Bucket 0  → empty
Bucket 1  → empty
Bucket 2  → empty
Bucket 3  → ("tx_001", True)     ← hash("tx_001") % size landed here
Bucket 4  → ("tx_002", False)
Bucket 5  → empty
Bucket 6  → ("tx_003", True)
```

Each key gets its own bucket. Direct jump. But what happens when two different keys hash to the same bucket? That's a collision:

```text
hash("tx_001") % size → bucket 3
hash("tx_999") % size → bucket 3   ← collision
```

Now bucket 3 holds a chain:

```text
Bucket 3  → ("tx_001", True) → ("tx_999", False)
```

Finding `"tx_999"` requires landing on bucket 3, checking the first item (not a match), then moving to the next. Two comparisons instead of one. If all n keys collide into the same bucket, you're doing a full linear scan through the chain: O(n).

So the complete picture:

```text
Best case  → Ω(1)   key lands in empty bucket, found immediately
Average    → O(1)   decent hash function, collisions rare
Worst case → O(n)   all keys collide into the same bucket
```

This is the precise distinction from Part 1's Θ notation. Array access is Θ(1): the worst case and the average are the same shape. Hash table lookup is O(1) average: the worst case is a completely different shape and depends entirely on your data.

![Hash Table Direct Jump vs Collision Degradation: High-cardinality keys yield O(1) jump; low-cardinality keys degrade into O(n) linear scan](assets/hash-table-collisions-o1.jpg)

---

## What actually causes collisions in production

It's almost never a cryptographic attack or a pathological input. Most of the time, it's a bad choice of hash key.

Low cardinality keys are the classic mistake. Cardinality is the number of distinct values in a column. A boolean column has cardinality 2. A country code column might have cardinality 250. A transaction ID column has cardinality equal to the number of transactions.

Imagine keying a lookup table on `is_international`:

```python
# Cardinality = 2 (True or False)
lookup = {
    True:  [5,000,000 transactions],
    False: [5,000,000 transactions]
}
```

Your "O(1) lookup" now scans through 5 million items on every call. That's not a hash table anymore. That's a linear scan wearing a disguise.

The rule is straightforward: always key hash tables on high-cardinality fields. Transaction IDs, user IDs, UUIDs, timestamps. If the field has fewer than a few thousand distinct values relative to your data size, it's not a safe hash key.

This is a production mistake I've seen repeatedly. The lookup performs fine in staging with 1,000 rows. Nobody questions the key choice. It goes to production with 10 million rows and the pipeline slows over weeks, invisibly, until someone finally looks at the complexity.

---

## The set vs list trap

Here's where this shows up most often at the code review level. These two lines look identical at the call site:

```python
suspect_id in ids_list  # O(n) scan
suspect_id in ids_set   # O(1) hash lookup
```

The difference is what `ids` is. Python's `in` operator calls `__contains__` on the right-hand object. For a set, `__contains__` hashes the key and jumps to the right bucket. For a list, it has no hash table and must scan element by element.

The streaming dedup case makes this visceral:

```python
# Dangerous pattern — O(n) membership check
seen_ids = []

def process_event(event):
    if event.id in seen_ids:      # scans the entire list every time
        return
    seen_ids.append(event.id)
    process(event)
```

```python
# Correct pattern — O(1) membership check
seen_ids = set()

def process_event(event):
    if event.id in seen_ids:      # hash lookup, always 1 operation
        return
    seen_ids.add(event.id)
    process(event)
```

After processing 10 million events, the list version is doing 10 million comparisons per new event. The set version is still doing exactly 1. One character change: `[]` to `set()`. The list isn't wrong, it's just the wrong tool for membership testing.

---

## O(1) in the DE stack

The hash-the-key-and-jump pattern repeats everywhere in the data engineering stack. Once you see it, you recognise it anywhere.

**Python dictionary lookup** — the one you use every day:

```python
# O(n) scan through a list every time
users_list = [{"id": 1, "country": "AU"}, ...]

def get_country(user_id):
    for user in users_list:          # scans entire list
        if user["id"] == user_id:
            return user["country"]

# O(1) dictionary lookup
users_dict = {1: "AU", 2: "US", ...}

def get_country(user_id):
    return users_dict[user_id]       # direct jump, always 1 operation
```

Same data. Same result. The list version gets slower with every user added. The dictionary version never changes speed.

**[Redis](https://redis.io/) GET** — O(1) at infrastructure scale:

```python
# 10 million users in Redis, still O(1) per lookup
value = redis_client.get("user:1234:features")
```

Redis is essentially a hash table on a server. The key gets hashed to a memory slot. Direct jump. It doesn't matter if Redis holds 1,000 keys or 100,000,000 — lookup time stays flat. That's why Redis is the backbone of real-time enrichment pipelines.

**[Spark](https://spark.apache.org/) broadcast join** — turning a shuffle into local O(1) lookups:

```python
# Without broadcast: Spark shuffles both tables across the cluster
result = transactions.join(country_codes, "country_id")

# With broadcast: small table sent to every executor once
# each row does a local O(1) lookup — no shuffle
from pyspark.sql.functions import broadcast
result = transactions.join(broadcast(country_codes), "country_id")
```

The broadcast version turns a massive network shuffle into millions of local hash lookups. In production this can be the difference between a job taking 2 hours and 4 minutes.

The underlying pattern is the same in all three: hash the key, jump directly to the value. Python dict, Redis, Spark broadcast are all hash tables in different clothing.

---

## Amortized O(1): what list.append is actually doing

Here's one that surprises a lot of experienced engineers. Python's `.append()` is described as O(1) amortized. The "amortized" qualifier is doing real work.

A Python list is not infinitely stretchy. In memory, it's a fixed block of contiguous slots. When you create an empty list, Python reserves a small number of slots upfront:

```text
result = []

Memory:
[ _ ][ _ ][ _ ][ _ ]    ← 4 empty slots reserved
```

Each append fills the next free slot. Genuinely O(1):

```text
result.append(1)  →  [ 1 ][ _ ][ _ ][ _ ]
result.append(2)  →  [ 1 ][ 2 ][ _ ][ _ ]
result.append(3)  →  [ 1 ][ 2 ][ 3 ][ _ ]
result.append(4)  →  [ 1 ][ 2 ][ 3 ][ 4 ]
```

But on the fifth append, there's no free slot. Python can't grab the next memory address because something else might be there. So it has to:

```text
Step 1 — allocate a new, larger block elsewhere in memory
         [ _ ][ _ ][ _ ][ _ ][ _ ][ _ ][ _ ][ _ ]   ← 8 slots

Step 2 — copy every existing element into the new block
         [ 1 ][ 2 ][ 3 ][ 4 ][ _ ][ _ ][ _ ][ _ ]   ← 4 copies

Step 3 — write the new item
         [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ _ ][ _ ][ _ ]

Step 4 — discard the old block
```

That fifth append didn't cost 1 operation. It cost n operations — one copy per existing element.

Per-append cost across a sequence of 9 appends:

```text
Append 1  →  1 op     (free slot)
Append 2  →  1 op     (free slot)
Append 3  →  1 op     (free slot)
Append 4  →  1 op     (free slot)
Append 5  →  4 ops    (resize: copy 4 items + write 1)
Append 6  →  1 op     (free slot)
Append 7  →  1 op     (free slot)
Append 8  →  1 op     (free slot)
Append 9  →  8 ops    (resize: copy 8 items + write 1)
```

So is `.append()` O(1) or O(n)? Neither in isolation. To answer it properly, you ask a different question: what's the average cost per append across all appends?

Say we append n items total. Resizes happen at sizes 1, 2, 4, 8, ... n/2. Total copy operations across all resizes:

```text
1 + 2 + 4 + 8 + ... + n/2
= n - 1
≈ n
```

Across n appends:

```text
n appends themselves  →  n operations
all resize copies     →  n operations
                         ──────────────
total                 →  2n operations

average per append    →  2n / n = 2  →  O(1)
```

Every append costs 2 operations on average, regardless of n. That's O(1) amortized. The word comes from finance: spreading a large one-time cost across many small payments. The resize is the large payment. All the cheap appends absorb it.

---

## The string concatenation trap

Now compare that to the pattern that looks equivalent but isn't:

```python
# result = result + [i] — catastrophically different from .append(i)
result = []
for item in records:
    result = result + [item]   # creates a brand new list every iteration
```

Every `+` operation allocates a new list and copies everything:

```text
Iteration 1:  copy 0 items + add 1  →  1 op
Iteration 2:  copy 1 item  + add 1  →  2 ops
Iteration 3:  copy 2 items + add 1  →  3 ops
Iteration 4:  copy 3 items + add 1  →  4 ops
...
Iteration n:  copy n-1 items + add 1  →  n ops
```

Total operations:

```text
1 + 2 + 3 + ... + n = n(n+1)/2 ≈ n²/2  →  O(n²)
```

Same output as append. 250,000× more work at n = 1,000,000.

String concatenation inside a loop has the same problem. Python strings are immutable — every `+=` creates a new string and copies the previous content:

```python
# O(n²) total — creates a new string on every iteration
result = ""
for item in records:
    result += str(item)

# O(n) total — accumulate then join once
parts = []
for item in records:
    parts.append(str(item))  # O(1) amortized
result = "".join(parts)       # one O(n) pass at the end
```

The fix is always the same: accumulate into a list with `.append()`, then join once. The total work is O(n) instead of O(n²).

The numbers:

| n | list.append total | string concat total |
|---|---|---|
| 1,000 | 2,000 ops | 500,000 ops |
| 10,000 | 20,000 ops | 50,000,000 ops |
| 1,000,000 | 2,000,000 ops | 500,000,000,000 ops |

---

## When O(1) multiplies into O(n×m)

This is where most engineers who understand O(1) still get tripped up. A function can be O(1) internally but get called inside a loop. That turns O(1) into O(n).

Now extend that: what if the loop itself iterates two different inputs? This is where the notation breaks down for a lot of people.

```python
# Nested loop over two different tables
for row_a in table_a:      # n rows
    for row_b in table_b:  # m rows
        if row_a["id"] == row_b["id"]:
            result.append((row_a, row_b))
```

A lot of engineers call this O(n²). That's wrong, and it matters. The symbol `n²` implies you're squaring the same n. But `table_a` and `table_b` have independent sizes. If you use n for both, you're either overcounting or undercounting.

With real production numbers: `transactions` has 10 million rows, `merchants` has 500 rows.

```text
If you call this O(n²) with n = 10,000,000: you predict 100 trillion operations
If you call this O(n²) with n = 500:        you predict 250,000 operations
Actual:                                      10,000,000 × 500 = 5 billion operations
```

O(n²) is wrong in both directions. The correct notation is O(n×m). This isn't a pedantic detail. It's the number you use to decide whether the job fits in your time window. If your design doc says O(n²) here, every engineer who reads it will calculate the wrong thing.

The rule: O(n²) only when you loop the same dataset twice. O(n×m) when two independent inputs grow at different rates.

---

## The three-variable trap

The same logic extends to three nested loops:

```python
for customer in customers:                    # n rows
    for transaction in customer.transactions:  # t per customer
        for item in transaction.items:          # k per transaction
            if item["flagged"]:
                result.append(item)
```

The complexity is O(n×t×k). With Black Friday numbers:

```text
customers             n = 10,000,000
transactions each     t = 200
items each            k = 10

total                 = 10,000,000 × 200 × 10
                      = 20,000,000,000 operations
```

The hidden danger here is that `customer.all_items` looks like it removes a loop. It doesn't. The CPU still touches every item. The work doesn't disappear because the code looks cleaner:

```python
# Looks like one loop. Still O(n×t×k).
for customer in customers:
    for item in customer.all_items():   # hidden: iterates all transactions and items
        if item["flagged"]:
            result.append(item)
```

If `customer.all_items()` is a generator that yields items by iterating through every transaction of every customer, the complexity is identical to the triple-nested version. The only way to change the complexity is to change the algorithm, not to change the code structure.

The reduction strategy for this case is to pre-compute at the SQL layer before the Python loop runs:

```sql
SELECT customer_id, COUNT(*) as flagged_items
FROM items i
JOIN transactions t ON i.transaction_id = t.id
WHERE i.flagged = true
GROUP BY customer_id
```

This turns O(n×t×k) into O(n) — one row per customer, no nested loops.

---

## The join strategy decision

When Spark or [Postgres](https://www.postgresql.org/) runs a join, it's solving this exact O(n×m) vs O(n+m) equation at runtime. Query planners don't pick a strategy randomly. They estimate input sizes and calculate which strategy costs fewer operations.

The four strategies, derived from first principles:

**Nested loop join: O(n×m)**

```python
for row_a in table_a:      # n iterations
    for row_b in table_b:  # m iterations per row
        if row_a["id"] == row_b["id"]:
            yield (row_a, row_b)
```

For every row in A, scan all of B. Multiplicative. At n = 10,000,000, m = 500: 5 billion operations.

**Hash join: O(n+m)**

```python
# Phase 1: build — O(m) one pass, O(1) insert
lookup = {}
for merchant in merchants:              # O(m)
    lookup[merchant["id"]] = merchant   # O(1) insert

# Phase 2: probe — O(n) one pass, O(1) lookup
for transaction in transactions:                        # O(n)
    merchant = lookup.get(transaction["merchant_id"])   # O(1) hash lookup
    if merchant:
        yield (transaction, merchant)
```

The two phases are sequential, not nested. Build runs once, probe runs once. O(m) + O(n) = O(n+m). With our numbers: 10,000,500 operations instead of 5 billion.

**Sort-merge join: O(n log n + m log m)**

Sort both tables on the join key, then walk two pointers through both sorted sequences simultaneously. Sorting costs O(n log n) and O(m log m). The merge pass is O(n+m), which is absorbed by the sort terms. Total: O(n log n + m log m).

**Index nested loop join: O(n log m)**

Like nested loop, but instead of scanning all of table_b for each row, you binary-search a [B-tree](https://en.wikipedia.org/wiki/B-tree) index:

```python
for row_a in table_a:                               # n iterations
    match = index_on_table_b.lookup(row_a["id"])    # log m per lookup
    if match:
        result.append((row_a, match))
```

An index is a sorted B-tree structure. Looking up a value in a sorted structure is the halving operation from Part 3: each comparison eliminates half the remaining candidates. With m = 500: log₂(500) ≈ 9 steps instead of 500. Total: O(n log m).

The full comparison with real numbers (n = 10,000,000, m = 500):

| Strategy | Complexity | Operations |
|---|---|---|
| Nested loop | O(n×m) | 5,000,000,000 |
| Hash join | O(n+m) | 10,000,500 |
| Sort-merge | O(n log n + m log m) | ~50,001,349 |
| Index nested loop | O(n log m) | ~90,000,000 |

![Join Strategy Complexity and Hardware Trade-Offs: Nested Loop vs Hash Join vs Sort-Merge vs Index Nested Loop](assets/join-strategies-comparison.jpg)

---

## When each strategy wins

**Hash join** wins when: the smaller side fits in memory AND the join key has high cardinality. High cardinality means collisions are rare and the O(1) lookup guarantee holds.

Hash join breaks down in two scenarios. First: low-cardinality join key. If you're joining on `status` or `country_code`, many rows hash to the same bucket. The probe phase degrades from O(1) per lookup to O(chain length). At extreme skew, hash join approaches O(n×m).

Second: neither side fits in memory. You can't build the hash table. Spark handles this by spilling sorted chunks to disk and streaming them through a merge — which is exactly sort-merge join.

**Sort-merge join** wins when hash join can't be used. It doesn't require either table in memory simultaneously (it streams through both sorted sides). And it degrades gracefully with skew: even with low-cardinality keys, the worst case stays O(n log n + m log m) because you're not relying on hash bucket distribution.

**Index nested loop** wins when n is very small. If a `WHERE` filter reduces the outer table to 50 rows before the join, the setup cost of building a hash table (O(m)) isn't worth it. Index nested loop skips the setup and jumps directly into the pre-existing index.

```text
n is very small (50 rows) → Index nested loop wins
                             (hash table setup not worth 50 probes)

n is large (10M rows)      → Hash join wins
                             (log m per lookup accumulates too much vs O(1))
```

This is exactly why Postgres and Spark query planners estimate row counts before choosing a strategy. They're solving this equation at runtime.

---

## Predicate pushdown and why filter order matters

There's one more piece that connects O(1) back to the join cost model: filters.

```sql
SELECT * FROM transactions t
JOIN merchants m ON t.merchant_id = m.id
WHERE t.customer_id = 'C001'
```

The `WHERE` clause reduces n before the join even starts. But its cost depends on whether an index exists:

```text
No index on customer_id:  O(n) full scan of all 10M transactions
                          n = 10,000,000 going into the join

Index on customer_id:     O(log n) B-tree traversal to find C001's rows
                          n = 50 going into the join
```

The total query cost is filter cost + join cost:

```text
No index:    O(n)      + O(n × m)     ← 10M rows going into join
With index:  O(log n)  + O(50 log m)  ← only 50 rows going into join
```

An index on the filter column doesn't just speed up the filter. It shrinks n for every subsequent operation. That cascades through the entire cost model.

This is predicate pushdown: apply filters as early as possible to reduce data volume before expensive operations like joins. Spark does it automatically. Postgres does it automatically. But only if the index or partition exists to make it cheap.

---

## The rule of thumb

O(1) is constant time: the work doesn't change as n grows. Hash tables get you there for lookups, but only when the key has high cardinality. The moment you key on a low-cardinality field, or call an O(1) function inside an O(m) loop that's inside an O(n) loop, you no longer have O(1).

Before accepting any loop structure that operates on two tables, name both variables explicitly. If they're the same input, it's O(n²). If they're independent, it's O(n×m). That distinction determines which join strategy your database will pick, and whether the job finishes before your SLA expires.

Part 3 covers O(log n): the halving pattern that turns a 48-second sequential scan into a sub-millisecond index lookup, and why the base of the logarithm matters for counting actual operations even though it doesn't matter for Big O classification.

---

*The Complexity Series is a 9-part walkthrough of algorithmic complexity for practising data engineers, derived from real learning sessions.*
