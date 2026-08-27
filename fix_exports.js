const fs = require("fs");
const path = require("path");

const fixes = {
  "TimestampConverterTool.tsx": "input",
  "HashGeneratorTool.tsx": "JSON.stringify(hashes, null, 2) || input",
  "HmacGeneratorTool.tsx": "hmac || input",
  "CidrCalculatorTool.tsx": "result ? JSON.stringify(result, null, 2) : input",
  "RegexTesterTool.tsx": "testString || pattern",
  "MarkdownPreviewerTool.tsx": "input",
};

const toolsDir = path.join(__dirname, "src/components/tools");

for (const [file, replacement] of Object.entries(fixes)) {
  const filePath = path.join(toolsDir, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, "utf-8");
  
  content = content.replace(
    /code={output \|\| input}/g,
    `code={${replacement}}`
  );

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Fixed ${file}`);
}
