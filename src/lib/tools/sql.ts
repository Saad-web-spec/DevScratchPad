import { format as sqlFormat, type SqlLanguage } from"sql-formatter";

export type SqlDialect =
 |"sql"
 |"postgresql"
 |"mysql"
 |"sqlite"
 |"mariadb"
 |"transactsql"
 |"plsql"
 |"snowflake"
 |"bigquery"
 |"redshift"
 |"db2"
 |"spark";

export interface SqlFormatterOptions {
 language?: SqlLanguage;
 tabWidth?: number;
 keywordCase?:"upper"|"lower"|"preserve";
 linesBetweenQueries?: number;
}

export function formatSql(
 query: string,
 options: SqlFormatterOptions = {}
): string {
 if (!query || query.trim() ==="") return"";

 const {
 language ="sql",
 tabWidth = 2,
 keywordCase ="upper",
 linesBetweenQueries = 1,
 } = options;

 return sqlFormat(query, {
 language,
 tabWidth,
 keywordCase,
 linesBetweenQueries,
 });
}

export function validateSql(
 query: string,
 options: SqlFormatterOptions = {}
): { valid: boolean; error?: string } {
 if (!query || query.trim() ==="") return { valid: true };

 try {
 sqlFormat(query, {
 language: options.language ||"sql",
 tabWidth: options.tabWidth || 2,
 keywordCase: options.keywordCase ||"upper",
 });
 return { valid: true };
 } catch (error: any) {
 return {
 valid: false,
 error: error.message ||"Invalid SQL query syntax",
 };
 }
}
