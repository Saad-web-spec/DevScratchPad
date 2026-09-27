import type { Metadata } from 'next';
import { PromptCraftHeader } from '../components/PromptCraftHeader';
import { MinimalImageStudio } from '../components/MinimalImageStudio';

export const metadata: Metadata = {
  title: 'Image Studio — Midjourney v6.1 & Flux.1 Prompt Compiler | PromptCraft',
  description:
    'Dedicated optical prompt studio for Midjourney v6.1 and Flux.1. IDE-aligned layout, dynamic monospace synthesis, and zero server transmission.',
  alternates: {
    canonical: 'https://www.devscratchpad.tech/promptcraft/images',
  },
};

const jsonLdGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://www.devscratchpad.tech/promptcraft/images#webapp',
      name: 'PromptCraft Image Studio',
      description:
        'Client-side generative image prompt compiler for Midjourney v6.1 and Flux.1 with optical physics and zero server transmission.',
      url: 'https://www.devscratchpad.tech/promptcraft/images',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Any (Modern Web Browser)',
    },
  ],
};

export default function PromptCraftImagesPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#E8E8E8] flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdGraph).replace(/</g, '\\u003c'),
        }}
      />
      <PromptCraftHeader activeTab="image" />
      <MinimalImageStudio />
    </div>
  );
}
