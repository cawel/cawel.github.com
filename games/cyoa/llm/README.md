# LLM Single-Story Pipeline

Reusable prompt templates for crafting **one high-quality branching CYOA story per run**.
Send one message per step, in sequence. Each run produces a finished, revised story.

## Why a Pipeline

A single "write me a great CYOA story" prompt produces mediocre output because it forces the model to be a concept designer, structural architect, prose writer, critic, and editor all at once. Roles bleed into each other and each one is compromised.

This pipeline forces **role separation**: each step defines a specific identity with distinct quality criteria. A concept architect thinks like a novelist scoping dilemmas. A narrative architect thinks like a showrunner planning structure. A story writer focuses entirely on prose and craft. A critic reads the result as a stranger. A revision editor changes only what the critique demands.

## Why One Message Per Step

When a message opens with a role description, the model anchors its entire response to that identity. Combining roles in one message causes the model to hedge across all of them. The most damaging failure mode: a combined critique+revision prompt produces a softened critique, because the model already knows it will have to execute the fixes. When the same run handles both critique and revision, critique quality drops because the model starts optimizing for easy fixes instead of full honesty.

**Send one message per step.** After each step, inspect the output, adjust if needed, then pass it to the next step as input. The two natural human decision points are after step 01 (pick a concept) and after step 03 (read the draft). The other steps are pure execution.

## Design Principles

- **Storytelling first.** Every step prioritizes narrative craft — foreshadowing, consequence linking, choice weight, character depth, emotional arcs — over mechanical compliance.
- One clear role per template.
- Manual-friendly: run each step in sequence, inspect output, adjust, continue.

## Story Length Input

Three length options control chapter count, ending count, and approximate word count:

| Length | Chapters | Endings | Approx. Words |
|--------|----------|---------|---------------|
| **short** (default) | 8–10 | 3 | 1 000–1 500 |
| **medium** | 11–14 | 3–4 | 1 500–2 500 |
| **long** | 15–20 | 4–5 | 2 500–3 500 |

Pass `STORY_LENGTH` to steps `02`, `03`, and `04`. If omitted, default to **short**.

## Tone Input

- Canonical tone catalog lives in `llm/tones.input.json`.
- Load its contents as `TONE_CATALOG_JSON` when running templates `01`, `02`, and `03`.
- `TONE` is mandatory for template `01` and must be chosen from the tone `name` values in that file.

## Audience Input

- Canonical audience catalog lives in `llm/audiences.input.json`.
- Load its contents as `AUDIENCE_CATALOG_JSON` when running template `01`.
- `AUDIENCE` must be chosen from the audience `name` values in that file.

## Pipeline (6 Steps)

### Step 1 — Concept & Foundation (`01-concept-foundation.prompt.md`)

Generate 3–5 story concepts, each built around a **central value conflict**, a protagonist fault line, characters with cross-purposes, constraining world rules, and pre-planned **foreshadowing seeds**.
The selected `AUDIENCE` and mandatory `TONE` are both interpreted through their catalogs so audience fit and tonal discipline are established before architecture and drafting.

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

### Step 6 — Metadata & Image Prompts (`06-metadata-extractor.prompt.md`)

Extract structured metadata from the finalized story for the application's data layer and image-generation workflow:

- **Story metadata** (`metadata-stories.json` entry): title, emoji, reading time, keywords, chapter count, tone.
- **Image metadata** (`metadata-images.json` entries): one cinematic image prompt per chapter with consistent art style across the story, ending type classification, and no spoilers for non-ending chapters.

## Typical Manual Run

1. Load `tones.input.json` as `TONE_CATALOG_JSON`.
2. Load `audiences.input.json` as `AUDIENCE_CATALOG_JSON`.
3. Run `01` → get concepts → pick one.
4. Run `02` with chosen concept → get architecture.
5. Run `03` with concept + architecture → get story draft.
6. Run `04` on draft → get critique.
7. Run `05` with draft + critique → get final story.
8. Run `06` with final story → get metadata + image prompts.

## Suggested Reusable Inputs

```json
{
  "AUDIENCE": "Teen and Adult",
  "AUDIENCE_CATALOG_JSON": "<contents of llm/audiences.input.json>",
  "TONE": "Suspenseful",
  "TONE_CATALOG_JSON": "<contents of llm/tones.input.json>",
  "CANDIDATE_COUNT": 4,
  "STORY_LENGTH": "short"
}
```

## Output Discipline

- JSON templates output only valid JSON.
- Story templates output only story markdown.
- Never mix prose commentary with structured outputs.
