import type { Metadata } from 'next';
import { PromptCraftHeader } from '../components/PromptCraftHeader';
import { MinimalVideoStudio } from '../components/MinimalVideoStudio';

export const metadata: Metadata = {
  title: 'Video Studio — Sora, Runway Gen-3 & Kling Prompt Compiler | PromptCraft',
  description:
    'Dedicated temporal video prompt studio for OpenAI Sora, Runway Gen-3, and Kling 2.0. Flat horizontal timeline track, chunked kinematics, and zero server transmission.',
  alternates: {
    canonical: 'https://www.devscratchpad.tech/promptcraft/video',
  },
};

const jsonLdGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://www.devscratchpad.tech/promptcraft/video#webapp',
      name: 'PromptCraft Video Studio',
      description:
        'Client-side generative video prompt compiler for Sora, Runway Gen-3, and Kling 2.0 with temporal timelines and zero server transmission.',
      url: 'https://www.devscratchpad.tech/promptcraft/video',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (Modern Web Browser)',
    },
  ],
};

export default function PromptCraftVideoPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#E8E8E8] flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdGraph).replace(/</g, '\\u003c'),
        }}
      />
      <PromptCraftHeader activeTab="video" />
      <MinimalVideoStudio />
    </div>
  );
}
