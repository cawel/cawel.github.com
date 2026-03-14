# LLM Single-Story Pipeline

Reusable prompt templates for generating **one high-quality branching CYOA story per run**.
Run the same pipeline repeatedly to build many stories over time.

## Design Principles

- **Storytelling first.** Every step prioritizes narrative craft — foreshadowing, consequence linking, choice weight, character depth, emotional arcs — over mechanical compliance.
- One clear role per template.
- Manual-friendly: run each step in sequence, inspect output, adjust, continue.

## Tone Input

- Canonical tone catalog lives in `llm/tones.input.json`.
- Load its contents as `TONE_CATALOG_JSON` when running templates `01`, `02`, and `03`.
- `DESIRED_TONES` must be chosen from tone names in that file.

## Pipeline (5 Steps)

### Step 1 — Concept & Foundation (`01-concept-foundation.prompt.md`)

Generate 3–5 story concepts, each built around a **central value conflict**, a protagonist fault line, characters with cross-purposes, constraining world rules, and pre-planned **foreshadowing seeds**.

Pick one concept manually before moving on.

### Step 2 — Narrative Architecture (`02-narrative-architect.prompt.md`)

Design the full storytelling blueprint across five layers:

1. **Branch map** — chapter graph with choices and connections
2. **Emotional arc** — target emotion per chapter, rising intensity per path
3. **Foreshadowing plan** — what is planted where, what pays off where (on which branches)
4. **Consequence chains** — how early choices ripple into later outcomes
5. **Ending design** — each ending as a thematic verdict with cost and closure

This is the step that turns a premise into a story that feels *crafted*.

### Step 3 — Story Draft (`03-story-draft.prompt.md`)

Write the complete story in markdown. Craft priorities:

- Execute foreshadowing from the architecture plan
- Make choices reveal values, not just destinations
- Show character motivations through action and dialogue
- Use the environment as obstacle, not backdrop
- Earn every emotional peak through setup

### Step 4 — Story Critique (`04-story-critique.prompt.md`)

Evaluate the draft on two axes:

- **Structural integrity** — links, chapter counts, format, word balance
- **Literary craft** — scored 1–5 on: foreshadowing, choice quality, consequence linking, character consistency, conflict/tension, dialogue, pacing/emotion, endings

Returns a JSON report with the top 3 improvement priorities.

### Step 5 — Story Revision (`05-story-revision.prompt.md`)

Apply the critique. Two internal passes:

1. Fix structural errors (non-negotiable)
2. Address craft weaknesses flagged in the critique (priorities first)

Produces the final story markdown.

### Independent Utility — Metadata Extractor (`06-metadata-extractor.prompt.md`)

Not a pipeline step. Use after the story is finalized when you need `metadata-stories.json` and `metadata-images.json` entries.

## Typical Manual Run

1. Load `tones.input.json` as `TONE_CATALOG_JSON`.
2. Run `01` → get concepts → pick one.
3. Run `02` with chosen concept → get architecture.
4. Run `03` with concept + architecture → get story draft.
5. Run `04` on draft → get critique.
6. Run `05` with draft + critique → get final story.
7. (Optional) Run `06` for metadata.

## Suggested Reusable Inputs

```json
{
  "AUDIENCE": "teen_and_adult",
  "DESIRED_TONES": ["Suspenseful", "Mysterious"],
  "TONE_CATALOG_JSON": "<contents of llm/tones.input.json>",
  "CANDIDATE_COUNT": 4,
  "CHAPTER_COUNT": 12,
  "ENDING_COUNT": 4
}
```

## Output Discipline

- JSON templates output only valid JSON.
- Story templates output only story markdown.
- Never mix prose commentary with structured outputs.
