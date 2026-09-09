#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const schemaPath = path.join(ROOT_DIR, "schemas", "preset-schema.json");
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

if (!fs.existsSync(schemaPath)) {
  console.error("❌ Preset schema not found at", schemaPath);
  process.exit(1);
}

const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
const validate = ajv.compile(schema);

console.log("🔍 Running DevScratchpad Preset & Rule Quality Gate...\n");

let totalChecked = 0;
let totalPassed = 0;
let totalFailed = 0;

// Scan community-presets directory if it exists
const communityDir = path.join(ROOT_DIR, "community-presets");
const presetFiles = [];

if (fs.existsSync(communityDir)) {
  const files = fs.readdirSync(communityDir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    presetFiles.push(path.join(communityDir, f));
  }
}

// Helper: Basic rule quality heuristics
function evaluateRuleQuality(preset) {
  let score = 100;
  const issues = [];

  // Check 1: Description specificity
  if (!preset.description || preset.description.length < 20) {
    score -= 15;
    issues.push("Description is too short (< 20 chars).");
  }

  // Check 2: Negative guardrails
  const directives = preset.customDirectives || "";
  const negativeClauses = ["never", "do not", "banned", "avoid", "must not", "prohibited", "strictly forbidden"];
  const hasGuardrails = negativeClauses.some((clause) => directives.toLowerCase().includes(clause));
  if (!hasGuardrails) {
    score -= 20;
    issues.push("Missing negative guardrails (e.g. 'Never use X' or 'Banned: Y').");
  }

  // Check 3: Procedures depth
  const procedures = preset.procedures || "";
  if (!procedures.includes("1.") && !procedures.includes("- Step")) {
    score -= 15;
    issues.push("Procedures should be structured as numbered sequential steps.");
  }

  // Check 4: Anti-pattern code example
  if (!preset.exampleBad || preset.exampleBad.trim().length < 10) {
    score -= 10;
    issues.push("Missing exampleBad anti-pattern code snippet.");
  }

  // Check 5: Production code example
  if (!preset.exampleGood || preset.exampleGood.trim().length < 10) {
    score -= 10;
    issues.push("Missing exampleGood reference implementation code snippet.");
  }

  return { score: Math.max(0, score), issues };
}

// Validate each preset file
for (const filePath of presetFiles) {
  totalChecked++;
  const relativeName = path.relative(ROOT_DIR, filePath);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    const valid = validate(data);
    if (!valid) {
      console.error(`❌ [SCHEMA FAIL] ${relativeName}`);
      for (const err of validate.errors || []) {
        console.error(`   - ${err.instancePath || "/"} ${err.message}`);
      }
      totalFailed++;
      continue;
    }

    const { score, issues } = evaluateRuleQuality(data);
    if (score < 80) {
      console.error(`❌ [QUALITY FAIL] ${relativeName} — Quality Score: ${score}/100 (Threshold: 80)`);
      for (const issue of issues) {
        console.error(`   - ${issue}`);
      }
      totalFailed++;
      continue;
    }

    console.log(`✅ [PASS] ${relativeName} (Quality Score: ${score}/100)`);
    totalPassed++;
  } catch (err) {
    console.error(`❌ [PARSE ERROR] ${relativeName}: ${err.message}`);
    totalFailed++;
  }
}

console.log("\n----------------------------------------");
if (totalChecked === 0) {
  console.log("ℹ️  No community presets found in community-presets/ directory.");
  console.log("✅ Schema compilation and validator check PASSED cleanly.");
  process.exit(0);
} else if (totalFailed > 0) {
  console.error(`❌ Validation finished with ${totalFailed} failure(s) out of ${totalChecked} preset(s).`);
  process.exit(1);
} else {
  console.log(`🎉 All ${totalPassed} preset(s) passed schema and quality gates (Score >= 80)!`);
  process.exit(0);
}
