const fs = require("fs");
const path = require("path");

const toolsDir = path.join(__dirname, "src/components/tools");
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith(".tsx"));

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  let content = fs.readFileSync(filePath, "utf-8");
  
  if (content.includes("<EmbedButton") && content.includes("data={{")) {
    content = content.replace(
      /(<EmbedButton.*?data=\{)(.*?)( \/>)/g,
      (match, p1, p2, p3) => {
        if (p2.startsWith("{") && !p2.endsWith("}")) {
          return `${p1}${p2}}${p3}`;
        }
        return match;
      }
    );
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Fixed ${file}`);
  }
}
