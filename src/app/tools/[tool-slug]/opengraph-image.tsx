import { ImageResponse } from 'next/og'
import { getToolMeta, TOOL_SLUGS } from "@/lib/tools/registry"

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateStaticParams() {
  return TOOL_SLUGS.map((slug) => ({ "tool-slug": slug }))
}

export default async function Image({ params }: { params: Promise<{ "tool-slug": string }> }) {
  const { "tool-slug": slug } = await params
  const tool = getToolMeta(slug)
  
  if (!tool) {
    return new Response('Not Found', { status: 404 })
  }

  const isLong = tool.name.length > 35

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
          {/* DevScratchpad Brand Marker */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12 2L14.8 8.6L22 9.2L16.6 14.1L18.2 21.2L12 17.5L5.8 21.2L7.4 14.1L2 9.2L9.2 8.6L12 2Z" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
                DevScratchpad
              </div>
              <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: '#ea580c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                28 Offline Developer Tools
              </div>
            </div>
          </div>

          {/* Offline Privacy Pill */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(234, 88, 12, 0.12)',
              border: '1px solid rgba(234, 88, 12, 0.35)',
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
                fontSize: 13,
                fontWeight: 700,
                color: '#f97316',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              100% Client-Side • Zero Server Transmission
            </div>
          </div>
        </div>

        {/* Main Tool Content Container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: 'rgba(24, 24, 27, 0.8)',
            border: '1px solid rgba(234, 88, 12, 0.25)',
            borderRadius: 20,
            padding: '36px 44px',
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 13,
              fontWeight: 700,
              color: '#f97316',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {tool.category}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: isLong ? 38 : 46,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            {tool.name}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 21,
              fontWeight: 400,
              color: '#a1a1aa',
              lineHeight: 1.45,
              maxWidth: 980,
              marginBottom: 22,
            }}
          >
            {tool.description}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(39, 39, 42, 0.7)',
                border: '1px solid #3f3f46',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: '#e4e4e7',
                marginRight: 12,
              }}
            >
              Zero Server Latency
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(39, 39, 42, 0.7)',
                border: '1px solid #3f3f46',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: '#e4e4e7',
                marginRight: 12,
              }}
            >
              In-Browser Sandbox
            </div>
            {tool.relatedBlogSlug ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(234, 88, 12, 0.12)',
                  border: '1px solid rgba(234, 88, 12, 0.35)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fdba74',
                }}
              >
                Bidirectional Technical Guide
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Bar: Value Props & Site URL */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 14,
              fontWeight: 600,
              color: '#71717a',
            }}
          >
            Part of DevScratchpad Free Offline Developer Workbench
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 16,
              fontWeight: 700,
              color: '#ea580c',
              letterSpacing: '0.03em',
            }}
          >
            devscratchpad.tech/tools/{slug}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
