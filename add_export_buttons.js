const fs = require("fs");
const path = require("path");

const toolsDir = path.join(__dirname, "src/components/tools");

const toolsMap = {
  "JwtDecoderTool.tsx": "json",
  "TimestampConverterTool.tsx": "plaintext",
  "CurlConverterTool.tsx": "bash",
  "XmlFormatterTool.tsx": "xml",
  "SqlFormatterTool.tsx": "sql",
  "Base64DecoderTool.tsx": "plaintext",
  "UrlEncoderTool.tsx": "plaintext",
  "HashGeneratorTool.tsx": "plaintext",
  "RegexTesterTool.tsx": "javascript",
  "JsonToTsTool.tsx": "typescript",
  "CronVisualizerTool.tsx": "plaintext",
  "YamlConverterTool.tsx": "yaml",
  "MinifierTool.tsx": "css",
  "GraphqlFormatterTool.tsx": "graphql",
  "MarkdownPreviewerTool.tsx": "markdown",
  "HmacGeneratorTool.tsx": "plaintext",
  "CidrCalculatorTool.tsx": "json"
};

for (const [file, lang] of Object.entries(toolsMap)) {
  const filePath = path.join(toolsDir, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, "utf-8");
  
  // Skip if already added
  if (content.includes("ExportImageButton")) continue;

  // Add import
  content = content.replace(
    /import { ShareButton } from "@\/components\/ShareButton";/,
    `import { ShareButton } from "@/components/ShareButton";\nimport { ExportImageButton } from "@/components/ExportImageButton";`
  );

  // Add component next to ShareButton
  // ShareButton might look like <ShareButton toolSlug="..." data={...} />
  content = content.replace(
    /(<ShareButton.*?(\/>|>.*?<\/ShareButton>))/,
    `<ExportImageButton code={output || input} language="${lang}" />\n          $1`
  );

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Updated ${file}`);
}
