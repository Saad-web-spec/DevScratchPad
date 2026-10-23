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
/**
 * More topics for the H2-only outlines (msmarco-3), so missing-input examples come from more kinds of work than the
 * 50 topics above. Kept clear of the gold set's topics (grant applications, allergy-safe meals, podcast notes,
 * apartment hunting, flaky tests, API rate limits, tax receipts) so the gold score stays an outside measure.
 */
export const H2_TOPICS: readonly string[] = [
  "plan a community garden's planting calendar from soil tests and member requests",
  "choose a wedding venue from quotes, guest numbers and travel times",
  "compare electricity tariffs from a year of meter readings",
  "plan a school field trip with permission slips, transport and a risk check",
  "review a lease renewal offer against market prices and the current contract",
  "write a museum exhibit label set from curator notes and object records",
  "plan a volunteer rota from availability forms and shift needs",
  "compare home insurance quotes against an inventory of belongings",
  "build a reading list for a book club from member votes and library stock",
  "plan a road trip with charging stops for an electric car",
  "check a conference talk proposal against the call for papers",
  "prepare a used bike listing from photos, specs and recent sale prices",
  "plan a kitchen renovation from measurements, quotes and a budget",
  "compare childcare options from fees, hours and inspection reports",
  "write a newsletter from team updates and event dates",
  "plan a hiking route from trail reports, weather and fitness levels",
  "translate a product manual and check terminology against a glossary",
  "audit a website's cookie banner against the privacy policy",
  "review a translation memory export for inconsistent terms",
  "triage support tickets by urgency and product area",
  "write a changelog for a mobile app release from merged tickets",
  "check a Terraform plan against the team's tagging and cost rules",
  "review a Dockerfile for image size and security problems",
  "map a legacy cron schedule to a new job scheduler",
  "check a data warehouse model against the metric definitions",
  "review feature-flag usage and list flags safe to remove",
  "write load-test scenarios from production traffic summaries",
  "check an OpenAPI spec against the server's route handlers",
  "plan the rollout of a database index across shards",
  "review log retention settings against the compliance policy",
];

/** Shapes for the H2-only outlines: steps that read two or three earlier steps, where a cut input leaves others behind. */
export const H2_OUTLINE_SHAPES: readonly string[] = [
  "a planner, 3 parallel workers that each produce a different piece, a checker that reads all three, then a writer that reads the checker and two of the workers",
  "5 to 6 steps where every step after the first two reads two or three earlier steps",
  "2 independent gathering steps, a step that combines them, a checker that reads all three, then a writer",
  "a worker that returns a JSON object with named keys, two steps that each read it and a second earlier step, then a step that reads both",
];

export const OUTLINE_SHAPES: readonly string[] = [
  "3 to 4 steps in a line, ending with a checker and a writer",
  "a planner that splits the work into 3 parallel workers, then a checker, then a writer",
  "a step that returns a JSON list, a step that repeats for each entry of that list, then a checker",
  "5 to 7 steps with two checkers at different points",
  "a worker that returns a JSON object with named keys that two later steps each read part of",
  "2 parallel research steps that both feed one checker that hands on the checked work",
];
