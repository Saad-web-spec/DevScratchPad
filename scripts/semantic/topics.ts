/**
 * Workflow topics the local text model drafts outlines for (round 1), so the training data covers more
 * than our 14 starters: everyday tasks people bring to a chat, and code tasks for Claude Code.
 */
export const EVERYDAY_TOPICS: readonly string[] = [
  "research whether a supplement is worth taking and fact-check the claims",
  "plan a weekend trip with a fixed budget",
  "compare three laptops for a student",
  "review a cover letter against a job posting",
  "plan a week of family dinners within a grocery budget",
  "summarise a long article and check the summary against it",
  "prepare for a job interview at a named company",
  "compare mobile phone plans for a family of four",
  "write a wedding speech and check its length and tone",
  "check a news story's claims against primary sources",
  "plan a birthday party for twenty children",
  "compare two used cars from their listings",
  "turn lecture notes into a study guide and quiz",
  "check a rental contract for risky clauses",
  "plan a marathon training schedule for a beginner",
  "write a product description for an online shop",
  "compare health insurance options from their summaries",
  "research the best time to visit a city and what to book",
  "review a scholarship essay against its rubric",
  "draft a complaint letter to an airline and check it is polite and complete",
  "build a monthly household budget from a list of expenses",
  "translate a menu and check the translation of each dish",
  "compare online courses for learning data analysis",
  "plan a house move with a timeline and checklist",
  "write a short story for children and check reading level",
  "research a medical condition in plain language with sources",
  "compare gym memberships near an address",
  "plan a small business launch on social media",
  "check a recipe's quantities after scaling it for twelve people",
  "prepare a presentation outline and check every claim has a source",
];

export const CODE_TOPICS: readonly string[] = [
  "review a pull request for security and test coverage",
  "add a feature behind a flag and loop until the tests pass",
  "triage a production bug from a stack trace and logs",
  "write release notes from the commits since the last tag",
  "audit dependencies for known vulnerabilities and licences",
  "migrate a REST endpoint to a new API version",
  "write unit tests for an untested module",
  "review a database migration before it runs in production",
  "document a public API from its source code",
  "find and remove dead code in a package",
  "write an incident postmortem from a timeline",
  "refactor a large function and prove behaviour is unchanged",
  "review the accessibility of a web page",
  "set up CI for a repository and check it passes",
  "check a SQL query for performance problems",
  "upgrade a framework to a new major version",
  "review infrastructure-as-code changes for risky settings",
  "triage failing tests one by one",
  "write a data cleaning pipeline for a CSV export",
  "review an onboarding guide against the actual setup steps",
];

/** How each outline request varies, so outlines differ in shape and not only in topic. */
export const OUTLINE_SHAPES: readonly string[] = [
  "3 to 4 steps in a line, ending with a checker and a writer",
  "a planner that splits the work into 3 parallel workers, then a checker, then a writer",
  "a step that returns a JSON list, a step that repeats for each entry of that list, then a checker",
  "5 to 7 steps with two checkers at different points",
  "a worker that returns a JSON object with named keys that two later steps each read part of",
  "2 parallel research steps that both feed one checker that hands on the checked work",
];
