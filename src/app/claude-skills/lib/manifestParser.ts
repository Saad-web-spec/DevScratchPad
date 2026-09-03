/**
 * Manifest Ingestion Engine
 * Parses dependencies and package metadata from popular project manifests:
 * - package.json (Node/JS/TS)
 * - pyproject.toml & requirements.txt (Python)
 * - Cargo.toml (Rust)
 * - go.mod (Go)
 */

export interface ParsedManifestResult {
  detected: boolean;
  filename?: string;
  framework?: string;
  language?: string;
  styling?: string;
  database?: string;
  suggestedRole?: string;
  suggestedSkillName?: string;
  summary: string[];
}

export function parseProjectManifest(filename: string, content: string): ParsedManifestResult {
  const lowerName = filename.toLowerCase();
  const summary: string[] = [];

  // 1. Node / JavaScript / TypeScript package.json
  if (lowerName.includes("package.json") || content.includes('"dependencies"') || content.includes('"devDependencies"')) {
    try {
      const pkg = JSON.parse(content);
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      const depNames = Object.keys(allDeps).map((d) => d.toLowerCase());
      let framework = "React (Vite)";
      let language = "JavaScript";
      let styling = "CSS Modules";
      let database = "None / Irrelevant";

      // Language
      if (depNames.some((d) => d.includes("typescript")) || pkg.devDependencies?.typescript) {
        language = "TypeScript 5.x";
        summary.push("TypeScript detected");
      }

      // Framework
      if (depNames.includes("next")) {
        framework = "Next.js 15 (App Router)";
        summary.push("Next.js App Router detected");
      } else if (depNames.includes("nuxt") || depNames.includes("vue")) {
        framework = "Nuxt / Vue 3";
        summary.push("Vue/Nuxt detected");
      } else if (depNames.includes("@sveltejs/kit") || depNames.includes("svelte")) {
        framework = "SvelteKit";
        summary.push("SvelteKit detected");
      } else if (depNames.includes("astro")) {
        framework = "Astro";
        summary.push("Astro detected");
      } else if (depNames.includes("@nestjs/core")) {
        framework = "NestJS";
        summary.push("NestJS detected");
      } else if (depNames.includes("express")) {
        framework = "Express.js API";
        summary.push("Express API detected");
      } else if (depNames.includes("react")) {
        framework = "React 19 (Vite / SPA)";
        summary.push("React detected");
      }

      // Styling
      if (depNames.some((d) => d.includes("tailwindcss"))) {
        styling = "Tailwind CSS v4";
        summary.push("Tailwind CSS detected");
      } else if (depNames.some((d) => d.includes("styled-components") || d.includes("@emotion/react"))) {
        styling = "CSS-in-JS (Styled)";
        summary.push("CSS-in-JS detected");
      }

      // Database / ORM
      if (depNames.includes("@prisma/client") || depNames.includes("prisma")) {
        database = "PostgreSQL / Prisma";
        summary.push("Prisma ORM detected");
      } else if (depNames.includes("drizzle-orm")) {
        database = "PostgreSQL / Drizzle ORM";
        summary.push("Drizzle ORM detected");
      } else if (depNames.includes("@supabase/supabase-js")) {
        database = "Supabase / PostgreSQL";
        summary.push("Supabase detected");
      } else if (depNames.includes("mongoose") || depNames.includes("mongodb")) {
        database = "MongoDB / Mongoose";
        summary.push("MongoDB detected");
      }

      const projectName = pkg.name ? pkg.name.replace(/[^a-zA-Z0-9_-]/g, "-") : undefined;

      return {
        detected: true,
        filename: "package.json",
        framework,
        language,
        styling,
        database,
        suggestedRole: `Senior ${framework} & ${language} Engineer`,
        suggestedSkillName: projectName ? `${projectName}-architect` : undefined,
        summary,
      };
    } catch {
      // Fall through to regex if JSON was slightly invalid
    }
  }

  // 2. Python pyproject.toml / requirements.txt
  if (lowerName.includes("pyproject") || lowerName.includes("requirements") || content.includes("fastapi") || content.includes("django")) {
    const lowerContent = content.toLowerCase();
    let framework = "Python Service";
    let database = "None / In-Memory";

    if (lowerContent.includes("fastapi")) {
      framework = "FastAPI";
      summary.push("FastAPI detected");
    } else if (lowerContent.includes("django")) {
      framework = "Django";
      summary.push("Django detected");
    } else if (lowerContent.includes("flask")) {
      framework = "Flask";
      summary.push("Flask detected");
    }

    if (lowerContent.includes("sqlalchemy")) {
      database = "PostgreSQL / SQLAlchemy";
      summary.push("SQLAlchemy detected");
    } else if (lowerContent.includes("tortoise")) {
      database = "PostgreSQL / Tortoise ORM";
      summary.push("Tortoise ORM detected");
    } else if (lowerContent.includes("pymongo")) {
      database = "MongoDB / PyMongo";
      summary.push("PyMongo detected");
    }

    return {
      detected: true,
      filename: lowerName.includes("pyproject") ? "pyproject.toml" : "requirements.txt",
      framework,
      language: "Python 3.12+",
      styling: "None / API Service",
      database,
      suggestedRole: `Senior ${framework} & Systems Architect`,
      summary,
    };
  }

  // 3. Rust Cargo.toml
  if (lowerName.includes("cargo.toml") || content.includes("[package]") || content.includes("[dependencies]")) {
    const lowerContent = content.toLowerCase();
    let framework = "Rust Async (Tokio)";
    if (lowerContent.includes("axum")) framework = "Axum Web Framework";
    else if (lowerContent.includes("actix")) framework = "Actix Web";

    let database = "None / Embedded";
    if (lowerContent.includes("sqlx")) database = "PostgreSQL / SQLx";
    else if (lowerContent.includes("diesel")) database = "PostgreSQL / Diesel";

    summary.push("Rust crate manifest detected");

    return {
      detected: true,
      filename: "Cargo.toml",
      framework,
      language: "Rust",
      styling: "None / Native Backend",
      database,
      suggestedRole: "Senior Rust Systems & Concurrency Engineer",
      summary,
    };
  }

  // 4. Go go.mod
  if (lowerName.includes("go.mod") || content.includes("module ") || content.includes("go 1.")) {
    const lowerContent = content.toLowerCase();
    let framework = "Go Standard Library";
    if (lowerContent.includes("gin-gonic")) framework = "Gin Web Framework";
    else if (lowerContent.includes("gofiber")) framework = "Fiber Framework";
    else if (lowerContent.includes("echo")) framework = "Echo Framework";

    let database = "None / In-Memory";
    if (lowerContent.includes("gorm")) database = "PostgreSQL / GORM";

    summary.push("Go module manifest detected");

    return {
      detected: true,
      filename: "go.mod",
      framework,
      language: "Go",
      styling: "None / Microservice",
      database,
      suggestedRole: "Senior Go Distributed Systems Architect",
      summary,
    };
  }

  return {
    detected: false,
    summary: ["Unrecognized manifest format. Please upload package.json, pyproject.toml, Cargo.toml, or go.mod."],
  };
}
