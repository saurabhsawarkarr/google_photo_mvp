# Implementation Plan — Progressive Memory-Based Search Refinement

> **Last updated:** 2026-10-03
> **Related:** [Architecture](file:///h:/Antigravity/Google%20Photo%20MVP/Document/architecture.md) · [Context](file:///h:/Antigravity/Google%20Photo%20MVP/Document/context.md) · [Problem Statement](file:///h:/Antigravity/Google%20Photo%20MVP/Document/Problem%20statemnat.txt)

---

## Implementation Strategy

The project is divided into **4 phases**, each delivering an independently shippable increment. Each phase builds on the previous one and is scoped to validate a specific hypothesis before investing further.

```
 Phase 1 (MVP)           Phase 2                Phase 3               Phase 4
 ─────────────           ───────                ───────               ───────
 Foundation +            Smart                  Intelligent           Scale +
 Core Loop               Refinement             Engine                Learn

 ┌──────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
 │ Search +  │      │ Dynamic dim  │      │ ML-powered   │      │ Cross-device │
 │ Parse +   │─────>│ suggestions  │─────>│ scoring +    │─────>│ sessions +   │
 │ Display + │      │ + undo +     │      │ auto-suggest │      │ feedback     │
 │ Refine    │      │ disambiguation│     │ + NL convo   │      │ loop         │
 └──────────┘      └──────────────┘      └──────────────┘      └──────────────┘
```

---

## Phase 1 — Foundation + Core Refinement Loop (MVP)

> **Goal:** Prove that showing parsed understanding + a simple refinement flow reduces search abandonment.
>
> **Hypothesis:** If we show users what the system understood and let them add one more clue at a time, refinement adoption will reach ≥20% and abandonment will drop by ≥10%.

---

### 1.1 Deliverables

| # | Deliverable | Description |
|---|---|---|
| D1 | **Search Bar with NLP parsing** | User types a natural-language query; system extracts typed clues |
| D2 | **Understanding Display** | Parsed clues shown as visual chips below the search bar |
| D3 | **Static Refinement Panel** | Fixed dimension prompts (Who · Where · When · Activity · Visual) with free-text input |
| D4 | **Results Grid with count** | Photo grid showing result count; updates on refinement |
| D5 | **Session State (client-side)** | In-memory session holding active clues and refinement history |
| D6 | **Basic API endpoints** | `/api/search` and `/api/session/{id}/refine` |
| D7 | **Event logging** | Log: query, parsed clues, refinement steps, outcome (resolved/abandoned) |

---

### 1.2 Task Breakdown

#### Sprint 1: Backend Foundation

| Task | Details | Dependencies |
|---|---|---|
| **T1.1** Set up project scaffold | Frontend (React/Vite) + Backend (Node.js/Express or Python/FastAPI) | — |
| **T1.2** Implement Query Understanding Service | Two-tier parsing: Fast local heuristic/dictionary matching first; fallback to Groq API (e.g., Llama 3) ONLY for complex, multi-dimensional, or conversational queries | T1.1 |
| **T1.3** Design data models | Implement `SearchSession`, `Clue`, `RefinementStep` schemas per [architecture §3](file:///h:/Antigravity/Google%20Photo%20MVP/Document/architecture.md#L85) | T1.1 |
| **T1.4** Build mock Photo Metadata Store | Seed with ~500 sample photos with multi-dimensional metadata (objects, people, locations, dates, visual attrs) | T1.3 |
| **T1.5** Implement Search Service (basic) | Multi-attribute filter against metadata store; return ranked photos + count | T1.3, T1.4 |

**Sprint 1 output:** Backend can parse a query, extract clues, search against a seeded photo store, and return structured results.

---

#### Sprint 2: API + Refinement Engine (Basic)

| Task | Details | Dependencies |
|---|---|---|
| **T2.1** Build `POST /api/search` endpoint | Orchestrate: parse → create session → search → return response (per [architecture §5.2](file:///h:/Antigravity/Google%20Photo%20MVP/Document/architecture.md#L340)) | T1.2, T1.5 |
| **T2.2** Build `POST /api/session/{id}/refine` endpoint | Parse new clue → merge into session → re-search → return updated results | T2.1 |
| **T2.3** Build `GET /api/session/{id}` endpoint | Return current session state | T2.1 |
| **T2.4** Implement basic Refinement Engine | Merge new clues with existing session; return static dimension suggestions (all 5 dimensions minus already-filled ones) | T2.1 |
| **T2.5** Implement clue removal `DELETE /api/session/{id}/clue/{clue_id}` | Remove clue from session → re-search → return updated results | T2.2 |
| **T2.6** Add session resolution `PATCH /api/session/{id}/resolve` | Mark session as resolved when user selects target photo | T2.1 |

**Sprint 2 output:** Complete API layer supporting the full search → refine → undo → resolve lifecycle.

---

#### Sprint 3: Frontend + Integration

| Task | Details | Dependencies |
|---|---|---|
| **T3.1** Build Search Bar component | Text input with submit; calls `/api/search` | T2.1 |
| **T3.2** Build Understanding Display component | Render parsed clues as removable chips (e.g., `[🌻 Sunflower ×]`) | T2.1 |
| **T3.3** Build Refinement Panel component | Static dimension chips (Who/Where/When/Activity/Visual); each opens a text input; submits to `/api/session/{id}/refine` | T2.2 |
| **T3.4** Build Results Grid component | Photo grid with result count badge; animate count transitions (e.g., "200 → 42") | T2.1 |
| **T3.5** Implement Session State Manager | Client-side store (Zustand/Redux) holding active clues, refinement history, undo stack | T3.2, T3.3 |
| **T3.6** Wire end-to-end flow | Connect all components; test full journey: search → see understanding → refine → see narrowed results → find photo | T3.1–T3.5 |
| **T3.7** Add event logging | Instrument all user actions: query submitted, clue added, clue removed, photo selected, session abandoned | T3.6 |

**Sprint 3 output:** Fully functional MVP — user can search, see parsed understanding, progressively refine, and find their photo.

---

### 1.3 Data Flow (Phase 1)

```
┌──────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  User    │      │   Client     │      │   Backend    │      │  Photo       │
│          │      │   (React)    │      │   (API)      │      │  Store       │
└────┬─────┘      └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
     │                   │                     │                     │
     │  Type query       │                     │                     │
     │ ─────────────────>│                     │                     │
     │                   │  POST /api/search   │                     │
     │                   │ ───────────────────>│                     │
     │                   │                     │  Parse query (NLP)  │
     │                   │                     │  ──────┐            │
     │                   │                     │  <─────┘            │
     │                   │                     │  Create session     │
     │                   │                     │  ──────┐            │
     │                   │                     │  <─────┘            │
     │                   │                     │  Multi-attr search  │
     │                   │                     │ ───────────────────>│
     │                   │                     │  Ranked results     │
     │                   │                     │ <───────────────────│
     │                   │  {clues, results,   │                     │
     │                   │   suggestions}      │                     │
     │                   │ <───────────────────│                     │
     │  Show:            │                     │                     │
     │  understanding    │                     │                     │
     │  + 200 results    │                     │                     │
     │  + "What else?"   │                     │                     │
     │ <─────────────────│                     │                     │
     │                   │                     │                     │
     │  Add clue: "farm" │                     │                     │
     │ ─────────────────>│                     │                     │
     │                   │  POST /refine       │                     │
     │                   │ ───────────────────>│                     │
     │                   │                     │  Parse + merge +    │
     │                   │                     │  re-search          │
     │                   │                     │ ───────────────────>│
     │                   │                     │ <───────────────────│
     │                   │  {updated clues,    │                     │
     │                   │   42 results}       │                     │
     │                   │ <───────────────────│                     │
     │  Show: 200 → 42   │                     │                     │
     │ <─────────────────│                     │                     │
```

---

### 1.4 Acceptance Criteria

| Criterion | Definition of Done |
|---|---|
| ✅ Query parsed | Natural-language query is parsed into ≥1 typed clue with dimension + value |
| ✅ Understanding shown | Parsed clues rendered as interactive chips below search bar |
| ✅ Results displayed | Photo grid shows matching results with total count |
| ✅ Refinement works | User can add a clue via dimension prompt → results narrow → count updates |
| ✅ Clue removal works | User can remove a clue chip → results broaden → count updates |
| ✅ Session tracked | Full refinement history logged with timestamps |
| ✅ Events logged | All user actions captured for analysis |

### 1.5 Success Metrics (Phase 1)

| Metric | Target | Measurement |
|---|---|---|
| Refinement adoption | ≥20% of searches use at least 1 refinement | Event logs |
| Abandonment reduction | ≥10% drop vs. baseline | Session outcomes |
| Task completion | ≥60% of multi-step searches end in resolution | Session outcomes |

---

## Phase 2 — Smart Refinement + Undo + Disambiguation

> **Goal:** Make the refinement experience intelligent — suggest the *most useful* dimension, handle ambiguity, and support full undo history.
>
> **Hypothesis:** Dynamic dimension ordering + disambiguation will increase refinement success rate by ≥15% over Phase 1.

---

### 2.1 Deliverables

| # | Deliverable | Description |
|---|---|---|
| D8 | **Dynamic dimension ordering** | Dimensions ordered by `estimated_reduction` score (heuristic-based, per [architecture §7](file:///h:/Antigravity/Google%20Photo%20MVP/Document/architecture.md#L475)) |
| D9 | **Dimension reduction preview** | Each dimension chip shows estimated result reduction (e.g., "👤 Who (~72% fewer)") |
| D10 | **Clue disambiguation** | When a clue maps to multiple dimensions, prompt: "Did you mean 📍 Farm (location) or 🎯 Farming (activity)?" |
| D11 | **Full undo history** | Selective clue removal (not just last); visual refinement timeline |
| D12 | **Zero-result protection** | Auto-revert clue if it reduces results to 0; show explanation |
| D13 | **Low-confidence flagging** | Uncertain clues shown with dotted border + "?" indicator |

---

### 2.2 Task Breakdown

#### Sprint 4: Refinement Engine v2

| Task | Details | Dependencies |
|---|---|---|
| **T4.1** Implement dimension scoring heuristic | For each unfilled dimension, compute `estimated_reduction` based on metadata distribution in current result set | Phase 1 complete |
| **T4.2** Order dimensions by score | Sort dimension suggestions by computed score; return ordered list in API response | T4.1 |
| **T4.3** Add `estimated_reduction` to response | Include per-dimension impact estimate in suggestions payload | T4.1 |
| **T4.4** Implement clue disambiguation | Detect when a clue text maps to multiple dimensions; return alternatives in response | Phase 1 T1.2 |
| **T4.5** Implement zero-result protection | Before finalizing a refinement, check if result count = 0; if so, auto-revert and return a warning | Phase 1 T2.2 |
| **T4.6** Add confidence scoring to clue parsing | NLP parser returns confidence per entity; flag low-confidence clues (< 0.7) | Phase 1 T1.2 |

**Sprint 4 output:** Refinement Engine returns dynamically ordered, scored dimensions; handles ambiguity and zero-result cases.

---

#### Sprint 5: Frontend Enhancements

| Task | Details | Dependencies |
|---|---|---|
| **T5.1** Update Refinement Panel — dynamic ordering | Render dimension chips in scored order; animate reordering on each refinement step | T4.2 |
| **T5.2** Add reduction preview badges | Show estimated reduction on each dimension chip (e.g., "~72% fewer") | T4.3 |
| **T5.3** Build disambiguation modal | When API returns alternatives, show a choice modal: "Did you mean X or Y?" | T4.4 |
| **T5.4** Build refinement timeline | Visual timeline showing each step: `[🌻🐝] → +📍Farm → +🌧️Monsoon`; allow clicking any step to revert | T4.5 |
| **T5.5** Implement selective undo | Allow removing any clue (not just last) from any point in the timeline; re-search from that state | T5.4 |
| **T5.6** Add zero-result toast + auto-revert animation | Show warning toast; animate clue chip reverting to previous state | T4.5 |
| **T5.7** Add low-confidence indicators | Render uncertain clues with dotted border and "?" badge | T4.6 |
| **T5.8** Polish transitions + micro-animations | Smooth count transitions, chip add/remove animations, result grid morphing | T5.1–T5.7 |

**Sprint 5 output:** Intelligent, polished refinement experience with dynamic ordering, disambiguation, full undo, and error recovery.

---

### 2.3 Data Flow Additions (Phase 2)

```
                      Phase 2 additions (highlighted with ★)
                      
  User adds ambiguous clue: "farm"
       │
       ▼
  Query Understanding
       │
       ├── Detected: "farm" → [location: "farm", activity: "farming"]
       │                        ★ AMBIGUITY DETECTED
       ▼
  ┌────────────────────────────────────────┐
  │  API Response includes:                │
  │                                        │
  │  "disambiguation": {                   │  ★ NEW
  │    "original_text": "farm",            │
  │    "options": [                        │
  │      {"dim": "location", "val": "farm"},│
  │      {"dim": "activity", "val": "farming"}│
  │    ]                                   │
  │  }                                     │
  └────────────────────────────────────────┘
       │
       ▼
  Client shows disambiguation modal
       │
       ▼
  User selects "📍 Farm (location)"
       │
       ▼
  POST /refine with dimension_hint: "location"
       │
       ▼
  ┌────────────────────────────────────────┐
  │  Refinement Engine checks:             │
  │                                        │
  │  IF result_count == 0:                 │  ★ ZERO-RESULT PROTECTION
  │    → Auto-revert clue                  │
  │    → Return warning + previous results │
  │  ELSE:                                 │
  │    → Return narrowed results           │
  └────────────────────────────────────────┘
       │
       ▼
  Response includes ★ dynamic dimension ordering:
  suggestions.dimensions sorted by estimated_reduction DESC
```

---

### 2.4 Acceptance Criteria

| Criterion | Definition of Done |
|---|---|
| ✅ Dimensions dynamically ordered | Suggestions sorted by `estimated_reduction` score; order changes after each refinement |
| ✅ Reduction previews shown | Each dimension chip displays estimated impact |
| ✅ Disambiguation works | Ambiguous clues trigger a choice modal; user selection is honored |
| ✅ Full undo available | User can remove any clue from any point in the timeline |
| ✅ Zero-result protected | Adding a clue that zeros results is auto-reverted with explanation |
| ✅ Low-confidence flagged | Uncertain clues visually differentiated |

### 2.5 Success Metrics (Phase 2)

| Metric | Target | Measurement |
|---|---|---|
| Refinement success rate | ≥15% improvement over Phase 1 | Sessions ending in resolution |
| Avg clues per session | ≥2.5 | Session data |
| Zero-result recovery | ≥90% of zero-result events recovered (user continues) | Event logs |
| Disambiguation clarity | ≥80% of disambiguations resolved on first prompt | Event logs |

---

## Phase 3 — Intelligent Engine + Conversational Experience

> **Goal:** Replace heuristics with ML-driven scoring; add conversational feedback; enable auto-suggested clue values.
>
> **Hypothesis:** ML-scored dimension suggestions + auto-complete will reduce average search attempts by ≥30% vs. Phase 2.

---

### 3.1 Deliverables

| # | Deliverable | Description |
|---|---|---|
| D14 | **ML-based dimension scoring** | Replace heuristic with trained model: `score(d) = α·entropy_reduction + β·fill_rate + γ·user_memory_likelihood` |
| D15 | **Auto-suggested clue values** | When user taps a dimension, show top candidate values from the current result set's metadata (e.g., Where → ["Farm", "Park", "Beach"]) |
| D16 | **Conversational understanding feedback** | Replace static chips with natural-language feedback: "I see a sunflower and a bee. Where was this photo taken?" |
| D17 | **Smart query rewriting** | System rewrites multi-clue sessions into optimal search queries internally |
| D18 | **Cross-session learning** | Track which dimensions/clue types lead to resolution across sessions; feed back into scoring model |

---

### 3.2 Task Breakdown

#### Sprint 6: ML Scoring + Auto-Suggest

| Task | Details | Dependencies |
|---|---|---|
| **T6.1** Collect training data | Export session logs from Phase 1+2: clue sequences, dimension fills, resolution outcomes | Phase 2 complete |
| **T6.2** Train dimension scoring model | Lightweight model predicting `P(resolution | dimension_fill)` given current session state | T6.1 |
| **T6.3** Deploy scoring model as service | Wrap model in API endpoint; Refinement Engine calls it instead of heuristic | T6.2 |
| **T6.4** Build auto-suggest pipeline | For each unfilled dimension, query metadata store for top-N values in current result set (e.g., most common locations among 42 results) | Phase 2 |
| **T6.5** Add auto-suggest to API response | `suggestions.dimensions[].suggested_values: ["Farm", "Park", "Beach"]` | T6.4 |
| **T6.6** Implement smart query rewriting | Convert structured clue set → optimized search query string internally; improve retrieval accuracy | Phase 2 T2.2 |

**Sprint 6 output:** ML-scored dimension suggestions with auto-suggested values; smarter internal search queries.

---

#### Sprint 7: Conversational UI + Learning Loop

| Task | Details | Dependencies |
|---|---|---|
| **T7.1** Build conversational feedback component | Replace static chips with natural-language understanding display using Groq API for ultra-fast response generation | T6.3 |
| **T7.2** Build auto-suggest dropdown | When user taps a dimension chip, show dropdown of suggested values from the result set | T6.5 |
| **T7.3** Add smart value ranking | Rank suggested values by how much each would narrow results | T6.4, T6.3 |
| **T7.4** Implement cross-session learning pipeline | Batch process resolved sessions → update scoring model weights | T6.2 |
| **T7.5** Build refinement success analytics dashboard | Visualize: refinement funnel, dimension usage, resolution rates by dimension sequence | Phase 2 T3.7 |
| **T7.6** End-to-end testing + optimization | Load testing, latency optimization (target: <500ms per refinement step), edge case coverage | T7.1–T7.4 |

**Sprint 7 output:** Conversational refinement experience with ML-driven suggestions, auto-complete values, and a learning feedback loop.

---

### 3.3 Data Flow Additions (Phase 3)

```
                      Phase 3 additions (highlighted with ★)

  User taps "📍 Where" dimension
       │
       ▼
  ┌────────────────────────────────────────────────┐
  │  Auto-Suggest Pipeline  ★ NEW                   │
  │                                                 │
  │  1. Query metadata store for current 42 results │
  │  2. Aggregate location values                   │
  │  3. Rank by:                                    │
  │     - Frequency in result set                   │
  │     - Estimated narrowing impact                │
  │  4. Return top-5:                               │
  │     ["Farm", "Park", "Garden", "Home", "Beach"] │
  └────────────────────────────────────────────────┘
       │
       ▼
  Client shows dropdown under "Where" chip
  User selects "Farm" (or types custom value)
       │
       ▼
  ┌────────────────────────────────────────────────┐
  │  Smart Query Rewriting  ★ NEW                   │
  │                                                 │
  │  Clues: [sunflower, bee, farm]                  │
  │  ↓                                              │
  │  Rewritten: "close-up sunflower bee farm field"  │
  │  (Optimized for search index recall)            │
  └────────────────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────────────────┐
  │  Conversational Feedback  ★ NEW                 │
  │                                                 │
  │  "I found 42 photos of sunflowers with bees    │
  │   taken at farms. Do you remember who was       │
  │   there or when it was taken?"                  │
  └────────────────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────────────────┐
  │  Cross-Session Learning  ★ NEW                  │
  │                                                 │
  │  Session resolved → log:                        │
  │    sequence: [object, creature, location, person]│
  │    steps_to_resolve: 4                          │
  │    total_time: 45s                              │
  │  → Feed into scoring model retraining           │
  └────────────────────────────────────────────────┘
```

---

### 3.4 Acceptance Criteria

| Criterion | Definition of Done |
|---|---|
| ✅ ML scoring deployed | Dimension suggestions ordered by trained model; measurably better than heuristic |
| ✅ Auto-suggest works | Tapping a dimension shows top-5 candidate values from current result set |
| ✅ Conversational feedback | Understanding display uses natural language, not just chips |
| ✅ Query rewriting | Internal search queries are optimized for recall; measurable improvement in retrieval accuracy |
| ✅ Learning loop active | Resolved sessions feed back into model retraining pipeline |

### 3.5 Success Metrics (Phase 3)

| Metric | Target | Measurement |
|---|---|---|
| Avg search attempts | ≥30% reduction vs. Phase 2 | Session data |
| Time to retrieve | ≤45 seconds for 80% of resolved sessions | Session timestamps |
| Auto-suggest usage | ≥40% of refinements use a suggested value | Event logs |
| Model accuracy | Dimension scoring predicts top-1 useful dimension ≥65% of the time | Offline evaluation |

---

## Phase 4 — Scale, Persistence, and Continuous Learning

> **Goal:** Production-harden the system; add cross-device session persistence; build the continuous improvement flywheel.
>
> **Hypothesis:** Server-side sessions + continuous model updates will sustain and improve retrieval success over time.

---

### 4.1 Deliverables

| # | Deliverable | Description |
|---|---|---|
| D19 | **Server-side session persistence** | Sessions stored server-side; resumable across devices and browser restarts |
| D20 | **Session resume UX** | "Welcome back. You were looking for a sunflower photo at a farm. Continue?" |
| D21 | **Continuous model retraining pipeline** | Automated weekly retraining of scoring model from accumulated session data |
| D22 | **Performance optimization** | Target: <300ms p95 latency per refinement step at scale |
| D23 | **A/B testing framework** | Feature flags for refinement variants; controlled rollout |
| D24 | **Analytics dashboard v2** | Real-time metrics: retrieval rate, abandonment, refinement depth, dimension effectiveness |

---

### 4.2 Task Breakdown

#### Sprint 8: Session Persistence + Resume

| Task | Details | Dependencies |
|---|---|---|
| **T8.1** Migrate session storage to server-side DB | Move from in-memory to persistent store (Cloud Datastore / Firestore); schema per [architecture §3.1](file:///h:/Antigravity/Google%20Photo%20MVP/Document/architecture.md#L87) | Phase 3 complete |
| **T8.2** Implement session resume API | `GET /api/user/{id}/active-sessions` — returns resumable sessions | T8.1 |
| **T8.3** Build session resume UX | On app open, check for active sessions; show resume prompt with session summary | T8.2 |
| **T8.4** Add session expiry + cleanup | Sessions expire after 7 days; background job purges expired sessions | T8.1 |

---

#### Sprint 9: Production Hardening + Continuous Learning

| Task | Details | Dependencies |
|---|---|---|
| **T9.1** Performance optimization | Profile and optimize: NLP parsing (<100ms), search (<200ms), total refinement round-trip (<300ms p95) | Phase 3 |
| **T9.2** Build continuous retraining pipeline | Weekly batch job: export session logs → retrain scoring model → deploy updated model | Phase 3 T7.4 |
| **T9.3** Implement A/B testing framework | Feature flags for: refinement panel variants, scoring model versions, UI treatments | T9.1 |
| **T9.4** Build analytics dashboard v2 | Real-time dashboards: retrieval funnel, dimension effectiveness heatmap, session depth distribution, time-to-resolve histogram | Phase 3 T7.5 |
| **T9.5** Load testing + chaos testing | Simulate 10K concurrent sessions; test degradation paths; validate error handling | T9.1 |
| **T9.6** Documentation + handoff | API docs, runbooks, architecture decision records, on-call playbook | All |

**Sprint 9 output:** Production-ready system with continuous learning, monitoring, and controlled rollout capability.

---

### 4.3 Acceptance Criteria

| Criterion | Definition of Done |
|---|---|
| ✅ Sessions persist | User can close browser, return next day, and resume search |
| ✅ Cross-device resume | Session accessible from any device logged into the same account |
| ✅ Latency target met | p95 refinement round-trip ≤300ms under load |
| ✅ Retraining automated | Model retraining runs weekly without manual intervention |
| ✅ A/B framework live | Can run controlled experiments on refinement variants |
| ✅ Dashboard operational | Real-time metrics visible to product and engineering teams |

### 4.4 Success Metrics (Phase 4)

| Metric | Target | Measurement |
|---|---|---|
| Session resume rate | ≥50% of interrupted sessions are resumed | Session data |
| p95 latency | ≤300ms | Server-side monitoring |
| Model improvement | Scoring accuracy improves ≥5% per retraining cycle (first 3 cycles) | Offline eval |
| Overall retrieval success | ≥70% of multi-step searches end in resolution | Session outcomes |

---

## Cross-Phase: File & Folder Structure

```
Google Photo MVP/
├── Document/
│   ├── Problem statemnat.txt          # Original problem statement
│   ├── context.md                     # Detailed context
│   ├── architecture.md                # System architecture
│   └── implementation.md              # This file
│
├── frontend/                          # Phase 1+
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar/             # T3.1
│   │   │   ├── UnderstandingDisplay/  # T3.2
│   │   │   ├── RefinementPanel/       # T3.3
│   │   │   ├── ResultsGrid/          # T3.4
│   │   │   ├── RefinementTimeline/    # T5.4 (Phase 2)
│   │   │   ├── DisambiguationModal/   # T5.3 (Phase 2)
│   │   │   ├── AutoSuggestDropdown/   # T7.2 (Phase 3)
│   │   │   └── SessionResumePrompt/   # T8.3 (Phase 4)
│   │   ├── store/
│   │   │   └── sessionStore.js        # T3.5 — client-side state
│   │   ├── services/
│   │   │   └── api.js                 # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                           # Phase 1+
│   ├── src/
│   │   ├── routes/
│   │   │   ├── search.js              # T2.1
│   │   │   ├── session.js             # T2.3, T2.6
│   │   │   └── refine.js             # T2.2, T2.5
│   │   ├── services/
│   │   │   ├── queryUnderstanding.js  # T1.2
│   │   │   ├── refinementEngine.js   # T2.4 → T4.1 → T6.2
│   │   │   ├── searchService.js      # T1.5
│   │   │   ├── autoSuggest.js        # T6.4 (Phase 3)
│   │   │   └── queryRewriter.js      # T6.6 (Phase 3)
│   │   ├── models/
│   │   │   ├── session.js            # T1.3
│   │   │   ├── clue.js               # T1.3
│   │   │   └── photo.js             # T1.3
│   │   ├── data/
│   │   │   └── samplePhotos.json     # T1.4
│   │   └── app.js
│   ├── package.json
│   └── .env
│
├── ml/                                # Phase 3+
│   ├── training/
│   │   ├── prepare_data.py           # T6.1
│   │   ├── train_scoring_model.py    # T6.2
│   │   └── evaluate.py              # T6.2
│   ├── serving/
│   │   └── scoring_service.py        # T6.3
│   └── pipeline/
│       └── retrain_weekly.py         # T9.2 (Phase 4)
│
└── analytics/                         # Phase 2+
    ├── dashboards/
    │   └── refinement_funnel.json    # T7.5, T9.4
    └── scripts/
        └── export_sessions.py        # T6.1
```

---

## Cross-Phase: Risk Register

| Risk | Impact | Likelihood | Mitigation | Phase |
|---|---|---|---|---|
| NLP parsing accuracy too low | Users see wrong clues → lose trust | Medium | Start with high-confidence entities only; flag uncertain ones | 1 |
| Users ignore refinement panel | Low adoption → no signal | Medium | A/B test placement; make panel visually prominent; default-expanded | 1 |
| Zero-result clues frustrate users | Abandonment spike | High | Auto-revert with explanation (Phase 2 D12) | 2 |
| Dimension scoring heuristic is wrong | Suggests unhelpful dimensions | Medium | Collect data in Phase 1–2; switch to ML in Phase 3 | 3 |
| Latency too high at scale | Slow refinement → bad UX | Medium | Performance budget per component; caching; pre-compute suggestions | 4 |
| Insufficient training data for ML | Model underperforms heuristic | Low | Keep heuristic as fallback; require ≥10K sessions before switching | 3 |

---

## Phase Progression

```
  PHASE 1 (MVP)          PHASE 2               PHASE 3              PHASE 4
  Foundation +           Smart                 Intelligent          Scale +
  Core Loop              Refinement            Engine               Learn

  ┌────────────┐    ┌────────────────┐    ┌────────────────┐    ┌─────────────┐
  │ Sprint 1   │    │ Sprint 4       │    │ Sprint 6       │    │ Sprint 8    │
  │ Backend    │    │ Engine v2      │    │ ML + Auto-     │    │ Persistence │
  │ Foundation │    │                │    │ Suggest        │    │ + Resume    │
  │            │    │ Sprint 5       │    │                │    │             │
  │ Sprint 2   │    │ Frontend       │    │ Sprint 7       │    │ Sprint 9    │
  │ API +      │    │ Enhancements   │    │ Conv UI +      │    │ Production  │
  │ Refine     │    │                │    │ Learning       │    │ Hardening   │
  │            │    │                │    │                │    │             │
  │ Sprint 3   │    │                │    │                │    │             │
  │ Frontend   │    │                │    │                │    │             │
  └─────┬──────┘    └───────┬────────┘    └───────┬────────┘    └──────┬──────┘
        ▼                   ▼                     ▼                   ▼
    MVP Launch         Smart Launch          ML Launch           Production
    + Metrics          + A/B Test           + Learning             Ready
```
