import { ImageResponse } from 'next/og'
import { getToolMeta, TOOL_SLUGS } from"@/lib/tools/registry"

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateStaticParams() {
 return TOOL_SLUGS.map((slug) => ({"tool-slug": slug }))
}

export default async function Image({ params }: { params: Promise<{"tool-slug": string }> }) {
 const {"tool-slug": slug } = await params
 const tool = getToolMeta(slug)
 
 if (!tool) {
 return new Response('Not Found', { status: 404 })
 }

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
 }}
 >
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
 <div style={{ fontSize: 64, color: 'white', fontWeight: 'bold', marginBottom: 20 }}>
 {tool.name}
 </div>
 <div style={{ fontSize: 32, color: '#A1A1AA' }}>
 Free • Private • Client-Side
 </div>
 <div style={{ marginTop: 60, fontSize: 24, color: '#3B82F6', display: 'flex' }}>
 devscratchpad.tech
 </div>
 <div style={{ marginTop: 20, fontSize: 24, color: '#D4D4D8', display: 'flex' }}>
 DevScratchpad
 </div>
 </div>
 </div>
 ),
 { ...size }
 )
}
