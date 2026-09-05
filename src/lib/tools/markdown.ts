import { marked } from 'marked';
import DOMPurify from 'dompurify';

function serverSanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\s*on\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s*on\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

export async function renderMarkdown(md: string): Promise<string> {
  const html = await marked.parse(md);

  // Since DOMPurify needs the DOM, handle SSR with strict regex fallback
  if (typeof window === "undefined") {
    return serverSanitize(html);
  }

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
}
