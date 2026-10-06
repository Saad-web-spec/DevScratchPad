import fs from "fs";
import path from "path";

const pluginPaths = [
  "C:\\Users\\User\\.gemini\\config\\plugins\\data-agent-kit-plugin\\skills",
  "C:\\Users\\User\\.gemini\\config\\plugins\\flutter\\skills",
  "C:\\Users\\User\\.gemini\\config\\plugins\\modern-web-guidance-plugin\\skills",
  "C:\\Users\\User\\.gemini\\antigravity\\builtin\\skills",
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\d4fe3def-47b9-44bc-ae7a-b0e6d795f4ee\\scratch\\awesome-claude-skills"
];

const results = [];

for (const p of pluginPaths) {
  if (fs.existsSync(p)) {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const skillFile = path.join(p, ent.name, "SKILL.md");
        if (fs.existsSync(skillFile)) {
          results.push({ name: ent.name, path: skillFile });
        }
      }
    }
  }
}

console.log(`Found ${results.length} local real SKILL.md files!`);
for (const r of results.slice(0, 15)) {
  console.log(`- ${r.name}`);
}
