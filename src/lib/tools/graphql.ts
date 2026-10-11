import { parse, print, GraphQLError } from 'graphql';

export function formatGraphQL(query: string): { valid: boolean; formatted?: string; error?: string; line?: number } {
 try {
 const ast = parse(query);
 const formatted = print(ast);
 return { valid: true, formatted };
 } catch (err: unknown) {
 if (err instanceof GraphQLError) {
 return { valid: false, error: err.message, line: err.locations?.[0]?.line };
 }
 return { valid: false, error: err instanceof Error ? err.message : String(err) };
 }
}
