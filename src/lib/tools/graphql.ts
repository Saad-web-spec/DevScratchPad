import { parse, print } from 'graphql';

export function formatGraphQL(query: string): { valid: boolean; formatted?: string; error?: string } {
 try {
 const ast = parse(query);
 const formatted = print(ast);
 return { valid: true, formatted };
 } catch (err: any) {
 return { valid: false, error: err.message };
 }
}
