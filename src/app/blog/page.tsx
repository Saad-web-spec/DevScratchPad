import type { Metadata } from"next";
import Link from"next/link";
import { ArrowRight, BookOpen } from"lucide-react";
import { BLOG_POSTS } from"@/lib/blog/posts";

const SITE_URL ="https://www.devscratchpad.tech";

export const metadata: Metadata = {
 title:"Developer Blog — Guides, Tutorials & Cheat Sheets",
 description:"Read the latest developer guides, tutorials, and cheat sheets on DevScratchpad. Cron expressions, JWT decoding, cURL conversion and more.",
 keywords: ["developer blog","programming tutorials","developer guides","cheat sheets","DevScratchpad blog"],
 openGraph: {
 title:"Developer Blog — Guides, Tutorials & Cheat Sheets | DevScratchpad",
 description:"Read the latest developer guides, tutorials, and cheat sheets on DevScratchpad.",
 url: `${SITE_URL}/blog`,
 type:"website",
 siteName:"DevScratchpad",
 },
 twitter: {
 card:"summary_large_image",
 title:"Developer Blog — Guides, Tutorials & Cheat Sheets | DevScratchpad",
 description:"Read the latest developer guides, tutorials, and cheat sheets on DevScratchpad.",
 },
 alternates: {
 canonical: `${SITE_URL}/blog`,
 },
};

export default function BlogIndex() {
 const jsonLd = {
"@context":"https://schema.org",
"@type":"Blog",
"name":"DevScratchpad Blog",
"url": `${SITE_URL}/blog`,
"description":"Guides, Tutorials & Cheat Sheets for developers.",
"blogPost": BLOG_POSTS.map((post) => ({
"@type":"BlogPosting",
"headline": post.title,
"description": post.seoDescription,
"datePublished": post.publishedAt,
"dateModified": post.updatedAt,
"url": `${SITE_URL}/blog/${post.slug}`,
"author": {
"@type":"Organization",
"name":"DevScratchpad"
 }
 }))
 };

 return (
 <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-16 overflow-y-auto">
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
 />
 <div className="mb-10">
 <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
 <BookOpen className="w-8 h-8 text-blue-500"/>
 Developer Blog
 </h1>
 <p className="mt-4 text-zinc-600 text-base max-w-2xl">
 Guides, tutorials, and cheat sheets designed to help you build better software.
 </p>
 </div>

 <div className="grid grid-cols-1 gap-6">
 {BLOG_POSTS.map((post) => (
 <Link href={`/blog/${post.slug}`} key={post.slug} className="group flex flex-col p-6 bg-zinc-50 ] border border-zinc-200 ] rounded-xl hover:bg-zinc-100 :bg-white transition-all duration-200">
 <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-blue-500 transition-colors mb-2">
 {post.title}
 </h2>
 <p className="text-zinc-600 text-sm mb-4 line-clamp-2">
 {post.description}
 </p>
 <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-200">
 <time className="text-xs text-zinc-500 font-medium">
 {new Date(post.publishedAt).toLocaleDateString("en-US", {
 year:"numeric",
 month:"long",
 day:"numeric",
 })}
 </time>
 <div className="flex items-center text-sm font-medium text-blue-500">
 Read Article
 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"/>
 </div>
 </div>
 </Link>
 ))}
 </div>
 </div>
 );
}
