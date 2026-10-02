/**
 * Client-Side Local Filesystem Project Picker & Manifest Inspector
 * 100% Client-Side execution (ADR-001) - Zero Server Transmission.
 * Uses the Web File System Access API (showDirectoryPicker) in Chromium browsers
 * to analyze local repositories offline without uploading any code.
 */

export interface LocalProjectAnalysis {
  directoryName: string;
  suggestedMcpArg: string;
  detectedTechStack: string[];
  packageManager: "pnpm" | "npm" | "yarn" | "bun" | "cargo" | "poetry" | "pip" | "go" | "unknown";
  scripts: {
    build?: string;
    test?: string;
    lint?: string;
    dev?: string;
    [key: string]: string | undefined;
  };
  topLevelDirectories: string[];
  framework: string;
  language: string;
  styling: string;
  database: string;
  synthesizedRole: string;
  synthesizedDirectives: string[];
  manifestFileName?: string;
  hasDocker: boolean;
  hasGit: boolean;
}

export interface DirectoryPickResult {
  name: string;
  suggestedArg: string;
  supported: boolean;
  analysis?: LocalProjectAnalysis;
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/**
 * Prompts user to pick a local project folder and inspects its manifests
 */
export async function pickAndInspectLocalDirectory(): Promise<DirectoryPickResult> {
  if (!isFileSystemAccessSupported()) {
    return {
      name: "",
      suggestedArg: "./",
      supported: false,
    };
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: "read",
    });

    const dirName = dirHandle.name || "project";
    const topLevelDirs: string[] = [];
    const files: Record<string, string> = {};

    let hasGit = false;
    let hasDocker = false;

    // Iterate through top-level directory entries
    for await (const [name, handle] of (dirHandle as any).entries()) {
      if (handle.kind === "directory") {
        if (name === ".git") hasGit = true;
        topLevelDirs.push(name);
      } else if (handle.kind === "file") {
        const lowerName = name.toLowerCase();
        if (lowerName === "docker-compose.yml" || lowerName === "compose.yaml" || lowerName === "dockerfile") {
          hasDocker = true;
        }

        // Read manifest files if found
        if (
          [
            "package.json",
            "cargo.toml",
            "pyproject.toml",
            "requirements.txt",
            "go.mod",
            "tsconfig.json",
            "docker-compose.yml",
            "compose.yaml",
          ].includes(lowerName)
        ) {
          try {
            const file = await handle.getFile();
            // Read max 256KB to keep memory light
            if (file.size < 256 * 1024) {
              const text = await file.text();
              files[name] = text;
            }
          } catch {
            // Permission or read error
          }
        }
      }
    }

    const analysis = analyzeLocalFiles(dirName, files, topLevelDirs, hasGit, hasDocker);

    return {
      name: dirName,
      suggestedArg: `./${dirName}`,
      supported: true,
      analysis,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Selection cancelled.");
    }
    throw new Error(err.message || "Failed to access local directory.");
  }
}

/**
 * Analyzes local directory manifests to synthesize project rules
 */
export function analyzeLocalFiles(
  dirName: string,
  files: Record<string, string>,
  topLevelDirs: string[],
  hasGit: boolean,
  hasDocker: boolean
): LocalProjectAnalysis {
  const techStack: string[] = [];
  const scripts: LocalProjectAnalysis["scripts"] = {};
  let packageManager: LocalProjectAnalysis["packageManager"] = "unknown";
  let framework = "None / Custom";
  let language = "TypeScript";
  let styling = "Tailwind CSS";
  let database = "None";
  let manifestFileName: string | undefined;

  // 1. JavaScript / TypeScript (package.json)
  const pkgJsonRaw = files["package.json"];
  if (pkgJsonRaw) {
    manifestFileName = "package.json";
    try {
      const pkg = JSON.parse(pkgJsonRaw);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      if (pkg.scripts) {
        if (pkg.scripts.build) scripts.build = pkg.scripts.build;
        if (pkg.scripts.test) scripts.test = pkg.scripts.test;
        if (pkg.scripts.lint) scripts.lint = pkg.scripts.lint;
        if (pkg.scripts.dev) scripts.dev = pkg.scripts.dev;
      }

      // Detect package manager from lockfiles or packageManager field
      if (pkg.packageManager) {
        if (pkg.packageManager.includes("pnpm")) packageManager = "pnpm";
        else if (pkg.packageManager.includes("yarn")) packageManager = "yarn";
        else if (pkg.packageManager.includes("bun")) packageManager = "bun";
        else packageManager = "npm";
      } else {
        packageManager = "npm";
      }

      // Framework detection
      if (allDeps["next"]) {
        framework = "Next.js (App Router)";
        techStack.push("Next.js");
      } else if (allDeps["nuxt"]) {
        framework = "Nuxt";
        techStack.push("Nuxt");
      } else if (allDeps["@remix-run/react"] || allDeps["@react-router/dev"]) {
        framework = "Remix / React Router";
        techStack.push("Remix");
      } else if (allDeps["react"]) {
        framework = "React";
        techStack.push("React");
      } else if (allDeps["vue"]) {
        framework = "Vue";
        techStack.push("Vue");
      } else if (allDeps["svelte"] || allDeps["@sveltejs/kit"]) {
        framework = "SvelteKit";
        techStack.push("Svelte");
      } else if (allDeps["express"] || allDeps["fastify"] || allDeps["hono"] || allDeps["nest"]) {
        framework = "Node.js API";
        techStack.push("Node.js");
      }

      // Language detection
      if (files["tsconfig.json"] || allDeps["typescript"]) {
        language = "TypeScript";
        techStack.push("TypeScript");
      } else {
        language = "JavaScript";
        techStack.push("JavaScript");
      }

      // Styling detection
      if (allDeps["tailwindcss"]) {
        styling = "Tailwind CSS";
        techStack.push("Tailwind CSS");
      } else if (allDeps["@vanilla-extract/css"]) {
        styling = "Vanilla Extract";
        techStack.push("Vanilla Extract");
      }

      // Database detection
      if (allDeps["@prisma/client"] || allDeps["prisma"]) {
        database = "Prisma ORM";
        techStack.push("Prisma");
      } else if (allDeps["drizzle-orm"]) {
        database = "Drizzle ORM";
        techStack.push("Drizzle");
      } else if (allDeps["pg"]) {
        database = "PostgreSQL (pg)";
        techStack.push("PostgreSQL");
      } else if (allDeps["better-sqlite3"]) {
        database = "SQLite";
        techStack.push("SQLite");
      }
    } catch {
      // invalid JSON
    }
  }

  // 2. Rust (Cargo.toml)
  const cargoRaw = files["Cargo.toml"] || files["cargo.toml"];
  if (cargoRaw && !pkgJsonRaw) {
    manifestFileName = "Cargo.toml";
    packageManager = "cargo";
    language = "Rust";
    framework = "Rust Native";
    techStack.push("Rust");

    if (cargoRaw.includes("actix-web")) techStack.push("Actix-web");
    if (cargoRaw.includes("axum")) techStack.push("Axum");
    if (cargoRaw.includes("tokio")) techStack.push("Tokio");

    scripts.build = "cargo build --release";
    scripts.test = "cargo test";
    scripts.lint = "cargo clippy";
    scripts.dev = "cargo run";
  }

  // 3. Python (pyproject.toml or requirements.txt)
  const pyprojectRaw = files["pyproject.toml"] || files["requirements.txt"];
  if (pyprojectRaw && !pkgJsonRaw && !cargoRaw) {
    manifestFileName = files["pyproject.toml"] ? "pyproject.toml" : "requirements.txt";
    packageManager = files["pyproject.toml"] ? "poetry" : "pip";
    language = "Python";
    techStack.push("Python");

    const content = pyprojectRaw.toLowerCase();
    if (content.includes("fastapi")) {
      framework = "FastAPI";
      techStack.push("FastAPI");
    } else if (content.includes("django")) {
      framework = "Django";
      techStack.push("Django");
    } else if (content.includes("flask")) {
      framework = "Flask";
      techStack.push("Flask");
    }

    scripts.test = "pytest";
    scripts.lint = "ruff check .";
  }

  // 4. Go (go.mod)
  const goModRaw = files["go.mod"];
  if (goModRaw && !pkgJsonRaw && !cargoRaw && !pyprojectRaw) {
    manifestFileName = "go.mod";
    packageManager = "go";
    language = "Go";
    techStack.push("Go");

    scripts.build = "go build ./...";
    scripts.test = "go test ./...";
    scripts.lint = "golangci-lint run";
  }

  if (hasDocker) {
    techStack.push("Docker");
  }

  // Synthesize role
  const synthesizedRole = `Senior ${language} & ${framework} Principal Engineer specializing in ${dirName}`;

  // Synthesize directives
  const synthesizedDirectives: string[] = [];
  if (packageManager && packageManager !== "unknown") {
    synthesizedDirectives.push(`Use ${packageManager} for all package installations and script executions`);
  }
  if (scripts.build) {
    synthesizedDirectives.push(`Verify code changes with \`${scripts.build}\``);
  }
  if (scripts.test) {
    synthesizedDirectives.push(`Execute test suite with \`${scripts.test}\``);
  }
  if (scripts.lint) {
    synthesizedDirectives.push(`Ensure zero lint warnings via \`${scripts.lint}\``);
  }
  if (hasDocker) {
    synthesizedDirectives.push("Project supports Docker containerization — run containerized commands when testing multi-service setups");
  }

  synthesizedDirectives.push("Maintain strict architectural discipline and document non-obvious design decisions");

  return {
    directoryName: dirName,
    suggestedMcpArg: `./${dirName}`,
    detectedTechStack: techStack,
    packageManager,
    scripts,
    topLevelDirectories: topLevelDirs,
    framework,
    language,
    styling,
    database,
    synthesizedRole,
    synthesizedDirectives,
    manifestFileName,
    hasDocker,
    hasGit,
  };
}

export const pickLocalDirectory = pickAndInspectLocalDirectory;

