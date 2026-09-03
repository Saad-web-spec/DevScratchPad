const sharp = require('sharp');
const fs = require('fs');

async function buildTerracottaOg() {
  const width = 1200;
  const height = 630;

  // 1. Claude icon with warm color tint matching user design
  const claudeIcon = await sharp('public/claude-icon.png')
    .resize(46, 46, { fit: 'contain' })
    .png()
    .toBuffer();

  // 2. Cursor icon clipped into smooth rounded corners
  const cursorIcon = await sharp('public/cursor-icon.png')
    .resize(50, 50, { fit: 'contain' })
    .png()
    .toBuffer();

  const claudeIconB64 = claudeIcon.toString('base64');
  const cursorIconB64 = cursorIcon.toString('base64');

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Deep Rich Terracotta Gradient (Exact match to user's uploaded card) -->
      <linearGradient id="terracottaGrad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#C95B28" />
        <stop offset="100%" stop-color="#B64B1E" />
      </linearGradient>

      <!-- Inset Pill Card Color -->
      <linearGradient id="cardInsetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#A54015" />
        <stop offset="100%" stop-color="#933610" />
      </linearGradient>

      <!-- Drop Shadow for White Capsule -->
      <filter id="capsuleShadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.25" />
      </filter>

      <!-- Drop Shadow for 3 Cards -->
      <filter id="cardShadow" x="-15%" y="-15%" width="130%" height="135%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#551C05" flood-opacity="0.35" />
      </filter>

      <!-- Rounded clip for Cursor icon -->
      <clipPath id="cursorClip">
        <rect width="50" height="50" rx="12" />
      </clipPath>
    </defs>

    <!-- Warm Canvas Background (Matches user image border) -->
    <rect width="100%" height="100%" fill="#F5EFEB" />

    <!-- Main Terracotta Rounded Banner with Crisp White Border -->
    <rect x="26" y="22" width="1148" height="586" rx="36" fill="url(#terracottaGrad)" stroke="#FFFFFF" stroke-width="4.5" />

    <!-- Top Arch Collar Behind Capsule (Curved cutout collar) -->
    <path d="M 436,22 C 438,78 458,142 490,146 L 710,146 C 742,142 762,78 764,22 Z" fill="#9C3A12" />

    <!-- Top White Rounded Pill Capsule with </> Icon -->
    <g transform="translate(600, 78)" filter="url(#capsuleShadow)">
      <!-- Pure White Capsule -->
      <rect x="-145" y="-72" width="290" height="138" rx="69" fill="#FFFFFF" stroke="#9C3A12" stroke-width="5" />
      
      <!-- </> Code Symbol (Exact thick rounded stroke in dark bronze #2B1206) -->
      <!-- Left Angle < -->
      <path d="M -54,-7 L -82,9 L -54,25" fill="none" stroke="#2B1206" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Middle Slash / -->
      <line x1="-8" y1="-28" x2="-22" y2="46" stroke="#2B1206" stroke-width="11" stroke-linecap="round" />
      <!-- Right Angle > -->
      <path d="M 22,-7 L 50,9 L 22,25" fill="none" stroke="#2B1206" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- DevScratchpad Brand Pill (Below Capsule) -->
    <g transform="translate(600, 185)" text-anchor="middle">
      <rect x="-170" y="-15" width="340" height="30" rx="15" fill="#140A05" opacity="0.32" />
      <circle cx="-140" cy="0" r="4.5" fill="#10B981" />
      <text x="-124" y="5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-weight="800" fill="#FFFFFF" letter-spacing="1.2">DEVSCRAТCHPAD</text>
      <text x="35" y="5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#FFDFC4">• 100% Client-Side Privacy</text>
    </g>

    <!-- Main Title: AI Skill Studio -->
    <text x="600" y="272" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="900" fill="#140904" letter-spacing="-1.5">AI Skill Studio</text>

    <!-- Subtitle / Value Proposition -->
    <text x="600" y="322" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="23.5" font-weight="600" fill="#241006">Production-Grade AI Skills for Claude Code, Cursor &amp; Agents</text>

    <!-- 3 Embossed / Inset Cards Row -->
    
    <!-- Card 1: SKILL.md -->
    <g transform="translate(95, 365)" filter="url(#cardShadow)">
      <rect width="310" height="96" rx="22" fill="url(#cardInsetGrad)" stroke="#782707" stroke-width="2.2" />
      <!-- Clean Smooth Folder Icon matching user image -->
      <g transform="translate(22, 26)">
        <path d="M 4,8 C 4,5 6,3 9,3 L 20,3 C 23,3 25,5 26,8 L 29,12 L 43,12 C 46,12 48,14 48,17 L 48,39 C 48,42 46,44 43,44 L 9,44 C 6,44 4,42 4,39 Z" fill="#E58A32" />
      </g>
      <text x="84" y="51" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="800" fill="#FFFFFF">SKILL.md</text>
      <text x="84" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#FED7AA">Claude Code Agent Skill</text>
    </g>

    <!-- Card 2: .cursorskills -->
    <g transform="translate(445, 365)" filter="url(#cardShadow)">
      <rect width="310" height="96" rx="22" fill="url(#cardInsetGrad)" stroke="#782707" stroke-width="2.2" />
      <g transform="translate(22, 23)" clip-path="url(#cursorClip)">
        <image href="data:image/png;base64,${cursorIconB64}" width="50" height="50" />
      </g>
      <text x="84" y="51" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="800" fill="#FFFFFF">.cursorskills</text>
      <text x="84" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#FED7AA">Cursor .mdc Skill Engine</text>
    </g>

    <!-- Card 3: CLAUDE.md -->
    <g transform="translate(795, 365)" filter="url(#cardShadow)">
      <rect width="310" height="96" rx="22" fill="url(#cardInsetGrad)" stroke="#782707" stroke-width="2.2" />
      <image href="data:image/png;base64,${claudeIconB64}" x="24" y="25" width="46" height="46" />
      <text x="84" y="51" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="800" fill="#FFFFFF">CLAUDE.md</text>
      <text x="84" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#FED7AA">Anthropic Project Spec</text>
    </g>

    <!-- Bottom Monospace Link -->
    <text x="600" y="534" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="21.5" font-weight="700" fill="#2B1206" letter-spacing="0.4">devscratchpad.tech/ai-skill-studio</text>
  </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile('public/og-ai-skill-studio.png');

  console.log('Successfully updated public/og-ai-skill-studio.png in exact requested style!');
}

buildTerracottaOg().catch(console.error);
