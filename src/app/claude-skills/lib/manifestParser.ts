/**
 * Manifest Ingestion Engine
 * Hardened against prototype pollution vectors and enriched with expanded
 * dependency sniffing for modern testing frameworks, ORMs, and UI libraries.
 * Supported manifests:
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
  testing?: string;
  validation?: string;
  stateManagement?: string;
  suggestedRole?: string;
  suggestedSkillName?: string;
  summary: string[];
}

/**
 * Safely extracts safe own string keys from an arbitrary object,
 * blocking prototype pollution attempts (__proto__, constructor, prototype).
 */
function safeExtractKeys(obj: unknown): string[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return [];
  }

  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    if (
      key !== "__proto__" &&
      key !== "constructor" &&
      key !== "prototype" &&
      Object.prototype.hasOwnProperty.call(obj, key)
    ) {
      keys.push(key);
    }
  }
  return keys;
}

export function parseProjectManifest(filename: string, content: string): ParsedManifestResult {
  const lowerName = (filename || "").toLowerCase();
  const summary: string[] = [];

  // =========================================================================
  // 1. Node / JavaScript / TypeScript package.json
  // =========================================================================
  if (
    lowerName.includes("package.json") ||
    content.includes('"dependencies"') ||
    content.includes('"devDependencies"')
  ) {
    try {
      // Parse JSON safely
      const parsedRaw = JSON.parse(content);
      if (parsedRaw && typeof parsedRaw === "object" && !Array.isArray(parsedRaw)) {
        const prodDeps = safeExtractKeys(parsedRaw.dependencies);
        const devDeps = safeExtractKeys(parsedRaw.devDependencies);
        const peerDeps = safeExtractKeys(parsedRaw.peerDependencies);

        // Combined unique list of dependency names in lowercase
        const depNames = Array.from(
          new Set([...prodDeps, ...devDeps, ...peerDeps].map((d) => d.toLowerCase()))
        );

        let framework = "React (Vite)";
        let language = "JavaScript";
        let styling = "CSS Modules";
        let database = "None / Irrelevant";
        let testing: string | undefined;
        let validation: string | undefined;
        let stateManagement: string | undefined;

        // Language detection
        if (
          depNames.some((d) => d.includes("typescript")) ||
          (parsedRaw.devDependencies && Object.prototype.hasOwnProperty.call(parsedRaw.devDependencies, "typescript"))
        ) {
          language = "TypeScript 5.x";
          summary.push("TypeScript detected");
        }

        // Framework detection
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
        } else if (depNames.includes("remix") || depNames.includes("@remix-run/node")) {
          framework = "Remix";
          summary.push("Remix detected");
        } else if (depNames.includes("react")) {
          framework = "React 19 (Vite / SPA)";
          summary.push("React detected");
        }

        // Styling detection
        if (depNames.some((d) => d.includes("tailwindcss"))) {
          styling = "Tailwind CSS v4";
          summary.push("Tailwind CSS detected");
        } else if (depNames.some((d) => d.includes("styled-components") || d.includes("@emotion/react"))) {
          styling = "CSS-in-JS (Styled)";
          summary.push("CSS-in-JS detected");
        } else if (depNames.includes("@radix-ui/react-slot") || depNames.some((d) => d.startsWith("@radix-ui/"))) {
          styling = "Tailwind + Radix UI";
          summary.push("Radix UI primitives detected");
        }

        // Database / ORM detection
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
        } else if (depNames.includes("typeorm")) {
          database = "PostgreSQL / TypeORM";
          summary.push("TypeORM detected");
        } else if (depNames.includes("kysely")) {
          database = "PostgreSQL / Kysely";
          summary.push("Kysely query builder detected");
        }

        // Testing Framework detection
        if (depNames.includes("vitest")) {
          testing = "Vitest";
          summary.push("Vitest unit test suite detected");
        } else if (depNames.includes("jest")) {
          testing = "Jest";
          summary.push("Jest test runner detected");
        }
        if (depNames.includes("@playwright/test")) {
          summary.push("Playwright E2E testing detected");
        } else if (depNames.includes("cypress")) {
          summary.push("Cypress E2E testing detected");
        }

        // Validation & State
        if (depNames.includes("zod")) {
          validation = "Zod Schema Validation";
          summary.push("Zod schema validation detected");
        } else if (depNames.includes("valibot")) {
          validation = "Valibot";
          summary.push("Valibot schema validation detected");
        }

        if (depNames.includes("zustand")) {
          stateManagement = "Zustand";
          summary.push("Zustand state store detected");
        } else if (depNames.includes("@reduxjs/toolkit")) {
          stateManagement = "Redux Toolkit";
          summary.push("Redux Toolkit detected");
        }

        // Sanitize project name
        let projectName: string | undefined;
        if (typeof parsedRaw.name === "string" && parsedRaw.name.length < 64) {
          projectName = parsedRaw.name.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
        }

        return {
          detected: true,
          filename: "package.json",
          framework,
          language,
          styling,
          database,
          testing,
          validation,
          stateManagement,
          suggestedRole: `Senior ${framework} & ${language} Engineer`,
          suggestedSkillName: projectName ? `${projectName}-architect` : undefined,
          summary,
        };
      }
    } catch {
      // Fall through to regex if JSON was slightly invalid
    }
  }

  // =========================================================================
  // 2. Python pyproject.toml / requirements.txt
  // =========================================================================
  if (
    lowerName.includes("pyproject") ||
    lowerName.includes("requirements") ||
    content.includes("fastapi") ||
    content.includes("django") ||
    content.includes("[tool.poetry]")
  ) {
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

    if (lowerContent.includes("sqlalchemy") || lowerContent.includes("alembic")) {
      database = "PostgreSQL / SQLAlchemy";
      summary.push("SQLAlchemy & Alembic detected");
    } else if (lowerContent.includes("tortoise")) {
      database = "PostgreSQL / Tortoise ORM";
      summary.push("Tortoise ORM detected");
    } else if (lowerContent.includes("pymongo") || lowerContent.includes("motor")) {
      database = "MongoDB / PyMongo";
      summary.push("MongoDB (PyMongo/Motor) detected");
    }

    if (lowerContent.includes("pytest")) {
      summary.push("Pytest testing suite detected");
    }
    if (lowerContent.includes("pydantic")) {
      summary.push("Pydantic data models detected");
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

  // =========================================================================
  // 3. Rust Cargo.toml
  // =========================================================================
  if (
    lowerName.includes("cargo.toml") ||
    content.includes("[package]") ||
    content.includes("[dependencies]")
  ) {
    const lowerContent = content.toLowerCase();
    let framework = "Rust Async (Tokio)";
    if (lowerContent.includes("axum")) framework = "Axum Web Framework";
    else if (lowerContent.includes("actix")) framework = "Actix Web";

    let database = "None / Embedded";
    if (lowerContent.includes("sqlx")) {
      database = "PostgreSQL / SQLx";
      summary.push("SQLx async database client detected");
    } else if (lowerContent.includes("diesel")) {
      database = "PostgreSQL / Diesel";
      summary.push("Diesel ORM detected");
    } else if (lowerContent.includes("sea-orm")) {
      database = "PostgreSQL / SeaORM";
      summary.push("SeaORM async ORM detected");
    }

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

  // =========================================================================
  // 4. Go go.mod
  // =========================================================================
  if (
    lowerName.includes("go.mod") ||
    content.includes("module ") ||
    content.includes("go 1.")
  ) {
    const lowerContent = content.toLowerCase();
    let framework = "Go Standard Library";
    if (lowerContent.includes("gin-gonic")) framework = "Gin Web Framework";
    else if (lowerContent.includes("gofiber")) framework = "Fiber Framework";
    else if (lowerContent.includes("echo")) framework = "Echo Framework";

    let database = "None / In-Memory";
    if (lowerContent.includes("gorm")) {
      database = "PostgreSQL / GORM";
      summary.push("GORM ORM detected");
    } else if (lowerContent.includes("pgx")) {
      database = "PostgreSQL / pgx driver";
      summary.push("pgx PostgreSQL driver detected");
    }

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
