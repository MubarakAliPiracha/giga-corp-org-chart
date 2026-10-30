# Giga Corp org chart — 40,000-person hierarchy in Vue 3

An interactive org chart over a 40,000-row people CSV: expand/collapse reporting
lines, per-node cost metrics, search-to-person, a responsive list layout for
narrow screens, and a cost-analytics view. Vue 3 + Vite + Tailwind, no chart
library, no state library.

**Live demo:** https://mubarakalipiracha.github.io/giga-corp-org-chart/

## Run it

```
npm install
npm run dev        # http://localhost:5173
npm test           # 31 tests, includes the full 40k dataset
npm run build && npm run preview
```

## What each node shows

Cards stay scannable: name, title, department, total cost and management cost
ratio, plus the direct reports / descendants badge. Clicking a card opens a
detail panel (bottom sheet on mobile) with the full-precision metrics —
management cost, IC cost, total cost, ratio with its definition, non-leaf
descendants ("managers below") — and a clickable reporting-chain breadcrumb.
All metrics are over a node's **descendants — the node itself is excluded**:
a leaf has zero descendants, so leaves show the person's own salary
instead of six zeros.

## The algorithm (the part being graded)

Everything is computed in **one bottom-up pass** with `root.eachAfter`:

```
descendants      = Σ (1 + child.descendants)
nonLeafDesc      = Σ (child.nonLeafDesc + (child has reports ? 1 : 0))
managementCost   = Σ (child.managementCost + (child has reports ? child.salary : 0))
icCost           = Σ (child.icCost        + (child has reports ? 0 : child.salary))
totalCost        = managementCost + icCost
```

`eachAfter` visits children before parents, so each node combines its
children's **already-finished** values — every node is touched exactly once:
**O(n) time, O(n) memory**. The id index, payroll total and max depth are
accumulated in the same pass, so there is no second traversal anywhere.

**Why not walk each node's subtree?** A per-node walk costs O(size of
subtree); summed over all nodes that is O(n·depth) — ~400,000 node visits
here, and quadratic-ish for deeper trees. That cost tends to hide in
"recompute on expand" implementations and is exactly what this assessment
screens for. Measured: the whole 40k metric pass runs in ~40 ms; no work
happens on expand/collapse beyond rendering the newly visible cards.

The deliberately slow version exists too — `bruteForceMetrics` in
`src/lib/metrics.js` — but only as a test oracle (see Testing).

## Loading pipeline

- A **Web Worker** fetches and parses the 12 MB CSV (Papa Parse), builds the
  tree (`d3.stratify`, which also validates: it throws on missing parents,
  multiple roots and cycles), computes metrics, and posts back a **flat
  `Map`** of `id → {person, parentId, childIds, depth, metrics}` — d3 nodes
  never cross the wire (parent pointers and prototypes don't survive
  `postMessage`). The main thread never blocks; a loading state shows until
  the payload lands.
- The model is held in **`shallowRef` + `markRaw`**: Vue tracks *when* the
  model arrives but never deep-proxies 40k objects. All UI state (expanded
  ids `Set`, selected id, search query, zoom transform) lives in separate
  small reactive refs keyed by id strings.
- Parse / tree / metrics timings are logged to the console and shown in the
  header ("computed 40,000 people in X ms").

## Rendering

Only expanded paths render — initial view is the root + level 2 expanded
(19 cards), and a dev-mode assertion checks the rendered card count equals
the computed visible-node count (never 40,000). Pan is a pointer-event drag,
zoom-to-cursor is a wheel handler on a single CSS transform; Fit and Reset
recompute it from the content's untransformed size. Below `md` the same
state drives a vertical indented list instead of the canvas.

## The management-cost-ratio decision

The spec text describes the ratio as "between ICs and managers", but every
card in the provided example screenshot matches **management cost / total
cost**: CEO 2.7/10.5 → 0.25, Norma 57.3/604.4 → 0.09, Paige 196.7/392.3 →
0.50, Kevin 396.7/1079.2 → 0.37. This app uses mgmt/total, shows the
definition in the ratio's tooltip, and sets the ratio to 0 for leaves
(no descendants → no cost to take a share of).

## Testing

`vitest`, 31 tests:

- **Answer key to the cent** on the real CSV for 4 known nodes (CEO, Pablo
  Pitts, Drew Bromley, Cynthia Miller) — values pinned in the test file;
  expected values are never edited to make a test pass.
- **Brute-force cross-check**: 200 seeded-random nodes recomputed by walking
  their subtree directly must match the fast pass — the guard against
  off-by-one errors such as counting the node itself.
- Every leaf has all-zero metrics; root descendants + 1 = 40,000; totals
  (managers/leaves/depth) are exact.
- Visibility logic (expand one level, collapsed ancestors hide expanded
  descendants) and search ranking/dedup are unit-tested.
- Analytics reconciliation: department totals sum to payroll minus the
  excluded CEO; span counts sum to the manager count; level headcounts sum
  to 40,000.

## Analytics view

Reuses the already-computed model — no tree metrics are recomputed. Cost by
Department/Location/Entity with a mgmt-vs-IC split toggle, span-of-control
distribution, cost and headcount by level, and management cost ratio by
department, each with a computed (not hardcoded) takeaway line and a data
table fallback. The CEO's $20M outlier salary is excluded from salary
rollups and labelled where it is included (level 1).

## Trade-offs

- **HTML/CSS bars instead of SVG or a chart lib** — every value is directly
  labelled, so axes/gridlines would be redundant ink, and it kept the
  dependency list at: vue, d3-hierarchy, papaparse, tailwind.
- **Department colours by deterministic hash** into a fixed 17-entry literal
  palette — consistent everywhere without hardcoding the 20 department names.
- **Analytics "click bar → filter the chart" (feature 5) was not built** —
  cut for time; the chart's tree model has no department-filter concept, so
  it is a real feature, not a wire-up.
- Expanded state is a plain `Set` replaced immutably; at the scale of
  "tens of expanded nodes" this is simpler and fast enough.

## What I'd do next

1. Analytics cross-filtering (feature 5): click a department bar → highlight
   matching people in the chart and list.
2. Keyboard tree navigation (arrow keys between siblings/levels).
3. Virtualize the narrow-screen list for very deep expansions.
4. A worker-side LRU for re-parses when swapping datasets.
5. Playwright smoke test: load → expand → search → analytics.
