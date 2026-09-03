const sharp = require('sharp');
const fs = require('fs');

async function createOgImage() {
  const width = 1200;
  const height = 630;

  // 1. Main DevScratchpad App Logo (Circular White Badge with </> symbol)
  const iconRaw = await sharp('src/app/icon.png').resize(64, 64).png().toBuffer();
  
  // 2. Claude Asterisk Icon (transparent background)
  const claudeIcon = await sharp('public/claude-icon.png').resize(42, 42, { fit: 'contain' }).png().toBuffer();
  
  // 3. Cursor Cube Icon
  const cursorIcon = await sharp('public/cursor-icon.png').resize(42, 42, { fit: 'contain' }).png().toBuffer();
  
  // 4. AI Skill Studio Folder Icon
  const skillIcon = await sharp('public/ai-skill-icon.png').resize(42, 42, { fit: 'contain' }).png().toBuffer();

  const mainIconB64 = iconRaw.toString('base64');
  const claudeIconB64 = claudeIcon.toString('base64');
  const cursorIconB64 = cursorIcon.toString('base64');
  const skillIconB64 = skillIcon.toString('base64');

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Ambient Glow -->
      <radialGradient id="glow" cx="50%" cy="18%" r="62%">
        <stop offset="0%" stop-color="#ea580c" stop-opacity="0.22" />
        <stop offset="60%" stop-color="#09090b" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#09090b" stop-opacity="1" />
      </radialGradient>

      <!-- Card Background -->
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#18181b" />
        <stop offset="100%" stop-color="#111113" />
      </linearGradient>

      <!-- Clip for circular main icon -->
      <clipPath id="circleClip">
        <circle cx="32" cy="32" r="32" />
      </clipPath>
    </defs>

    <!-- Deep Background -->
    <rect width="100%" height="100%" fill="#09090b" />
    <rect width="100%" height="100%" fill="url(#glow)" />

    <!-- Outer Card Border -->
    <rect x="28" y="28" width="1144" height="574" rx="28" fill="none" stroke="#27272a" stroke-width="1.5" />

    <!-- Top Header Branding: Logo + DevScratchpad in a clean unified pill -->
    <g transform="translate(600, 75)">
      <!-- Main Circular Icon -->
      <g transform="translate(-32, 0)">
        <circle cx="32" cy="32" r="34" fill="#ffffff" />
        <g clip-path="url(#circleClip)">
          <image href="data:image/png;base64,${mainIconB64}" x="0" y="0" width="64" height="64" />
        </g>
      </g>

      <!-- DevScratchpad Brand Pill (Positioned cleanly below icon with no overlap) -->
      <g transform="translate(0, 100)">
        <rect x="-165" y="-16" width="330" height="32" rx="16" fill="#18181b" stroke="#3f3f46" stroke-width="1" />
        <circle cx="-135" cy="0" r="4.5" fill="#10b981" />
        <text x="-120" y="5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#f97316" letter-spacing="1.5">DEVSCRAТCHPAD</text>
        <text x="35" y="5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="#a1a1aa">• 100% Client-Side</text>
      </g>
    </g>

    <!-- Main Title: AI Skill Studio -->
    <text x="600" y="272" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="800" fill="#ffffff" letter-spacing="-1.5">AI Skill Studio</text>

    <!-- Subtitle / Value Proposition -->
    <text x="600" y="322" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#d4d4d8">Production-Grade AI Rules for Claude Code, Cursor &amp; Agents</text>

    <!-- 3 Cards Row Featuring ACTUAL ICONS (Claude Code, Cursor, Claude CLAUDE.md) -->
    
    <!-- Card 1: Claude Code SKILL.md -->
    <g transform="translate(130, 362)">
      <rect width="286" height="88" rx="16" fill="url(#cardGrad)" stroke="#27272a" stroke-width="1.5" />
      <image href="data:image/png;base64,${skillIconB64}" x="20" y="23" width="42" height="42" />
      <text x="74" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="700" fill="#ffffff">SKILL.md</text>
      <text x="74" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#ea580c">Claude Code Agent Skill</text>
    </g>

    <!-- Card 2: Cursor .mdc / .cursorrules -->
    <g transform="translate(457, 362)">
      <rect width="286" height="88" rx="16" fill="url(#cardGrad)" stroke="#27272a" stroke-width="1.5" />
      <image href="data:image/png;base64,${cursorIconB64}" x="20" y="23" width="42" height="42" />
      <text x="74" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="700" fill="#ffffff">.cursorrules</text>
      <text x="74" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#60a5fa">Cursor .mdc Rule Engine</text>
    </g>

    <!-- Card 3: Claude CLAUDE.md -->
    <g transform="translate(784, 362)">
      <rect width="286" height="88" rx="16" fill="url(#cardGrad)" stroke="#27272a" stroke-width="1.5" />
      <image href="data:image/png;base64,${claudeIconB64}" x="20" y="23" width="42" height="42" />
      <text x="74" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="700" fill="#ffffff">CLAUDE.md</text>
      <text x="74" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#fbbf24">Anthropic Project Spec</text>
    </g>

    <!-- Bottom Footer Row -->
    <line x1="120" y1="490" x2="1080" y2="490" stroke="#27272a" stroke-width="1" />
    
    <g transform="translate(600, 538)" text-anchor="middle">
      <text font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="22" font-weight="700" fill="#f97316">devscratchpad.tech/ai-skill-studio</text>
      <text y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#71717a">Zero API Keys • 100% Offline Privacy • Instant Browser Generator</text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile('public/og-ai-skill-studio.png');
  
  console.log('Successfully generated public/og-ai-skill-studio.png with actual icons!');
}

createOgImage().catch(console.error);
