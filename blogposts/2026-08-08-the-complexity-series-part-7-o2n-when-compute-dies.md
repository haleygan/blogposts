---
id: the-complexity-series-part-7-o2n-when-compute-dies
title: "The Complexity Series · Part 7: O(2ⁿ) and O(n!) When Compute Stops Being the Answer"
date: August 8, 2026
excerpt: Every complexity class before this one, you could throw compute at the problem and eventually win. O(2ⁿ) and O(n!) are where that assumption breaks. Here is why, and what you can actually do about it.
readTime: 17 minutes read
tags:
  - Python
  - Performance
  - Data Engineering
  - Big O
category: Data Engineering
---

You've made it to the complexity classes that change the conversation entirely.

Until now, whether you were looking at O(n), O(n log n), or even O(n²), there was always a way out: add more hardware. Buy a bigger machine. Spin up more workers. The work would eventually finish. It might take a while, but it would finish.

O(2ⁿ) and O(n!) are different. There is no amount of hardware on Earth that saves you. This is where exponential and factorial growth stops being an academic curiosity and becomes a fundamental architectural constraint.

## The Shift from Base to Exponent

Let me establish the central insight first, because it changes everything about how you think about growth.

In every complexity class you've seen so far, n appears as the base of an operation:

```
O(n²)   →  n is the base, 2 is fixed
O(n log n)  →  n is the base, log is the operation
```

In O(2ⁿ), this flips:

```
O(2ⁿ)  →  2 is the base, n is the exponent
```

That swap is everything. When you move n from the base to the exponent position, growth becomes multiplicative instead of additive.

Here's what this means in concrete numbers. Look at what happens when you scale from n=20 to n=30:

| n | n² | 2ⁿ |
| :--- | :--- | :--- |
| 20 | 400 | 1,048,576 |
| 30 | 900 | 1,073,741,824 |
| Growth | 2.25x | 1,024x |

The same increase in n caused n² to barely move, but 2ⁿ exploded by over a thousand times. Why? Because adding 10 to the exponent means multiplying by 2¹⁰, which equals 1,024.

> Every time n increases by 1, you're not adding a fixed amount of work. You're doubling everything you already had. It's compounding, like interest on interest.

## Where O(2ⁿ) Comes From: Naive Fibonacci

The canonical example is recursive Fibonacci, and it teaches you exactly what to watch for in your own code.

Here's the innocent-looking definition:

```python
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
```

This reads almost exactly like the mathematical definition. A junior engineer would call it elegant. But trace through what actually happens when you call `fib(5)`:

```
                    fib(5)
                   /      \
              fib(4)        fib(3)
             /      \       /    \
         fib(3)   fib(2) fib(2) fib(1)
         /    \    /   \   /   \
      fib(2) fib(1) fib(1) fib(0) fib(1) fib(0)
      /    \
  fib(1)  fib(0)
```

Count the function calls. `fib(3)` appears twice. `fib(2)` appears three times. `fib(1)` appears five times.

Now imagine each call isn't just adding two numbers. Imagine it's hitting a database, or computing a feature aggregation, or making an API request. You're recomputing the exact same sub-problems over and over, with no memory of having computed them before.

For larger n, the scale becomes unconscionable:

| n | Function Calls |
| :--- | :--- |
| 10 | 177 |
| 20 | 21,891 |
| 30 | 2,692,537 |
| 40 | 331,160,281 |
| 50 | 40,730,022,147 |

Every call to `fib(n)` spawns exactly two more calls. The tree branches by 2 at every level. A tree n levels deep, branching by 2 at each level, produces O(2ⁿ) total nodes. That's where the label comes from.

> The entire problem boils down to this: it solves the same sub-problem multiple times, from scratch, every single time.

The mathematical derivation makes this rigorous. Let T(n) be the total number of calls. Each call to `fib(n)` makes two recursive calls:

```
T(n) = T(n-1) + T(n-2)
```

Since T(n-1) is always bigger than T(n-2), you can bound this:

```
T(n) < 2 · T(n-1)
     < 2² · T(n-2)
     < 2ⁿ · T(0)
     = O(2ⁿ)
```

One subtle note worth knowing: the two branches are not equal size. The actual tight bound works out to T(n) = Θ(φⁿ) where φ = (1 + √5) / 2, the golden ratio, approximately 1.618. At n=50, this is about 90,000 times smaller than 2⁵⁰. But since Big O captures upper bounds, O(2ⁿ) is still correct and much easier to say.

## The Memoization Escape

Here's the fix that transforms this completely.

The key insight: you only need to compute n unique sub-problems. Just n. Not 2ⁿ. You're recomputing them because of careless recursion, not because they're actually expensive.

```python
def fib_memo(n, cache={}):
    if n <= 1:
        return n
    if n in cache:
        return cache[n]
    result = fib_memo(n-1, cache) + fib_memo(n-2, cache)
    cache[n] = result
    return result
```

The only change is checking the cache before computing. When you hit a cached result, you return it in O(1) time. You solve each unique sub-problem exactly once, then look it up every time after.

The impact is stunning:

```
fib(50) naive:      40 billion calls
fib(50) memoized:   50 calls
```

The time complexity collapses from O(2ⁿ) to O(n). But you paid a price: the cache stores n entries, so space becomes O(n) instead of just the recursion stack.

> You spent O(n) space you were already close to spending anyway, and bought back an entire complexity class in time.

This is the foundation of dynamic programming. To show the impact at scale:

| Approach | fib(50) |
| :--- | :--- |
| Naive recursive | 40 billion calls |
| Memoized | 50 calls |

The speedup is staggering: you trade O(n) space for O(2ⁿ) time, and at n=50 that trade buys you a 800-million-times speedup. This pattern shows up constantly in data engineering: naive recursive rollups that recompute region revenue exponentially, versus memoized versions that compute each region's revenue once and store it in a lookup table.

## O(2ⁿ) in Your Database

Most engineers first encounter O(2ⁿ) behavior without realizing it when they use SQL CUBE:

```sql
SELECT 
    region, product, category,
    SUM(sales)
FROM orders
GROUP BY CUBE(region, product, category)
```

CUBE generates every possible combination of grouping columns. With 3 columns:

```
(region, product, category)  ← all three
(region, product)            ← drop category
(region, category)           ← drop product
(product, category)          ← drop region
(region)                     ← just region
(product)                    ← just product
(category)                   ← just category
()                           ← grand total
```

That's 8 grouping sets. 8 = 2³.

For each column, you make a binary choice: include it or don't. With k columns, you get 2ᵏ combinations. Each is a full aggregation pass over your data. At 20 columns, you're running over a million separate aggregations.

> This is why you almost never see CUBE over more than 4 or 5 columns in production. Beyond that, engineers use explicit GROUPING SETS to list only the combinations they actually need.

The second place O(2ⁿ) hides is in your query planner itself.

When you write a multi-table join, the planner must decide the order to join tables in. The order matters enormously for performance. But there are many possible orders to consider, and the planner uses dynamic programming to avoid evaluating the same subset of tables multiple times.

The number of possible table subsets for n tables is exactly 2ⁿ. Every subset appears in the planner's DP table. For 4 tables that's 16 subsets. For 8 tables, 256. For 12 tables, 4,096.

This is why Postgres has hard limits:

```
SHOW join_collapse_limit;     -- default: 8
SHOW geqo_threshold;          -- default: 12
```

Below 8 tables, the planner does exhaustive search. Between 8 and 12, it uses increasingly approximate methods. Above 12, it switches to a genetic algorithm and gives up on finding the optimal join order.

> Every time you write a query joining more than 12 tables, Postgres is deliberately choosing a suboptimal order because finding the optimal one would cost too much. The planner itself makes the same trade-off we made with memoization.

---

## When Doubling Isn't Enough: O(n!)

Now we move to factorial time. This is where growth transcends explosive and becomes fundamentally impossible.

The difference is subtle but absolute. In O(2ⁿ), every increase of 1 multiplies work by 2. In O(n!), every increase of 1 multiplies work by n itself.

```
n! = n × (n-1) × (n-2) × ... × 1
```

Look at the multiplier:

```
1! = 1       ← multiplied by 1
2! = 2       ← multiplied by 2
3! = 6       ← multiplied by 3
4! = 24      ← multiplied by 4
5! = 120     ← multiplied by 5
```

As n grows, the multiplier grows with it. At n=10 you multiply by 10. At n=100 you multiply by 100.

Compare the two growth curves:

| n | 2ⁿ | n! |
| :--- | :--- | :--- |
| 10 | 1,024 | 3,628,800 |
| 15 | 32,768 | 1,307,674,368,000 |
| 20 | 1,048,576 | 2,432,902,008,176,640,000 |

At n=20, exponential has reached about a million. Factorial has reached 2.4 quintillion.

## The Traveling Salesman Problem

O(n!) comes from permutations. The canonical example is the Traveling Salesman Problem: given n cities and distances between them, find the shortest route visiting all of them.

The brute force approach is straightforward: try every possible ordering, measure each route's distance, keep the shortest.

```python
import itertools

def brute_force_tsp(dist):
    n = len(dist)
    best_tour = None
    best_length = float("inf")
    
    for perm in itertools.permutations(range(1, n)):  # fix city 0 as start
        candidate = (0,) + perm
        length = sum(
            dist[candidate[i]][candidate[(i + 1) % n]]
            for i in range(n)
        )
        if length < best_length:
            best_length = length
            best_tour = candidate
    
    return best_tour, best_length
```

How many times does that outer loop run for n=10 cities? Fix city 0 as the start, permute the remaining 9 cities: 9! = 362,880 iterations.

Each iteration computes the tour length by summing n edges. So the work per iteration is O(n). Total: (n-1)! iterations times O(n) work per iteration = O(n · n!).

But here's something important. You'd think storing all 362,880 permutations in memory would require 362,880 × n space. But `itertools.permutations` is a generator. It produces one permutation at a time and discards it. At any moment you only hold:

```
current permutation:   O(n)    ← one tuple of n cities
best_tour:             O(n)    ← one tuple of n cities
best_length:           O(1)    ← one float
```

Total space: O(n).

This is the generator pattern. Time complexity (how many items you visit) is independent of space complexity (how many items you hold simultaneously). The generator processes items one at a time and never accumulates.

> Time counts total visits. Space counts simultaneous occupancy. They are independent.

## The Reality Check

Now let's see where O(n!) becomes physically impossible.

A modern computer does roughly 1 billion operations per second.

```
n=10:  9!  ≈         363,000 ops  → 0.0004 seconds  ✓
n=15:  14! ≈  87 billion ops  → 87 seconds       ✓
n=17:  16! ≈  20 trillion ops  → 5.8 hours       ✗
n=20:  19! ≈  1.2 × 10¹⁷ ops  → 3.8 years       ✗
n=25:  24! → too large to calculate → longer than universe age ✗
```

Brute force TSP becomes physically impossible around n=17, even as a one-time precomputation.

---

## What You Do Instead

For problems that are too big for brute force, the choice is between algorithms that trade optimality for speed.

The nearest neighbor heuristic is the simplest:

```python
def nearest_neighbor_tsp(dist):
    n = len(dist)
    unvisited = set(range(1, n))
    tour = [0]
    current = 0

    while unvisited:
        nxt = min(unvisited, key=lambda city: dist[current][city])
        tour.append(nxt)
        unvisited.remove(nxt)
        current = nxt

    return tour, tour_length(tour, dist)
```

Start at city 0. Look at all unvisited cities. Go to the closest one. Repeat.

The outer loop runs n times. Each iteration scans the remaining unvisited cities, which is O(n). Total: n × n = O(n²).

For n=15:

```
Brute force:   14! = 87 billion operations
Nearest neighbor:  15² = 225 operations
```

Nearest neighbor is 387 million times faster. But it's greedy. It always picks the locally closest city, not the globally shortest route.

Real benchmark data shows nearest neighbor solutions are typically 5-15% longer than optimal. For a delivery business, would you accept a route that's 8% longer if it means your morning job finishes in milliseconds instead of hours?

The real logistics companies don't use brute force. UPS ORION evaluates 200,000 route alternatives for a single driver using constraint-based search that prunes bad routes early. Amazon CONDOR uses a 5-6 hour precomputation window before orders leave the fulfillment center. FedEx DRO adjusts routes dynamically as conditions change.

None of them brute force every permutation. The real skill is knowing when to approximate and how much accuracy to trade for speed.

---

## Recognition Pattern

This brings us to the one sharp rule of thumb you need to recognize these patterns in production.

When you see a recursive function with overlapping sub-problems, or a query planner warning about join limits, or a permutation-based search breaking at predictable input sizes: you are looking at exponential or factorial growth.

The signal is always the same: small data works fine, n grows by 5, and suddenly nothing works at all. Not gradually slower. Catastrophically broken.

> The moment you recognize this pattern, your first instinct should be: is there overlapping computation I can cache? Is there a greedy approximation that's accurate enough? Is this problem actually small enough to stay brute force forever, or will n grow?

Answer those questions before adding hardware.

Because at O(2ⁿ) and O(n!), hardware adds almost nothing.
