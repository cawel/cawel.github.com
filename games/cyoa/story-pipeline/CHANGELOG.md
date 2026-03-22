# Story Pipeline Changelog

## [3.0] - 2026-03-21

Direction: make the pipeline stricter about structural integrity, clearer about causal logic, more explicit about revision priority, and more deterministic in downstream metadata/image handling.

### Highlights
- Tightened prompt criteria around choice fulfillment, callback deadlines, causal coherence, and revision execution order.
- Reduced ambiguous pipeline behavior by formalizing severity classification, tone validation fallback, brevity handling, and image retry rules.
- Moved reusable pipeline inputs into `story-pipeline/input/` so tone and audience catalogs are clearly separated from prompts and outputs.

### Step 1 — Concept Foundation
- Added hook specificity gate: reject any hook that fits three or more unrelated genres without changing concrete nouns.

### Step 2 — Narrative Architect
- No placeholder deadlines allowed in callback timing fields; all example values updated to real numbers.

### Step 3 — Story Draft
- Added per-chapter micro-checklist: opening must honor incoming choice, chapter must include decision-pressure paragraph, no choice-only terms in prose.

### Step 4 — Story Critique
- Added `craftSeverity` output field classifying each craft deficit as `blocking` or `nonBlocking` (blocking applies to `causalCoherence`, `endings`, `branchDistinctiveness`, `toneAdherence` when below 3).

### Step 5 — Story Revision
- Added Execution Order Contract: structural errors → `craftSeverity.blocking` → `topPriorities` → remaining below-3 craft.

### Step 6 — Metadata Extractor
- Added optional `ARCHITECTURE_JSON` and `TONE_CATALOG_JSON` inputs.
- Added tone validation with a five-step fallback order to prevent `"unknown"` tone outputs.

### Step 7 — Image Prompt Generator
- Added brevity override: if a prompt exceeds 100 words, remove non-essential adjectives and duplicate style qualifiers first.

### Step 8 — Image Generator
- Added deterministic retry policy: max 3 attempts per chapter, exponential backoff, transient failures only.
- Manifest now records `attempts`, `status`, and `failureReason` per chapter.

---

## [2.4]

- Mostly focused on improving story image prompts: richer cinematic framing, stronger visual specificity, and more consistent style anchoring across branches.
