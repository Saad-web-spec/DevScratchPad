const sharp = require('sharp');

async function createLinkedInMockup() {
  const cardWidth = 840;
  const cardHeight = 650;

  const ogResized = await sharp('public/og-ai-skill-studio.png')
    .resize(800, 420, { fit: 'cover' })
    .png()
    .toBuffer();
  
  const ogB64 = ogResized.toString('base64');

  const svg = `
  <svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" xmlns="http://www.w3.org/2000/svg">
    <!-- LinkedIn Post Background -->
    <rect width="100%" height="100%" fill="#F1ECE6" rx="20" />

    <!-- Card Container -->
    <g transform="translate(20, 20)">
      <!-- Outer Card with Border -->
      <rect width="800" height="610" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Top Image Area with Rounded Top Corners -->
      <defs>
        <clipPath id="topRound">
          <rect width="800" height="420" rx="16" />
        </clipPath>
      </defs>
      <g clip-path="url(#topRound)">
        <image href="data:image/png;base64,${ogB64}" width="800" height="420" />
      </g>

      <!-- Bottom Metadata Section -->
      <rect y="420" width="800" height="190" fill="#FFFFFF" />
      <line x1="0" y1="420" x2="800" y2="420" stroke="#F1F5F9" stroke-width="1" />

      <!-- Domain -->
      <text x="28" y="456" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#64748B" letter-spacing="0.3">
        DEVSCRATCHPAD.TECH
      </text>

      <!-- Title -->
      <text x="28" y="492" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="800" fill="#0F172A">
        AI Skill Studio – Free SKILL.md, CLAUDE.md &amp; Cursor Skills
      </text>

      <!-- Description -->
      <text x="28" y="528" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="400" fill="#475569">
        Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md guidelines,
      </text>
      <text x="28" y="552" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="400" fill="#475569">
        and Cursor .mdc skills with 100% client-side privacy. Zero API keys required.
      </text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile('public/linkedin-preview-mockup.png');

  console.log('Updated public/linkedin-preview-mockup.png with terracotta theme!');
}

createLinkedInMockup().catch(console.error);
