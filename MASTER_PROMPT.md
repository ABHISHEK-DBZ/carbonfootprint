# Master Prompt — Carbon Footprint Awareness Platform

Copy everything inside the fenced block below into your AI coding tool (Claude Code, Cursor, etc.) right after cloning your empty GitHub repository. It is written to be self-contained: a fresh AI session given only this prompt should be able to produce a working, evaluable submission.

---

```
ROLE
You are acting as a senior full-stack engineer building a hackathon submission end to end:
product thinking, architecture, backend, frontend, tests, and documentation. Work like a
professional shipping production code under a deadline, not a tutorial demo.

CHALLENGE BRIEF (verbatim constraints — do not violate these)
- Vertical: Carbon Footprint Awareness Platform. Help individuals understand, track, and
  reduce their carbon footprint through simple actions and personalized insights.
- The final GitHub repository must be PUBLIC, under 10 MB, and contain a SINGLE branch.
- Maximum 3 submission attempts — so the result must work correctly the first time;
  do not leave known bugs "to fix later."
- The submission must demonstrate: a smart, dynamic assistant; logical decision-making
  based on user context; practical real-world usability; clean, maintainable code.
- Evaluation weights: Code Quality = HIGH, Security = HIGH, root-problem fit = HIGH,
  Efficiency = MEDIUM, Testing = MEDIUM, Accessibility = LOW (but still required for a
  perfect score).

PRODUCT REQUIREMENTS
Build a tool where a user can:
1. Enter simple inputs across four categories: Transport, Electricity, Diet, Waste.
2. See an estimated annual CO2e footprint (kg and tonnes), broken down by category with
   percentage share, and compared against a national average, a global average, and a
   science-aligned target (e.g. ~2 t/year for 1.5°C alignment).
3. Receive a SMART, DYNAMIC, CONTEXT-AWARE set of recommendations:
   - Each recommendation must be ranked by ACTUAL estimated impact for THIS user, computed
     by simulating the change against the user's own numbers and re-running the same
     calculation engine — never a hard-coded "this tip saves X kg" constant.
   - The assistant must state which category dominates the user's footprint, surface the
     single highest-impact action, and ask one short, context-specific follow-up question
     (vary the question by which category dominates — this is the "decision tree" behavior).
4. Optionally save a snapshot (anonymous, no login) and see a simple history/trend.
5. Do all of this without collecting any personally identifiable information.

ARCHITECTURE CONSTRAINTS
- Backend: Node.js + Express. Keep dependencies minimal and justify each one in the README.
- Pure calculation/decision logic must live in plain, dependency-free modules
  (e.g. lib/emissionEngine.js, lib/recommendationEngine.js) so they are independently
  unit-testable and have no I/O side effects.
- Validate every API input server-side: type checks, numeric ranges, enum allow-lists,
  and a request body size cap. Reject invalid input with a 400 and specific field errors —
  never silently coerce or guess.
- Frontend: plain HTML/CSS/vanilla JS (no framework, no build step, no external CDN/font
  dependency) OR a minimal React app if you prefer — either is acceptable, but it must be
  fully responsive, keyboard-navigable, and usable with a screen reader (semantic HTML,
  labelled form fields, aria-live region for the assistant's messages,
  prefers-reduced-motion respected, visible focus states).
- Serve the frontend from the same Express server (express.static) so the whole thing runs
  from a single `npm start`, with no separate build/deploy step required for evaluation.
- Storage for the optional tracking feature may be in-memory (acceptable for this scope)
  but must be BOUNDED (cap entries per user, cap total tracked users) so it cannot be used
  to exhaust server memory. Document this trade-off explicitly in the README rather than
  hiding it.

SECURITY REQUIREMENTS (non-negotiable, this is a HIGH-impact grading criterion)
- Add helmet for security headers and cors with a configurable allowed origin.
- Add rate limiting on the API routes.
- Never log or persist PII. Any tracking identifier must be a random client-generated UUID
  with no link to name/email/device fingerprint.
- No secrets committed to the repo — provide a .env.example, not a .env, and gitignore
  node_modules, .env, and log files.
- Centralize error handling so stack traces are never returned to the client.

CODE QUALITY REQUIREMENTS (HIGH-impact grading criterion)
- Small, single-responsibility modules; no business logic inside route handlers.
- Consistent naming, no dead code, no commented-out blocks left in.
- Every exported function has a clear single purpose and is named for what it returns,
  not how it's implemented.

TESTING REQUIREMENTS (MEDIUM-impact grading criterion)
- Use a dependency-free test runner (Node's built-in node:test is sufficient) so testing
  doesn't add to the dependency/repo-size budget.
- Cover at minimum: calculation monotonicity (more usage -> more emissions), at least one
  ordering property (e.g. a cleaner option emits less than a dirtier one for the same
  usage), clamping/edge-case handling for out-of-range inputs, that the recommendation
  engine never mutates its input and never returns a non-positive-impact suggestion, and
  that validation correctly rejects malformed/abusive payloads.
- After writing the code, ACTUALLY RUN the test suite and the server, and fix any failures
  before declaring the work done — do not just describe tests, execute them.

DELIVERABLES
1. Working code in backend/ and frontend/ following the structure above.
2. A README.md that functions as a PRD + design doc, including: chosen vertical, problem
   statement, MVP scope table, architecture diagram (ASCII is fine), tech stack with a
   one-line rationale per choice, API reference table, an explicit "Assumptions &
   Limitations" section, and a table mapping each evaluation criterion to where it's
   addressed in the repo.
3. Before finishing, self-review against the "How Your Work Is Evaluated" weights given in
   the brief and explicitly fix anything that would score poorly on a HIGH-impact item.

PROCESS
1. First, restate the plan briefly (data model, API surface, file structure) before writing
   code.
2. Implement the calculation engine and its tests first, run them, confirm they pass.
3. Implement the recommendation/decision engine and its tests, run them, confirm they pass.
4. Implement the Express API and validation, smoke-test every route with curl or equivalent.
5. Implement the frontend, wire it to the API, and manually verify the full flow.
6. Write the README last, once the real file structure and API are final (don't let docs
   drift from the implementation).
7. Run `git status` before committing to make sure node_modules and any .env are not staged.

Now build it.
```

---

## Notes on using this prompt

- If your AI platform supports it, run the prompt in **plan/ask mode first**, review the proposed file structure, then switch to **build/agent mode** to execute — this avoids large, hard-to-review diffs.
- Commit early and often (`git add -A && git commit -m "..."`) so partial progress is preserved within your 3-attempt budget.
- After the AI finishes, manually open the running app and click through the calculator once yourself before pushing — an AI's "tests pass" is not a substitute for one real human pass through the UI.
