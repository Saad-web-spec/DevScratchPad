import { ImageResponse } from 'next/og'

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
 alignItems: 'center',
 justifyContent: 'center',
 backgroundColor: '#09090B',
 fontFamily: 'sans-serif',
 }}
 >
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
 <div style={{ fontSize: 80, color: 'white', fontWeight: 'bold', marginBottom: 20 }}>
 DevScratchpad
 </div>
 <div style={{ fontSize: 40, color: '#A1A1AA', marginBottom: 20 }}>
 19+ Free Online Developer Tools
 </div>
 <div style={{ fontSize: 32, color: '#3B82F6', display: 'flex' }}>
 100% Client-Side • Zero Server Transmission
 </div>
 </div>
 </div>
 ),
 { ...size }
 )
}
