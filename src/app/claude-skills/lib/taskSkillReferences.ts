/**
 * Reference files bundled inside the task skill folders (`references/*.md`).
 * SKILL.md stays short and lists these with a "read when" line, so the agent only loads them when needed.
 */

export const REVIEW_CHECKLIST = `# Review Checklist

Work through the sections that apply to the diff. Skip a section only when the change cannot affect it.

## Correctness
- Does the code do what the PR description and linked issue say? Check each stated behaviour against the diff.
- Boundaries: empty input, a single item, maximum size, zero, negative, null/undefined, unicode, time zones.
- Error paths: is every thrown or returned error handled, logged once, and surfaced with a useful message?
- Async code: missing \`await\`, unhandled promise rejections, races between concurrent requests, retries that are not idempotent.
- State: mutations of shared objects, stale caches, effects that run twice, missing cleanup.

## Security
- External input (request body, query, headers, files, env) is validated before use.
- Authorization is checked on the server for every new endpoint, action, or query, not only hidden in the UI.
- No string-built SQL, shell commands, HTML, or file paths from user input.
- Credentials, tokens, and personal data never appear in logs, error messages, URLs, or analytics events.
- New dependencies: maintained, licensed compatibly, pinned in the lockfile.

## Data and compatibility
- Migrations are reversible or have a documented rollback, and are safe on a large table (no long locks).
- Deletes and overwrites are intentional and scoped (a \`WHERE\` clause, an ID filter).
- Public API, CLI flags, config keys, events, and stored formats stay backwards compatible, or the break is called out.

## Tests
- New behaviour has a test that fails without the change.
- Bug fixes include a regression test for the reported case.
- Tests assert outcomes, not implementation details; no sleeps, real network calls, or order dependence.

## Performance
- No queries or network calls inside loops (N+1).
- Large collections are paginated or streamed; no unbounded reads into memory.
- Work on hot paths (render, request handlers) is not repeated unnecessarily.

## Readability
- Names say what things are; a reader can follow the change without the PR description.
- No dead code, commented-out blocks, or debug logging left behind.

## Grading
| Severity | Use when | Merge? |
| :--- | :--- | :--- |
| BLOCKER | Wrong behaviour, data loss, security hole, broken build or test | No |
| SHOULD-FIX | Likely bug, missing test for new behaviour, a problem the next change will hit | Fix now or file a ticket the author agrees to |
| NIT | Style or naming with no runtime effect | Author's choice |

## Finding format
\`\`\`
[SEVERITY] path/to/file.ts:42 - what is wrong
Why: the concrete failure (input -> wrong result).
Fix: the smallest change that resolves it (code or exact steps).
\`\`\`
`;

export const DEBUGGING_PLAYBOOK = `# Debugging Playbook

Use the section that matches the symptom. Every technique ends with evidence: a log line, a failing test, or a measured number.

## Fails every time
1. Write the smallest failing test or command; paste its exact output.
2. Read the stack trace from the first frame in project code, not library code.
3. Bisect the input: halve it until the failure disappears; the last removed half holds the trigger.
4. If it used to work: \`git bisect start\`, \`git bisect bad\`, \`git bisect good <last-known-good>\`, then run the reproduction at each step (\`git bisect run <cmd>\` automates it).

## Flaky test or intermittent failure
1. Run it in a loop to measure the failure rate (e.g. 50 runs) before and after the fix.
2. Look for shared state between tests, real time or dates, random seeds, unordered collections, and network calls.
3. Run the single test in isolation and then with the full suite; a difference means test pollution.
4. Never add a retry or a longer timeout as the fix unless the cause is proven to be external latency.

## Works locally, fails in CI
1. Compare versions: runtime, package manager, lockfile, OS, timezone, locale.
2. Check for files that exist locally but are git-ignored or untracked.
3. Check environment variables the code reads; CI may be missing one or have a different value.
4. Reproduce in the CI image (the same container or a clean clone with a fresh install).

## Race condition or ordering bug
1. Write down the two operations that interleave and the shared resource they touch.
2. Force the bad order deterministically (a barrier, a delayed promise, a breakpoint) to confirm it.
3. Fix with a single owner of the resource: a transaction, a lock, an idempotency key, or a queue.

## Memory leak or slowdown over time
1. Measure first: heap snapshots or RSS at intervals under the same workload.
2. Compare two snapshots and sort by retained size; follow the retainer chain to the root.
3. Usual causes: listeners or intervals never removed, caches without eviction, closures over large objects.

## Performance regression
1. Profile the slow path; do not guess. Record the baseline number.
2. Find the change that introduced it (\`git bisect\` with a timing threshold).
3. Fix the top item in the profile, re-measure, and report before and after numbers.

## Hypothesis log (keep it in your report)
| # | Hypothesis | Test | Result |
| :--- | :--- | :--- | :--- |
| 1 | Cache returns stale value after update | Assert cache key after write | Ruled out |
| 2 | Update and read race on the same row | Delay the read by 50ms | Confirmed |
`;

export const PR_TEMPLATE = `# Commit and Pull Request Reference

## Commit types (Conventional Commits)
| Type | Use for |
| :--- | :--- |
| feat | A new user-visible capability |
| fix | A bug fix |
| refactor | A code change that neither fixes a bug nor adds a feature |
| perf | A change that improves performance |
| test | Adding or correcting tests only |
| docs | Documentation only |
| build | Build system, dependencies, packaging |
| ci | CI configuration and scripts |
| chore | Maintenance that touches no source or test behaviour |

Subject: \`type(scope): imperative summary\`, at most 72 characters, no trailing period.
Breaking change: add \`!\` after the type (\`feat(api)!: ...\`) and a \`BREAKING CHANGE:\` footer that says what callers must change.

## Examples
\`\`\`
fix(auth): reject expired refresh tokens

Refresh tokens were checked for signature but not expiry, so a leaked
token stayed valid until rotation. Expired tokens now return 401.

Closes #412
\`\`\`

\`\`\`
refactor(billing): extract proration into its own module
\`\`\`

## Pull request description
\`\`\`markdown
## Summary
What changes and why, in two or three sentences. Link the issue.

## Changes
- Area 1: what changed
- Area 2: what changed

## How to test
1. Exact command or steps
2. Expected result

## Risk and rollback
What could break, who is affected, and how to revert (revert the PR, toggle a flag, run a down migration).

## Screenshots
Before and after, for UI changes only.
\`\`\`

## Checks before proposing
- The message describes the staged diff, not the whole branch history.
- Unrelated changes are split into separate commits.
- Tests named in "How to test" were actually run, or the description says they were not.
`;

export const REFACTORING_CATALOG = `# Refactoring Catalog

Pick the smallest refactoring that removes the smell. Run the tests after each one.

| Smell | Refactoring | Watch out for |
| :--- | :--- | :--- |
| Long function (does several things) | Extract function per step; name it after what it returns or does | Shared local variables; pass them explicitly |
| Deep nesting | Guard clauses with early return | Changing the order of side effects |
| Duplicated block in 3+ places | Extract a shared function | Two copies that only look alike but change for different reasons; leave those |
| Large file or module | Move related functions into a new module; re-export from the old path | Circular imports; update import paths in one step |
| Long parameter list | Introduce a parameter object | Optional parameters with defaults |
| Boolean flag parameter | Split into two functions | Callers passing variables, not literals |
| Primitive obsession (strings for IDs, money as float) | Introduce a small type or value object | Serialization at API and storage boundaries |
| Switch on type in many places | Replace with a lookup table or polymorphism | Exhaustiveness: add a compile-time check for missing cases |
| Temporary variable reused for different things | Split variable | Shadowing in closures |
| Dead code | Delete it | Dynamic references (reflection, string keys, public exports); search before deleting |
| Unclear name | Rename symbol across the codebase with the editor or compiler, not text replace | Names used in strings, configs, or serialized data |

## Safety rules
- Characterization test first when the code has no tests: capture current output for representative inputs, including odd cases.
- One refactoring per commit, so a reviewer can verify each by reading it.
- If a refactoring step needs more than about 50 changed lines, split it further.
- Stop and report if tests were already failing before you started.
`;

export const UPGRADE_CHECKLIST = `# Upgrade Checklist

## Pre-flight
- [ ] Current and target versions written down; every major version in between identified.
- [ ] Official migration guide and changelog read for each major version.
- [ ] Breaking changes that apply here listed, with a search for each affected API (file count per item).
- [ ] Baseline is green: install, build, type-check, lint, test. Pre-existing failures recorded.
- [ ] Runtime requirements checked (Node, Python, JDK, Go, browser targets) and peer dependency ranges.

## Per package or package group
1. Upgrade the group together (for example: framework + its CLI + its types).
2. Regenerate the lockfile with the project's package manager.
3. Run the official codemod if one exists; review its diff before continuing.
4. Fix compile errors, then failing tests, then new warnings, in that order.
5. Commit the group alone with a message naming old and new versions.

## Verification
- [ ] Clean install from the lockfile succeeds.
- [ ] Build, type-check, lint, and the full test suite pass.
- [ ] App starts and the main user flows work (smoke run).
- [ ] Behaviour changes from the release notes that tests do not cover are listed for manual checking.
- [ ] Bundle size or startup time compared for frontend and CLI upgrades.

## Rollback plan
- Each package group is a separate commit, so it can be reverted alone.
- Database or storage format changes have a down migration or a backup step.
- Feature flags guard behaviour changes that cannot be reverted quickly.

## Report
| Package | From | To | Codemod | Manual fixes | Follow-ups |
| :--- | :--- | :--- | :--- | :--- | :--- |
`;
