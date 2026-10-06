# MVP Working & Alignment with Research Findings

This document details exactly how our Progressive Memory-Based Search Refinement MVP works to solve the core product problem, and maps our provided solution directly to the insights and findings from our discovery research.

## 1. The Core Problem We Are Solving
Our discovery research identified a critical gap: **Users remember photos through multiple, evolving cognitive dimensions (Who, Where, When, What), but existing photo search engines do not provide a clear, adaptive way to turn these secondary memories into actionable refinement steps.** 

As a result, when an initial search returns too many results, adding more keywords often leads to a zero-result dead end, forcing the user to abandon the search.

## 2. How the Solution is Aligned with the Findings

The table below maps the specific insights from our user research directly to the features built into our MVP:

| Research Finding / Insight | How the MVP Solves It | Feature / Working Mechanism |
| :--- | :--- | :--- |
| **Finding 1:** 48.6% of search journeys end in search-recovery failure and abandonment. | **Preventing Dead Ends:** Instead of forcing users to guess the next keyword and potentially breaking the search, the MVP guides them to add specific dimensions sequentially. | **Progressive Refinement Engine:** Breaks the search process into manageable steps instead of a single query. |
| **Finding 2:** Users remember photos through different dimensions (Location, People, Objects, Activities, Time). | **Dimension-Based Categorization:** The system parses user queries and categorizes them into these exact 5 dimensions. | **5 Memory Dimensions:** The UI explicitly provides filters for "Who", "Where", "When", "What happened", and "Objects". |
| **Finding 3:** Adding details often causes search to fail (e.g., Pritish adding a specific date caused failure). | **Zero-Result Protection:** The MVP never lets a user fall into an empty state. If a new clue yields 0 results, the system rejects it and keeps the previous valid results. | **Zero-Result Guardrail:** Backend simulates the refinement; if count == 0, returns `zero_results: true` and reverts the breaking filter. |
| **Finding 4:** Combining details doesn't always improve retrieval (e.g., Resham wanting a front-facing Ganpati decoration). | **Disjunctive / Relaxed Scoring:** If exact matches fail, the system falls back to partial matches and explains relevance. | **Relevance Badges & Relaxed Match:** Evaluates exact intersection; if none, shows photos matching the most dimensions with partial match badges (e.g., "75%"). |
| **Finding 5:** Users have more memory than their initial search contains. | **Staging and Suggesting:** The system shows what it understood from the first search, and prompts the user with the most likely next filters based on the remaining candidate photos. | **Dynamic Suggestions:** Calculates dimension coverage across remaining candidate photos to suggest the most effective next filter (e.g., specific dates, people). |

---

## 3. How the MVP is Working (Technical Flow)

The MVP operates through a seamless connection between the UI, the Query Understanding parser, and the Refinement Engine. Here is the step-by-step working process:

### Step 1: Initial Query & Tiered Parsing
When a user enters a query (e.g., *"Beach with Vikram"*):
1. **Tier 1 (Fast Regex/Dictionary):** The backend uses a local dictionary and regex word-boundary checks to identify known locations ("beach") and proper nouns ("Vikram").
2. **Tier 2 (Groq LLaMA 3.1 Fallback):** For complex natural language, the system falls back to an LLM to extract structured JSON clues.
* **Output:** `[{ dimension: 'location', value: 'beach' }, { dimension: 'person', value: 'Vikram' }]`

### Step 2: Session Creation & Conjunction Search
1. The server creates an **in-memory session** to track the user's narrowing path.
2. The search engine applies **Conjunction Logic**: It looks for photos in the metadata store that contain *both* the location "beach" and the person "Vikram".
3. **Scoring:** Photos matching all dimensions get an **Exact Match %** (86%-99%). Photos matching only a subset get a **Relaxed Match %** (38%-75%).

### Step 3: Presenting Results & Dynamic Suggestions
1. The UI renders the exact match photos. 
2. The UI explicitly shows the user the parsed clues as removable blue chips (`📍 Where: Beach`, `👤 Who: Vikram`).
3. The **Refinement Engine** analyzes the remaining matched photos. It calculates which unused dimension (e.g., *Time* or *Activity*) has the highest coverage among the remaining photos and sends dynamic suggestions back to the UI.

### Step 4: The Progressive Refinement Loop
1. The user looks at the results, realizes they need to narrow it down, and clicks a suggested Date card (e.g., *"Winter 2024"*).
2. The UI sends this new clue to the `/api/session/:id/refine` endpoint.
3. **Zero-Result Check:** The backend tests the new clue. 
   - *If it results in 0 photos:* The backend rejects the clue and sends a warning back: `"Adding 'Winter 2024' removed all results. Kept previous search."` The user's screen does not break.
   - *If it succeeds:* The backend adds it to the session, updates the Narrowing Breadcrumbs (`Search: "Beach" → 12 • + Vikram → 5 • + Winter 2024 → 2`), and returns the refined photos.
4. The user finds their specific target photo successfully without ever hitting a dead end.

## Conclusion
By shifting from a **Single-Shot Keyword Search** to a **Progressive Memory Refinement Search**, this MVP directly resolves the search-recovery failures identified in discovery research, allowing users to leverage their evolving memory safely and intuitively.
