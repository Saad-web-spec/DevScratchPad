export type BlogCategory =
  | "DevOps & Cloud"
  | "Security & Cryptography"
  | "API & Automation"
  | "Data & Serialization"
  | "Web & Frontend";

export type BlogDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type BlogType = "guide" | "cheat-sheet" | "cookbook";

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface InteractivePreset {
  toolSlug: string;
  title: string;
  initialInput: string;
  inputLabel: string;
  outputLabel: string;
  explanation: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  seoDescription: string;
  publishedAt: string;
  updatedAt: string;
  category: BlogCategory;
  type: BlogType;
  difficulty: BlogDifficulty;
  readTime: string;
  tags: string[];
  relatedToolSlug: string;
  relatedGuideSlugs?: string[];
  faqs?: BlogFaq[];
  interactivePreset?: InteractivePreset;
  content: string;
}

export interface LearningTrack {
  id: string;
  title: string;
  category: BlogCategory;
  description: string;
  badge: string;
  iconName: string;
  estimatedTime: string;
  level: BlogDifficulty;
  guideSlugs: string[];
}

export interface QuickCheatItem {
  id: string;
  title: string;
  syntax: string;
  description: string;
  category: string;
  toolSlug?: string;
}
