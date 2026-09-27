import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PromptCraft Studio — In-Browser MoE Generative Prompt Compiler',
  description:
    'High-craft client-side prompt compiler targeting Midjourney v6.1, Flux.1, Runway Gen-3, Sora, and Kling 2.0. Powered by Sparse MoE routing and in-browser WebGPU neural execution.',
  icons: {
    icon: '/promptcraft-fox-clean.png',
    shortcut: '/promptcraft-fox-clean.png',
    apple: '/promptcraft-fox-clean.png',
  },
};

export default function PromptCraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily:
          "'Google Sans', 'Google Sans Text', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      }}
      className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-orange-600 selection:text-white"
    >
      {children}
    </div>
  );
}
