# Edge Cases & Mitigation Strategy

> **Related:** [Context](file:///h:/Antigravity/Google%20Photo%20MVP/Document/context.md) · [Architecture](file:///h:/Antigravity/Google%20Photo%20MVP/Document/architecture.md) · [Implementation](file:///h:/Antigravity/Google%20Photo%20MVP/Document/implementation.md)

This document outlines the known edge cases for the Progressive Memory-Based Search Refinement project and details how the system is designed to handle them gracefully.

---

## 1. Natural Language & Parsing Edge Cases

| Edge Case | Description | Mitigation / UX Handling |
|---|---|---|
| **Ambiguous Clues** | A user inputs a word that maps to multiple dimensions (e.g., "Beach" could be a `Location` or an `Object`; "Apple" could be a `Brand/Device` or an `Object`). | **Disambiguation Modal:** The Query Understanding Service returns a `disambiguation: true` flag with alternatives. The UI pauses the refinement and asks the user: *"Did you mean 'Beach' as a Location or an Object?"* (Implemented in Phase 2). |
| **Unrecognized Entities** | The user types highly specific jargon, a nickname, or a typo that neither the dictionary nor the Groq API recognizes. | **Low-Confidence Fallback:** The parser defaults the clue to an `Object` dimension with a `confidence < 0.7`. The UI renders the chip with a dashed red border and a `(?)` badge, allowing the search engine to attempt a fuzzy text match while signaling uncertainty to the user. |
| **Contradictory Clues** | The user adds clues that logically conflict (e.g., `[📅 Winter]` and `[📅 Summer]`, or `[📍 Paris]` and `[📍 Tokyo]`). | **Union vs. Intersection:** If clues belong to the exact same dimension and are mutually exclusive in a single photo's metadata, the search engine treats them as an `OR` condition internally (e.g., photos in Paris OR Tokyo) to prevent instant zero-results, rather than a strict `AND`. |

---

## 2. Retrieval & Data Edge Cases

| Edge Case | Description | Mitigation / UX Handling |
|---|---|---|
| **Zero-Result Over-Filtering** | The user adds a valid clue, but it drops the result count to absolutely 0. | **Zero-Result Protection:** The backend detects the `count === 0` state during the refinement POST. It rejects saving the state and returns a `zero_results: true` flag. The UI shows a toast (e.g., *"No results for 'snow'. Reverted."*) and animates the chip away, keeping the user on their previous results. |
| **Massive Initial Result Sets** | The user searches a very generic term (e.g., "photo") returning 50,000+ results, making the `estimated_reduction` calculation expensive. | **Sampling:** The Refinement Engine (Phase 2/3) only runs entropy/reduction calculations on a random subset of the top 1,000 returned photos to maintain the strict `< 50ms` latency budget. |
| **Shared / Partner Albums** | The photo the user is looking for actually belongs to a partner's shared library and hasn't been saved locally. | **Federated Search Expansion:** If the local search yields very low results, the UI presents a dimension button to *"Include Shared Libraries"*, expanding the search scope explicitly. |

---

## 3. System & Infrastructure Edge Cases

| Edge Case | Description | Mitigation / UX Handling |
|---|---|---|
| **Groq API / LLM Timeout** | The two-tier query parser attempts to fall back to the Groq API for a complex query, but the API times out (> 300ms). | **Graceful Degradation:** The Query Understanding Service aborts the LLM call and drops back to the local heuristic dictionary. If that fails, it treats the query as a raw text string (falling back to legacy Google Photos search behavior). |
| **Cross-Device Session Collision** | The user starts a refinement session on their phone, drops it, and resumes on the Web UI (Phase 4), but attempts conflicting actions on both simultaneously. | **Last-Write-Wins:** The Session State Manager in Cloud Datastore uses timestamp-based conflict resolution. The UI polls/subscribes to session updates to keep the chip display synchronized across devices. |
| **Stale Session Expiry** | A user leaves a session open and returns 10 days later. New photos have been backed up in the meantime. | **Session Re-hydration:** Sessions expire in the cache after 7 days. If a user resumes a stale session, the backend silently re-runs the active clues against the *current* photo index to ensure the result count and photos include anything newly uploaded. |
