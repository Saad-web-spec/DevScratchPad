const fs = require('fs');
const file = 'src/app/claude-skills/ClaudeSkillsClient.tsx';
let content = fs.readFileSync(file, 'utf8');
if (!content.includes('import Image from')) {
  content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport Image from \"next/image\";');
}
content = content.replace(/<img\s+src="([^"]+)"([^>]*?)>/g, (match, src, rest) => {
  let width = 24; let height = 24;
  if(match.includes('ai-skill-icon.png') && match.includes('w-5')) { width=24; height=20; }
  else if (match.includes('w-3.5')) { width=14; height=14; }
  else if (match.includes('w-3')) { width=12; height=12; }
  else if (match.includes('w-4')) { width=16; height=16; }
  let priority = match.includes('ai-skill-icon.png') && match.includes('w-5') ? ' priority' : '';
  return `<Image src="${src}" width={${width}} height={${height}}${priority} ${rest} />`;
});
fs.writeFileSync(file, content);

