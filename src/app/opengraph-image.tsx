import { ImageResponse } from 'next/og'

export const alt = 'DevScratchpad — Free Offline Developer Tools & AI Skill Studio (13 Formats, 5-Layer Agent Suite, 28 Tools)'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          padding: '48px 56px',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12 2L14.8 8.6L22 9.2L16.6 14.1L18.2 21.2L12 17.5L5.8 21.2L7.4 14.1L2 9.2L9.2 8.6L12 2Z" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
                DevScratchpad
              </div>
              <div style={{ display: 'flex', fontSize: 13, fontWeight: 600, color: '#3B82F6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                devscratchpad.tech
              </div>
            </div>
          </div>

          {/* Offline Privacy Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: 9999,
              padding: '8px 20px',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#22c55e',
                marginRight: 10,
                display: 'flex',
              }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: 14,
                fontWeight: 700,
                color: '#60A5FA',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              100% Client-Side • Zero Server Transmission
            </div>
          </div>
        </div>

        {/* Center Main Feature Showcase */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 48,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            Free Offline Developer Workbench
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 48,
              fontWeight: 800,
              color: '#3B82F6',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: 14,
            }}
          >
            & Universal AI Skill Studio
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 21,
              fontWeight: 400,
              color: '#a1a1aa',
              lineHeight: 1.4,
              maxWidth: 980,
            }}
          >
            Privacy-first toolkit for modern engineering teams. Generate 5-layer AI agent suites, convert rules across 13 formats, and use 28 offline developer tools.
          </div>
        </div>

        {/* 3 Pillar Cards in a Row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
          }}
        >
          {/* Card 1: 13 AI Formats */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(24, 24, 27, 0.75)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: 16,
              padding: '16px 20px',
              marginRight: 16,
            }}
          >
            <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              13 AI Agent Formats
            </div>
            <div style={{ display: 'flex', fontSize: 17, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
              Cursor .mdc & Claude SKILL.md
            </div>
            <div style={{ display: 'flex', fontSize: 13, color: '#a1a1aa', lineHeight: 1.3 }}>
              CLAUDE.md, AGENTS.md, MCP, Windsurf, Copilot, Gemini & OpenAI
            </div>
          </div>

          {/* Card 2: 5-Layer AI Agent Suite */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(24, 24, 27, 0.75)',
              border: '1px solid #27272a',
              borderRadius: 16,
              padding: '16px 20px',
              marginRight: 16,
            }}
          >
            <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: '#d4d4d8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              5-Layer Agent Suite
            </div>
            <div style={{ display: 'flex', fontSize: 17, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
              Context Shields & Specs
            </div>
            <div style={{ display: 'flex', fontSize: 13, color: '#a1a1aa', lineHeight: 1.3 }}>
              .cursorignore, .claudeignore, llms.txt, ARCHITECTURE.md & rules
            </div>
          </div>

          {/* Card 3: 28 Tools & CLI */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(24, 24, 27, 0.75)',
              border: '1px solid #27272a',
              borderRadius: 16,
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: '#d4d4d8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              28 Tools • 5 Categories
            </div>
            <div style={{ display: 'flex', fontSize: 17, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
              CLI: npx devscratchpad
            </div>
            <div style={{ display: 'flex', fontSize: 13, color: '#a1a1aa', lineHeight: 1.3 }}>
              Formatters, converters, crypto, JWT decoders & blog guides
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
