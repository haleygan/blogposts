---
id: the-complexity-series-part-4-on-touching-everything-once
title: "The Complexity Series · Part 4: O(n) and Touching Everything Once"
date: July 26, 2026
excerpt: Linear time is often the unavoidable floor, but the real mistake is paying it more than once without realising it — or holding all n items in memory when the task only needed you to pass through.
readTime: 16 minutes read
tags:
  - Python
  - Performance
  - Data Engineering
  - Big O
category: Data Engineering
---

Part 3 showed that O(log n) algorithms exploit structure: they need data sorted or indexed so they can eliminate half the search space at each step. O(n) is what happens when no such structure exists, or when the task itself requires every record regardless.

Understanding O(n) properly requires separating two things that the notation bundles together: the time dimension (you touch every record) and the space dimension (do you need to remember what you've seen?). Those two dimensions behave independently, and confusing them is responsible for a large fraction of production OOM kills in streaming pipelines.

---

## The doubling signature

Before examining the mechanics, look at how O(n) behaves under the doubling test:

| Complexity | n = 1,000 | n = 2,000 | n = 10,000 | When n doubles |
| :--- | :--- | :--- | :--- | :--- |
| O(1) | 1 op | 1 op | 1 op | No change |
| O(log n) | ~10 ops | ~11 ops | ~14 ops | Adds ~1 step |
| O(n) | 1,000 ops | 2,000 ops | 10,000 ops | Doubles |
| O(n log n) | ~10,000 ops | ~22,000 ops | ~140,000 ops | Slightly more than doubles |
| O(n²) | 1,000,000 ops | 4,000,000 ops | 100,000,000 ops | Quadruples |

Linear growth is proportional. If your data volume doubles, your runtime doubles. If data multiplies by 10, runtime multiplies by 10. That predictable proportionality makes O(n) the standard benchmark against which all pipeline scaling is judged.

---

## When O(n) is unavoidable

Start with the simplest case. You have a Kafka topic with 10 million transaction events. Your job is to calculate total revenue across all of them.

Can you skip any message? No. The answer depends on every record. That's the defining property of O(n): the task requires every element, and there's no structure to exploit that would let you eliminate any subset.

This forces us to separate the mechanism (a for loop) from the reason (the problem demands it). O(n) is not a code pattern. It's a constraint imposed by the task:

```text
Calculate total revenue    → must see every transaction
Detect any fraud           → must check every message until found
Enrich each event          → must touch every record
Count distinct user IDs    → must examine every event
```

The second one has an early exit: once you find fraud, you stop. Best case O(1), worst case O(n) if the fraud is at the end or doesn't exist. We write it as O(n) because Big O describes the upper bound.

---

## Deriving it from code

The simplest O(n) function is a sum:

```python
def total_revenue(transactions):
    total = 0
    for record in transactions:    # runs n times
        total += record["amount"]  # O(1) work per record
    return total
```

Three-step derivation:

1. **Basic operation**: `total += record["amount"]` — one addition, one dict lookup. Fixed cost regardless of the value.
2. **How many times**: the loop runs exactly once per record. n records = n iterations.
3. **Simplify**: T(n) = c × n. Drop constant → O(n).

Now notice what happens to memory. The variable `total` is a single integer sitting in memory. It gets overwritten each iteration. It never grows. Whether n is 1,000 or 1,000,000,000 — one integer in memory.

Space complexity (auxiliary space, the memory the function allocates beyond its input): O(1).

---

## The two kinds of O(n): time vs space

This is the distinction that matters in production. Both of these functions are O(n) time:

```python
# O(n) time, O(1) auxiliary space
def total_revenue(transactions):
    total = 0
    for record in transactions:
        total += record["amount"]
    return total

# O(n) time, O(n) auxiliary space
def dedup(events):
    seen_ids = set()
    for event in events:
        if event["id"] in seen_ids:    # O(1) lookup
            continue
        seen_ids.add(event["id"])      # O(1) insert
        yield event
```

One difference: does the algorithm need to remember what it has seen?

- `total_revenue`: no. It streams through and accumulates into one variable. O(1) space.
- `dedup`: yes. It must compare each incoming event against all previous IDs. `seen_ids` grows with n. O(n) space.

```text
Needs to remember past records → O(n) space  (dedup, joins, distinct counts)
Just streaming through         → O(1) space  (sum, count, max, min)
```

This is not a theoretical distinction. At scale, it determines whether your job runs or crashes.

---

## The OOM kill scenario

You have a Kafka stream of 500 million click events per day. Your job: deduplicate them.

```python
seen_ids = set()

def process_event(event):
    if event["id"] in seen_ids:
        return
    seen_ids.add(event["id"])
    process(event)
```

This looks fine. Each operation is O(1). But `seen_ids` grows with every unique event it processes.

The failure is gradual:

```text
Hour 1:   seen_ids has  10M items  → memory fine
Hour 4:   seen_ids has 100M items  → memory pressure
Hour 8:   seen_ids has 300M items  → swap thrashing
Hour 12:  seen_ids has 500M items  → OOM kill, job crashes
```

The job looks healthy for hours. It only dies in production. Your dev dataset of 10,000 records never triggers it. The bug is invisible at test scale.

Once you've identified the problem, you face a real engineering decision: how do you keep exact dedup without holding 500 million IDs in memory?

---

## Option 1: Bloom filters — trading exactness for bounded memory

A Bloom filter is a fixed-size bit array. Unlike `seen_ids`, it doesn't grow with n. It uses O(1) space regardless of how many items you insert. The tradeoff is that it can occasionally be wrong.

Here's how it works. All bits start at 0:

```text
Position:  0  1  2  3  4  5  6  7  8  9
           0  0  0  0  0  0  0  0  0  0  ← all OFF at start
```

To insert an ID, run it through multiple hash functions. Each hash function points to a bit position. Flip those positions to ON:

```text
insert "tx_123"
  hash1("tx_123") → position 2
  hash2("tx_123") → position 5
  hash3("tx_123") → position 8

Position:  0  1  2  3  4  5  6  7  8  9
           0  0  1  0  0  1  0  0  1  0  ← positions 2, 5, 8 flipped ON
```

To check if an ID has been seen before, run the same hash functions and check those positions:

```text
check "tx_999"
  hash1("tx_999") → position 1  → OFF
  → "definitely NOT seen before" — stop here
```

If any hash-pointed position is OFF, the item is definitely new. Zero false negatives. Guaranteed.

```text
check "tx_000"
  hash1("tx_000") → position 2  → ON
  hash2("tx_000") → position 5  → ON
  hash3("tx_000") → position 8  → ON
  → "probably seen before"
```

But wait: those bits were set by `tx_123`, not `tx_000`. The Bloom filter can't distinguish. This is a false positive: it reports seen, but the event is actually new.

The asymmetry is the entire point:

```text
"definitely NOT seen before"  → always correct, zero false negatives
"probably seen before"        → sometimes wrong, false positives possible
```

If it says "new" — it is guaranteed new. If it says "seen" — it might be wrong.

The false positive rate depends on the bit array size and the number of hash functions. You can tune it by making the array larger. But it never reaches zero. Some probability of false positives always remains.

![Handling Unavoidable O(n): Exact In-Memory Set vs Bloom Filter Architecture](assets/bloom-filter-vs-exact-set-on.jpg)

---

## The domain decision

Now the engineering question: which should you use, exact set or Bloom filter? The answer depends entirely on what a wrong answer costs in your domain.

```text
Question: what does a wrong answer cost?

Payments pipeline:
  false positive → drop a legitimate transaction
  cost           → customer charged, payment never recorded
                   regulatory risk, reputation damage
  decision       → exact set, O(n) space, always correct

Click dedup / ad impressions:
  false positive → drop a legitimate event
  cost           → slightly undercount clicks, nobody harmed
  decision       → Bloom filter, O(1) space, acceptable tradeoff
```

For payments: precision is non-negotiable. The business and regulatory consequences of a dropped transaction are severe. Use the exact set.

For ad impressions: a small undercounting error is acceptable. The memory savings across hundreds of millions of events per day are enormous. Use the Bloom filter.

This is the kind of judgment a senior engineer makes. The algorithm choice is not about which is technically superior. It's about what a wrong answer costs in your specific domain.

---

## Option 2: Redis with TTL — exact dedup without OOM

For the payments case, you chose exact dedup. But the OOM problem remains: you can't hold 500 million IDs in your application's memory.

The solution: move the state out of your process and into Redis.

```python
import redis

r = redis.Redis(host='localhost', port=6379)

def dedup(events):
    for event in events:
        key = f"seen:{event['id']}"

        if r.exists(key):          # O(1) lookup in Redis
            continue               # duplicate, drop it

        r.set(key, 1, ex=86400)    # O(1) insert, expires after 24 hours
        yield event                # new event, process it
```

What this achieves:

```text
Before (in-memory set):
  Your app memory → grows to O(n) → OOM after 12 hours

After (Redis):
  Your app memory → O(1), just one Redis connection
  Redis memory    → O(n), but Redis is designed to handle this
                    at billions of keys across a distributed cluster
```

The `ex=86400` parameter is the TTL: time to live, in seconds. 86400 seconds = 24 hours.

Why does the TTL matter? Payment gateways have retry logic. If a transaction isn't acknowledged, they resend it. But they don't resend transactions from 30 days ago. The retry window is typically 24 hours.

Holding transaction IDs in Redis forever is wasteful:

```text
Day 1:    tx_123 processed → stored in Redis
Day 30:   tx_123 will never be retried → still sitting in Redis
Day 365:  billions of dead keys → Redis memory exhausted
```

The TTL solves this:

```text
Day 1:   tx_123 processed → stored in Redis, expires in 24 hours
Day 2:   tx_123 key gone → Redis memory freed automatically
```

Match the TTL to the business retry window. Any duplicate arriving within 24 hours is caught. After 24 hours, the key expires. No legitimate retry arrives that late.

The complete solution:

```text
Exact dedup     ✓  no false positives, payments never dropped
O(1) app memory ✓  Redis holds state, your process stays flat
TTL             ✓  Redis memory stays bounded over time
```

You get the correctness of an exact set with the memory profile of an external scalable store.

![Streaming Pipeline Deduplication Architecture: Kafka Stream to Processing Container with In-Memory vs Redis TTL Store](assets/streaming-pipeline-dedup.jpg)

---

## Multiple O(1) operations inside a loop: still O(n)

A common source of confusion in code reviews:

```python
def process(records):
    total = 0
    for record in records:                  # n iterations
        if record["amount"] > 0:            # O(1)
            total += record["amount"]       # O(1)
            if record["type"] == "refund":  # O(1)
                total -= record["amount"] * 2  # O(1)
    return total
```

There are multiple operations per iteration. The derivation:

```text
T(n) = n × (O(1) + O(1) + O(1) + O(1))
     = n × 4c
     = 4cn
     → O(n)
```

No matter how many O(1) operations stack inside one iteration — 4, 10, 100 — they collapse into a single constant. The loop count is the only thing that determines the complexity class.

This also means: if you have a long chain of if/else branches inside a loop, and each branch does O(1) work, the entire function is still O(n). The branches change the constant factor, not the complexity class.

---

## O(n) hiding in code that doesn't look like a loop

The most dangerous O(n) patterns are the ones that don't have an explicit `for` loop where you'd expect one. This is where production code reviews get tricky.

```python
def has_fraud(transactions, suspect_id):
    ids = [t["id"] for t in transactions]  # line 1
    return suspect_id in ids               # line 2
```

Two lines. No nested loop. What's the actual complexity?

Line 1: a list comprehension. That's a loop. O(n) to build the list.

Line 2: `suspect_id in ids`. Python's `in` operator calls `__contains__` on the object. For a **list**: no hash table underneath, so it must scan element by element. O(n).

Total: O(n) + O(n) = O(n). Still linear, but for a more expensive reason than it looks.

The fix: one character change.

```python
# O(n) lookup (list scan)
ids = [t["id"] for t in transactions]
suspect_id in ids

# O(1) lookup (hash table)
ids = {t["id"] for t in transactions}
suspect_id in ids
```

`{...}` creates a set. Set uses a hash table internally. `set.__contains__` hashes the key and jumps directly to the right bucket. O(1).

Both versions build the structure in O(n). But the lookup cost is completely different. And that difference becomes catastrophic at the call site:

```python
# The function in isolation looks O(n) either way
def has_fraud(transactions, suspect_id):
    ids = [t["id"] for t in transactions]  # O(n) build
    return suspect_id in ids               # O(n) scan

# But the call site turns it quadratic
for transaction in new_transactions:                      # O(m)
    if has_fraud(all_transactions, transaction["id"]):    # O(n) inside
        flag(transaction)

# list version:  O(m) × O(n) = O(m×n)     ← multiplicative, catastrophic
# set version:   O(n) build once + O(m) × O(1) = O(n+m)  ← additive, linear
```

The individual function looks fine. The complexity problem only appears when you see how it's called. This is the pattern that senior engineers catch in code reviews that juniors miss: an O(n) function inside an O(m) loop becomes O(n×m).

---

## Kafka and the unavoidable O(n)

Kafka partitions are ordered by offset — arrival time — not by any business key like transaction amount or user ID. This is fundamentally different from a B-tree index.

A B-tree index on `amount` is sorted by amount. You can binary search it. O(log n) to find all transactions over $1,000.

A Kafka partition is sorted by offset. That ordering tells you when each message arrived. It gives you nothing about the content of the messages. To find all transactions over $1,000, you must examine every message:

```text
B-tree index on amount   → sorted by amount
                         → eliminate half the data each step
                         → O(log n) to find amount > $1000

Kafka partition          → sorted by arrival time
                         → no structure on content
                         → must scan everything
                         → O(n) unavoidable
```

```python
from kafka import KafkaConsumer

consumer = KafkaConsumer("transactions")

for message in consumer:          # every message, no skipping
    process(message.value)        # O(1) work per message
```

For tasks like calculating total revenue, detecting any fraud, or enriching each event: O(n) is not a choice. It's the minimum possible cost. The task requires every record. The engineering challenge is paying that cost once, efficiently, without materialising unnecessary data structures in memory.

---

## Generators: paying O(n) without the O(n) space bill

When O(n) time is unavoidable, you can often avoid the O(n) space by using generators.

```python
# List comprehension: builds entire result in memory first
def flagged_transactions_list(records):
    return [r for r in records if r["amount"] > 10000]

# Generator: yields one at a time, O(1) auxiliary space
def flagged_transactions_gen(records):
    for r in records:
        if r["amount"] > 10000:
            yield r
```

Both versions are O(n) time: they must examine every record to find the flagged ones. But the list comprehension materialises all flagged results in memory simultaneously. If you have 10 million transactions and 10% are flagged, the list version allocates 1 million objects.

The generator yields one result at a time. At any moment, only the current record is in memory. If the downstream consumer processes and discards each result, the generator's auxiliary space is O(1).

The critical caveat: generators work when your downstream processing is streaming. If you need random access to the results, or you need to pass the results to something that materialises them (like `list()` or `len()`), you force the O(n) space back anyway.

---

## Hash join: paying O(n) more than once

The hash join pattern from Part 2 is worth revisiting from an O(n) perspective, because it illustrates the "paying twice" problem.

```python
# Phase 1: build hash table — O(m) time, O(m) space
lookup = {}
for merchant in merchants:              # O(m)
    lookup[merchant["id"]] = merchant   # O(1) insert

# Phase 2: probe — O(n) time, O(1) additional space
for transaction in transactions:                        # O(n)
    merchant = lookup.get(transaction["merchant_id"])   # O(1) hash lookup
    if merchant:
        yield (transaction, merchant)
```

Time: O(m) + O(n) = O(n+m). Each record is touched exactly once.

Space: the hash table holds all m merchants. O(m) auxiliary space.

The build phase is unavoidable: you need every merchant in the lookup table before you can probe. But notice what this means for your job's memory footprint: the smaller table must fit in memory entirely before processing begins.

If both tables are large, you cannot build the hash table for the larger one. This is when Spark or Postgres falls back to sort-merge join — which also requires O(n) space for the sort buffers, but distributes that cost differently. The tradeoff between join strategies is partly a conversation about which O(n) space bill you're willing to pay.

---

## The universal takeaway

O(n) is frequently the unavoidable minimum. When the task requires touching every record, no algorithm can do better. The questions to ask are:

**Does this algorithm need to remember past records?** If yes, auxiliary space is O(n). If no, it can be O(1). That distinction determines whether you'll OOM at scale.

**Is this O(n) function being called inside a loop?** If yes, the total complexity may be O(n×m), not O(n). Check the call site, not just the function.

**Are you materialising results you could stream?** Every list comprehension where a generator would work is an O(n) space bill you don't need to pay.

The difference between a well-written O(n) pipeline and a broken one isn't usually the loop. It's whether the engineer asked: "do I actually need to hold all of this in memory?"

Part 5 covers O(n log n): why comparison-based sorting cannot do better than n log n, how merge sort derives that complexity from first principles, and why sort-merge join costs what it costs.

---

*The Complexity Series is a 10-part walkthrough of algorithmic complexity for practising data engineers, derived from real learning sessions.*
