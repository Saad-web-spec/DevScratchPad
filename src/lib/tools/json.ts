export function formatJson(input: string, indent: number = 2): string {
 try {
 const parsed = JSON.parse(input);
 return JSON.stringify(parsed, null, indent);
 } catch (error) {
 throw new Error('Invalid JSON');
 }
}

export function minifyJson(input: string): string {
 try {
 const parsed = JSON.parse(input);
 return JSON.stringify(parsed);
 } catch (error) {
 throw new Error('Invalid JSON');
 }
}

export function validateJson(input: string): { valid: boolean; error?: string; line?: number } {
 if (!input || input.trim() === '') {
 return { valid: true }; // Empty is technically fine to not show an error, or we can consider it invalid. Let's say valid to clear errors.
 }
 
 try {
 JSON.parse(input);
 return { valid: true };
 } catch (error: any) {
 const errorMessage = error.message || String(error);
 // Try to extract line number from typical JSON.parse error:"Unexpected token } in JSON at position 12"
 // In modern V8, it might say"Expected double-quoted property name in JSON at position 16 (line 2 column 3)"
 let line = 0;
 const lineMatch = errorMessage.match(/line\s(\d+)/i);
 if (lineMatch && lineMatch[1]) {
 line = parseInt(lineMatch[1], 10);
 }
 return { valid: false, error: errorMessage, line };
 }
}
