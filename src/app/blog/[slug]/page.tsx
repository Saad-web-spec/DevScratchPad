import type { Metadata } from"next";
import { notFound } from"next/navigation";
import Link from"next/link";
import { ArrowLeft, ChevronRight, Wrench } from"lucide-react";
import { marked } from"marked";
import { getBlogPost, BLOG_SLUGS } from"@/lib/blog/posts";
import { getToolMeta } from"@/lib/tools/registry";

const SITE_URL ="https://www.devscratchpad.tech";

export async function generateStaticParams() {
 return BLOG_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
 params,
}: {
 params: Promise<{ slug: string }>;
}): Promise<Metadata> {
 const { slug } = await params;
 const post = getBlogPost(slug);

 if (!post) {
 return { title:"Post Not Found"};
 }

 return {
 title: post.seoTitle,
 description: post.seoDescription,
 keywords: [post.slug.split("-").join(","),"developer guide","tutorial","DevScratchpad"],
 openGraph: {
 title: `${post.seoTitle} | DevScratchpad`,
 description: post.seoDescription,
 url: `${SITE_URL}/blog/${slug}`,
 type:"article",
 publishedTime: post.publishedAt,
 modifiedTime: post.updatedAt,
 siteName:"DevScratchpad",
 },
 twitter: {
 card:"summary_large_image",
 title: `${post.seoTitle} | DevScratchpad`,
 description: post.seoDescription,
 },
 alternates: {
 canonical: `${SITE_URL}/blog/${slug}`,
 },
 };
}

export default async function BlogPostPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 const post = getBlogPost(slug);

 if (!post) {
 notFound();
 }

 const toolMeta = getToolMeta(post.relatedToolSlug);
 const htmlContent = await marked.parse(post.content);

 const jsonLd = {
"@context":"https://schema.org",
"@type":"BlogPosting",
"headline": post.title,
"description": post.seoDescription,
"datePublished": post.publishedAt,
"dateModified": post.updatedAt,
"author": {
"@type":"Organization",
"name":"DevScratchpad"
 },
"publisher": {
"@type":"Organization",
"name":"DevScratchpad",
"logo": {
"@type":"ImageObject",
"url": `${SITE_URL}/favicon.ico`
 }
 },
"mainEntityOfPage": {
"@type":"WebPage",
"@id": `${SITE_URL}/blog/${slug}`
 }
 };

 return (
 <div className="flex-1 w-full overflow-y-auto bg-white">
 <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
 />
 
 <Link
 href="/blog"
 className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 :text-zinc-100 transition-colors mb-8"
 >
 <ArrowLeft className="w-4 h-4 mr-2"/>
 Back to Blog
 </Link>

 <article className="prose prose-zinc max-w-none">
 <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
 </article>

 {toolMeta && (
 <div className="mt-16 pt-8 border-t border-zinc-200 ]">
 <h3 className="text-lg font-semibold text-zinc-900 mb-4">
 Related Tool
 </h3>
 <Link
 href={`/${toolMeta.slug}`}
 className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-zinc-50 ] border border-zinc-200 ] rounded-xl hover:bg-zinc-100 :bg-white transition-all"
 >
 <div className="flex items-center gap-4 mb-4 sm:mb-0">
 <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
 <Wrench className="w-5 h-5 text-blue-500"/>
 </div>
 <div>
 <p className="text-base font-semibold text-zinc-900 group-hover:text-blue-500 transition-colors">
 {toolMeta.name} Online
 </p>
 <p className="text-sm text-zinc-500 mt-0.5">
 {toolMeta.description}
 </p>
 </div>
 </div>
 <div className="flex items-center text-sm font-semibold text-blue-500 sm:ml-4 whitespace-nowrap bg-blue-50 px-4 py-2 rounded-lg">
 Open Tool
 <ChevronRight className="w-4 h-4 ml-1"/>
 </div>
 </Link>
 </div>
 )}
 </div>
 </div>
 );
}
