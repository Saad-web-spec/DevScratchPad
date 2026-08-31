import { marked } from 'marked';
import DOMPurify from 'dompurify';

export async function renderMarkdown(md: string): Promise<string> {
 const html = await marked.parse(md);
 
 // Since DOMPurify needs the DOM, we need to handle SSR gracefully
 if (typeof window === 'undefined') {
 return html;
 }
 
 return DOMPurify.sanitize(html);
}
