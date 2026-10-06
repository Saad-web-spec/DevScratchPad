/**
 * GitHub Repository Live Ingestion & Analysis Engine
 * 100% Client-Side execution (ADR-001) - Zero Server Transmission.
 * Directly calls GitHub REST API v3 and raw.githubusercontent.com from the user's browser.
 */

import { ParsedManifestResult, parseProjectManifest } from "./manifestParser";

export interface GitHubRepoRef {
  owner: string;
  repo: string;
  branch?: string;
}

export interface GitHubRepoMetadata {
  owner: string;
  repo: string;
  fullName: string;
  description: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  topics: string[];
  license?: string;
  isPrivate: boolean;
  htmlUrl: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
}

export interface GitHubCommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface IngestedRepoAnalysis {
  metadata: GitHubRepoMetadata;
  manifest?: ParsedManifestResult;
  manifestPath?: string;
  packageManager: "pnpm" | "npm" | "yarn" | "bun" | "cargo" | "poetry" | "pip" | "go" | "unknown";
  detectedTechStack: string[];
  scripts: Record<string, string>;
  keyDirectories: string[];
  suggestedGlobs: string[];
  commitConvention?: "conventional" | "ticket-prefix" | "freeform";
  recentCommits: GitHubCommitSummary[];
  synthesizedDirectives: string[];
  synthesizedProcedures: string[];
  synthesizedRole: string;
  suggestedSkillName: string;
  suggestedTitle: string;
}

/**
 * Parses user input strings into owner and repo.
 * Handles:
 * - "owner/repo"
 * - "https://github.com/owner/repo"
 * - "https://github.com/owner/repo/tree/branch"
 * - "git@github.com:owner/repo.git"
 */
export function parseGitHubRepoInput(input: string): GitHubRepoRef | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // 1. SSH format: git@github.com:owner/repo.git
  const sshMatch = trimmed.match(/^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(\.git)?$/i);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // 2. HTTPS URL: https://github.com/owner/repo(/tree/branch)?
  const urlMatch = trimmed.match(/^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\/tree\/([a-zA-Z0-9_.-]+)|\/)?(?:\.git)?$/i);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2],
      branch: urlMatch[3] || undefined,
    };
  }

  // 3. Short format: owner/repo
  const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }

  return null;
}

/**
 * Fetches repository metadata from GitHub API
 */
export async function fetchGitHubRepoMetadata(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubRepoMetadata> {
  const headers: Record<string, string> = {};
  if (token && token.trim().length > 0) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      headers,
    });
  } catch (err: unknown) {
    const isNetworkErr = err instanceof TypeError && String(err.message).toLowerCase().includes("fetch");
    if (isNetworkErr) {
      throw new Error(
        "Could not connect to GitHub API from your browser. This typically occurs due to GitHub unauthenticated rate limits (60/hr) or an adblocker. Enter a Personal Access Token below to authenticate directly."
      );
    }
    throw err;
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" not found or private. Provide a GitHub token if private.`);
    }
    if (res.status === 403 || res.status === 429) {
      throw new Error("GitHub API rate limit reached (60/hr). Please provide a Personal Access Token (PAT) for 5,000 req/hr.");
    }
    throw new Error(`GitHub API returned error (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  return {
    owner: data.owner?.login || owner,
    repo: data.name || repo,
    fullName: data.full_name || `${owner}/${repo}`,
    description: data.description || "",
    defaultBranch: data.default_branch || "main",
    stars: data.stargazers_count || 0,
    forks: data.forks_count || 0,
    openIssues: data.open_issues_count || 0,
    language: data.language || "TypeScript",
    topics: Array.isArray(data.topics) ? data.topics : [],
    license: data.license?.spdx_id || data.license?.name,
    isPrivate: Boolean(data.private),
    htmlUrl: data.html_url || `https://github.com/${owner}/${repo}`,
  };
}

/**
 * Fetches the repository recursive file tree in 1 single call
 */
export async function fetchGitHubRepoTree(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<GitHubTreeItem[]> {
  const headers: Record<string, string> = {};
  if (token && token.trim().length > 0) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { headers }
    );

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data.tree)) {
      return [];
    }
    return data.tree as GitHubTreeItem[];
  } catch {
    return [];
  }
}

/**
 * Fetches raw file content (tries raw.githubusercontent.com first to conserve API rate limits)
 */
export async function fetchGitHubRawContent(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  token?: string
): Promise<string> {
  // If private or token provided, use API raw endpoint
  if (token && token.trim().length > 0) {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}?ref=${encodeURIComponent(branch)}`,
      {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      }
    );
    if (!res.ok) throw new Error(`Could not load ${filePath} (${res.status})`);
    return await res.text();
  }

  // If public, raw.githubusercontent.com has no low API rate limit and sends Access-Control-Allow-Origin: *
  const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${filePath}`;
  const res = await fetch(rawUrl);
  if (!res.ok) {
    throw new Error(`Could not load ${filePath} from raw (${res.status})`);
  }
  return await res.text();
}

/**
 * Fetches recent commit messages to detect commit conventions
 */
export async function fetchGitHubRecentCommits(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubCommitSummary[]> {
  const headers: Record<string, string> = {};
  if (token && token.trim().length > 0) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=10`,
      { headers }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((c: any) => ({
      sha: c.sha ? c.sha.slice(0, 7) : "",
      message: c.commit?.message?.split("\n")[0] || "",
      author: c.commit?.author?.name || c.author?.login || "Engineer",
      date: c.commit?.author?.date || "",
    }));
  } catch {
    return [];
  }
}

/**
 * High-Level Analyzer: Coordinates metadata, file tree inspection,
 * manifest parsing, and rule synthesis into an authentic project profile.
 */
export async function analyzeGitHubRepository(
  input: string,
  token?: string,
  onProgress?: (status: string) => void
): Promise<IngestedRepoAnalysis> {
  const parsedRef = parseGitHubRepoInput(input);
  if (!parsedRef) {
    throw new Error('Invalid GitHub repository format. Use "owner/repo" or "https://github.com/owner/repo".');
  }

  onProgress?.(`Inspecting repository metadata for ${parsedRef.owner}/${parsedRef.repo}...`);
  let metadata: GitHubRepoMetadata;
  let branch = parsedRef.branch || "main";
  let tree: GitHubTreeItem[] = [];
  let directManifestContent: string | null = null;
  let directManifestName: string | null = null;

  try {
    metadata = await fetchGitHubRepoMetadata(parsedRef.owner, parsedRef.repo, token);
    branch = parsedRef.branch || metadata.defaultBranch;
    onProgress?.(`Mapping repository structure on branch "${branch}"...`);
    tree = await fetchGitHubRepoTree(parsedRef.owner, parsedRef.repo, branch, token);
  } catch (apiErr: unknown) {
    // If a token was explicitly provided, re-throw the error
    if (token && token.trim().length > 0) {
      throw apiErr;
    }

    // Fallback: raw.githubusercontent.com is not rate-limited and has full CORS
    onProgress?.("Inspecting public repository manifests directly...");
    const branches = parsedRef.branch ? [parsedRef.branch] : ["main", "master"];
    const manifests = ["package.json", "Cargo.toml", "pyproject.toml", "go.mod", "requirements.txt"];

    for (const b of branches) {
      for (const m of manifests) {
        try {
          const content = await fetchGitHubRawContent(parsedRef.owner, parsedRef.repo, b, m);
          if (content && content.trim().length > 0) {
            directManifestContent = content;
            directManifestName = m;
            branch = b;
            break;
          }
        } catch {
          // continue checking
        }
      }
      if (directManifestContent) break;
    }

    if (!directManifestContent || !directManifestName) {
      throw apiErr;
    }

    metadata = {
      owner: parsedRef.owner,
      repo: parsedRef.repo,
      fullName: `${parsedRef.owner}/${parsedRef.repo}`,
      description: "Direct client-side inspected repository",
      defaultBranch: branch,
      stars: 0,
      forks: 0,
      openIssues: 0,
      language:
        directManifestName === "Cargo.toml"
          ? "Rust"
          : directManifestName === "go.mod"
          ? "Go"
          : directManifestName === "pyproject.toml" || directManifestName === "requirements.txt"
          ? "Python"
          : "TypeScript",
      topics: [],
      isPrivate: false,
      htmlUrl: `https://github.com/${parsedRef.owner}/${parsedRef.repo}`,
    };
  }

  // 1. Detect Package Manager
  const filePaths = new Set(tree.map((t) => t.path));
  if (directManifestName) {
    filePaths.add(directManifestName);
  }

  let packageManager: IngestedRepoAnalysis["packageManager"] = "npm";
  if (filePaths.has("pnpm-lock.yaml")) packageManager = "pnpm";
  else if (filePaths.has("yarn.lock")) packageManager = "yarn";
  else if (filePaths.has("bun.lockb") || filePaths.has("bun.lock")) packageManager = "bun";
  else if (filePaths.has("Cargo.lock") || filePaths.has("Cargo.toml")) packageManager = "cargo";
  else if (filePaths.has("poetry.lock")) packageManager = "poetry";
  else if (filePaths.has("Pipfile.lock") || filePaths.has("requirements.txt")) packageManager = "pip";
  else if (filePaths.has("go.sum") || filePaths.has("go.mod")) packageManager = "go";

  // 2. Fetch primary manifest
  let manifestPath: string | undefined = directManifestName || undefined;
  if (!manifestPath) {
    const manifestCandidates = [
      "package.json",
      "Cargo.toml",
      "pyproject.toml",
      "requirements.txt",
      "go.mod",
    ];

    for (const cand of manifestCandidates) {
      if (filePaths.has(cand)) {
        manifestPath = cand;
        break;
      }
    }
  }

  let parsedManifest: ParsedManifestResult | undefined;
  const scripts: Record<string, string> = {};

  if (manifestPath) {
    onProgress?.(`Reading project manifest "${manifestPath}"...`);
    try {
      const content =
        directManifestContent && directManifestName === manifestPath
          ? directManifestContent
          : await fetchGitHubRawContent(parsedRef.owner, parsedRef.repo, branch, manifestPath, token);
      parsedManifest = parseProjectManifest(manifestPath, content);

      // Extract scripts from package.json if present
      if (manifestPath === "package.json") {
        try {
          const pkg = JSON.parse(content);
          if (pkg.scripts && typeof pkg.scripts === "object") {
            Object.assign(scripts, pkg.scripts);
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn("Could not parse manifest", err);
    }
  }

  // 3. Extract key directories & Globs
  const keyDirs = new Set<string>();
  const suggestedGlobs = new Set<string>();

  for (const item of tree) {
    const parts = item.path.split("/");
    if (parts.length > 1) {
      const rootDir = parts[0];
      if (!rootDir.startsWith(".") && rootDir !== "node_modules" && rootDir !== "dist" && rootDir !== "build") {
        keyDirs.add(rootDir);
      }
    }
  }

  // Tailor globs based on common conventions
  if (filePaths.has("src/app") || tree.some((t) => t.path.startsWith("src/app/"))) {
    suggestedGlobs.add("src/app/**/*.{ts,tsx}");
  } else if (filePaths.has("app") || tree.some((t) => t.path.startsWith("app/"))) {
    suggestedGlobs.add("app/**/*.{ts,tsx}");
  }
  if (filePaths.has("src/components") || tree.some((t) => t.path.startsWith("src/components/"))) {
    suggestedGlobs.add("src/components/**/*.{ts,tsx}");
  }
  if (filePaths.has("api") || tree.some((t) => t.path.startsWith("api/"))) {
    suggestedGlobs.add("api/**/*.{py,ts,go}");
  }
  if (suggestedGlobs.size === 0) {
    suggestedGlobs.add(metadata.language === "Python" ? "**/*.py" : metadata.language === "Rust" ? "src/**/*.rs" : "src/**/*.{ts,tsx,js,jsx}");
  }

  // 4. Fetch recent commits to analyze conventions
  onProgress?.("Inspecting commit history & team conventions...");
  const recentCommits = await fetchGitHubRecentCommits(parsedRef.owner, parsedRef.repo, token);

  let commitConvention: IngestedRepoAnalysis["commitConvention"] = "freeform";
  const conventionalMatches = recentCommits.filter((c) =>
    /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_-]+\))?:/i.test(c.message)
  );
  if (conventionalMatches.length >= 3) {
    commitConvention = "conventional";
  }

  // 5. Synthesize Procedures based on detected scripts & stack
  const synthesizedProcedures: string[] = [
    `1. Codebase Orientation: Inspect surrounding patterns before modifying files.`,
  ];

  if (scripts.build) {
    synthesizedProcedures.push(`2. Build Verification: Always verify compilation with \`${packageManager} run build\`.`);
  } else if (packageManager === "cargo") {
    synthesizedProcedures.push(`2. Build Verification: Verify compilation with \`cargo build\`.`);
  }

  if (scripts.test) {
    synthesizedProcedures.push(`3. Test Suite: Run unit & integration tests via \`${packageManager} test\`.`);
  } else if (packageManager === "cargo") {
    synthesizedProcedures.push(`3. Test Suite: Run tests with \`cargo test\`.`);
  }

  if (scripts.lint) {
    synthesizedProcedures.push(`4. Static Analysis: Run linter verification with \`${packageManager} run lint\`.`);
  }

  // 6. Synthesize Directives & Guardrails
  const synthesizedDirectives: string[] = [
    `- Zero Server Leakage: Never expose secrets, API tokens, or .env files into commits or logs.`,
    `- Package Management: Use ${packageManager} exclusively (do not mix lockfiles).`,
    `- Surgical Diffs: Keep edits focused on requested changes; do not rewrite unrelated files.`,
  ];

  if (commitConvention === "conventional") {
    synthesizedDirectives.push(`- Commit Style: Adhere strictly to Conventional Commits (e.g. feat:, fix:, chore:).`);
  }

  // 7. Synthesize Role & Title
  const tech = parsedManifest?.framework || metadata.language || "Full-Stack";
  const synthesizedRole = `Senior ${tech} Engineer & System Architect`;
  const safeName = metadata.repo.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const suggestedTitle = `${metadata.repo} Engineering Guidelines`;

  const detectedTechStack = [
    metadata.language,
    parsedManifest?.framework,
    parsedManifest?.styling,
    parsedManifest?.database,
    (packageManager as string) !== "unknown" ? packageManager : "",
  ].filter((item): item is string => Boolean(item) && item !== "None / Irrelevant" && item !== "None" && item !== "unknown");

  return {
    metadata,
    manifest: parsedManifest,
    manifestPath,
    packageManager,
    detectedTechStack,
    scripts,
    keyDirectories: Array.from(keyDirs).slice(0, 10),
    suggestedGlobs: Array.from(suggestedGlobs),
    commitConvention,
    recentCommits,
    synthesizedDirectives,
    synthesizedProcedures,
    synthesizedRole,
    suggestedSkillName: safeName,
    suggestedTitle,
  };
}
