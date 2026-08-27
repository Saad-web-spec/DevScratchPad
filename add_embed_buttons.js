const fs = require("fs");
const path = require("path");

const toolsDir = path.join(__dirname, "src/components/tools");
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith(".tsx"));

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  let content = fs.readFileSync(filePath, "utf-8");
  
  if (content.includes("EmbedButton")) continue;

  if (content.includes("ShareButton")) {
    content = content.replace(
      /import { ShareButton } from "@\/components\/ShareButton";/,
      `import { ShareButton } from "@/components/ShareButton";\nimport { EmbedButton } from "@/components/EmbedButton";`
    );

    content = content.replace(
      /(<ShareButton.*?toolSlug="([^"]+)".*?data=\{([^}]+)\}.*?(\/>|>.*?<\/ShareButton>))/,
      (match, fullTag, toolSlug, dataProp) => {
        return `<EmbedButton toolSlug="${toolSlug}" data={${dataProp}} />\n          ${fullTag}`;
      }
    );

    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated ${file}`);
  }
}
