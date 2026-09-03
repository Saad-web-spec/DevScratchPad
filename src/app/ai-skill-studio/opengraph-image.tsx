import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'AI Skill Studio - Free SKILL.md, CLAUDE.md & Cursor Rules Generator'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090B',
          fontFamily: 'sans-serif',
          position: 'relative',
          padding: '60px 40px',
        }}
      >
        {/* Subtle orange ambient glow in background */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            width: '600px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, rgba(9, 9, 11, 0) 70%)',
            display: 'flex',
          }}
        />

        {/* Top Eyebrow Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(249, 115, 22, 0.12)',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            borderRadius: '9999px',
            padding: '8px 24px',
            marginBottom: '28px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#FB923C',
              letterSpacing: '1px',
            }}
          >
            100% CLIENT-SIDE • ZERO API KEYS REQUIRED
          </span>
        </div>

        {/* Main Product Title */}
        <div
          style={{
            fontSize: '76px',
            color: '#FFFFFF',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            marginBottom: '16px',
            textAlign: 'center',
            display: 'flex',
          }}
        >
          AI Skill Studio
        </div>

        {/* Subtitle / Value Proposition */}
        <div
          style={{
            fontSize: '32px',
            color: '#D4D4D8',
            fontWeight: 500,
            marginBottom: '36px',
            textAlign: 'center',
            display: 'flex',
          }}
        >
          Production AI Rules for Claude Code, Cursor & Agents
        </div>

        {/* Format Tags Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '54px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              borderRadius: '12px',
              padding: '10px 20px',
              color: '#F4F4F5',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            SKILL.md
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              borderRadius: '12px',
              padding: '10px 20px',
              color: '#F4F4F5',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            .cursorrules (.mdc)
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              borderRadius: '12px',
              padding: '10px 20px',
              color: '#F4F4F5',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            CLAUDE.md
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              borderRadius: '12px',
              padding: '10px 20px',
              color: '#F4F4F5',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            AGENTS.md
          </div>
        </div>

        {/* Bottom Bar Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '920px',
            borderTop: '1px solid #27272A',
            paddingTop: '24px',
          }}
        >
          <div
            style={{
              fontSize: '22px',
              color: '#F97316',
              fontWeight: 700,
              display: 'flex',
            }}
          >
            devscratchpad.tech/ai-skill-studio
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#A1A1AA',
              display: 'flex',
            }}
          >
            DevScratchpad • 100% Offline & Private
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
