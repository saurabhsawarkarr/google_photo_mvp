# Evaluation Strategy — Progressive Memory-Based Search Refinement

> **Related:** [Context](file:///h:/Antigravity/Google%20Photo%20MVP/Document/context.md) · [Architecture](file:///h:/Antigravity/Google%20Photo%20MVP/Document/architecture.md) · [Implementation](file:///h:/Antigravity/Google%20Photo%20MVP/Document/implementation.md)

This document defines how we will evaluate the success of the Progressive Search MVP across all phases. The evaluation is broken down into **Core Business Metrics**, **User Experience (UX) Metrics**, **Technical Performance Metrics**, and the **A/B Testing Framework**.

---

## 1. Core Business & Success Metrics (KPIs)

These metrics directly measure if we are solving the original problem statement (reducing search abandonment for complex memory retrieval).

| Metric | Definition | Baseline (Pre-MVP) | Target | Measured via |
|---|---|---|---|---|
| **Search Abandonment Rate** | % of searches where the user leaves without viewing or sharing a photo | ~40% for complex queries | **< 30%** (10% absolute drop) | Funnel Analytics |
| **Refinement Adoption Rate** | % of users who interact with the refinement panel after an initial search | < 5% | **≥ 20%** | Event Logging |
| **Retrieval Success Rate** | % of multi-step search sessions ending in a successful photo interaction | Unknown | **≥ 70%** | Session Resolution Tracking |
| **Session Resume Rate** | % of interrupted searches that are resumed within 24 hours | N/A | **≥ 50%** | Session State Manager (Phase 4) |

---

## 2. User Experience (UX) Metrics

We will track how efficiently and smoothly the user interacts with the new UI paradigms (understanding chips and dimension buttons).

### 2.1 Refinement Efficiency
* **Time to Resolution (TTR):** How quickly a user finds their target photo after the initial search fails. We aim to decrease TTR by 30% compared to users repeatedly typing new queries from scratch.
* **Average Refinement Depth:** The average number of clues added before resolution. 
  * *Target:* We want this to be **between 1 and 3 clues**. If it's consistently 5+, our dimension scoring engine isn't surfacing the most effective dimensions early enough.

### 2.2 Error Recovery & Trust
* **Zero-Result Hit Rate:** How often a user hits 0 photos. 
  * *Phase 2 Goal:* The auto-revert feature should catch 100% of these, ensuring the user is never left on an empty screen.
* **Disambiguation Interaction Rate:** How often the system asks "Did you mean X or Y?" and what percentage of the time the user successfully makes a choice rather than abandoning.
* **Low-Confidence Clue Removal:** How often users manually delete a `(?)` tagged clue chip (indicating our parser guessed incorrectly).

---

## 3. Technical Performance Metrics

To ensure the new refinement loop feels snappy and conversational, strict latency budgets must be met.

| Component | Target (p95) | Hard Limit (Timeout) | Impact of Failure |
|---|---|---|---|
| **Query Understanding (Groq LLM / Heuristic)** | < 100ms | 300ms | Slows down the initial search response |
| **Search Engine (Photo Store Query)** | < 200ms | 500ms | UI feels sluggish when updating the photo grid |
| **Refinement Engine (Dimension Scoring)** | < 50ms | 100ms | Dimension buttons take too long to suggest options |
| **Total Round-Trip (Search → Parse → Refine)** | **< 300ms** | 1000ms | Breaks the conversational, real-time feel of the UI |

*Note: Phase 1 relies on local heuristics to guarantee these targets. Moving to Groq API (Phase 3) must maintain this p95 latency.*

---

## 4. Evaluation Phases & A/B Testing Framework

We will evaluate the project progressively as each Phase ships.

### Phase 1: The "Visibility" Test
* **What we are testing:** Do users understand the chips? Do they click the fixed dimension buttons?
* **A/B Test Setup:**
  * *Control (50%):* Standard Google Photos single-query search bar.
  * *Variant A (50%):* Visible understanding chips + basic refinement panel.
* **Success Gate:** Refinement adoption > 10%.

### Phase 2: The "Intelligence" Test
* **What we are testing:** Does dynamic dimension scoring (e.g., suggesting `-72%` impact) and disambiguation reduce abandonment?
* **A/B Test Setup:** 
  * *Control:* Phase 1 static refinement buttons.
  * *Variant B:* Dynamically ordered buttons with reduction badges and zero-result protection.
* **Success Gate:** 15% increase in retrieval success rate over Phase 1.

### Phase 3 & 4: The "ML Scale" Test
* **What we are testing:** Does the ML auto-suggest model outperform the heuristic rules?
* **Evaluation:** Run shadow evaluations where the ML model's dimension recommendations are compared against the heuristic's recommendations. Only switch 100% of traffic to ML once it achieves a higher resolution probability score.

---

## 5. Qualitative Evaluation
In addition to quantitative telemetry, we will conduct **User Experience Research (UXR)** sessions with 10-15 participants.
* **Primary Task:** "Find a photo of your friend Anuj planting trees near the office during the monsoon."
* **Observations:**
  1. Do they notice the system parsed "Anuj" as a person?
  2. If they search "tree" and get 5,000 photos, do they naturally reach for the "Where" button to add "Office"?
  3. Do they understand that clicking the '×' on a chip expands their search back out?
