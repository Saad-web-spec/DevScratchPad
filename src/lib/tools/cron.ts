import cronstrue from"cronstrue";

export function explainCron(cronStr: string): string {
 if (!cronStr || cronStr.trim() ==="") {
 return"";
 }
 try {
 return cronstrue.toString(cronStr.trim(), {
 throwExceptionOnParseError: true,
 use24HourTimeFormat: false,
 verbose: true,
 });
 } catch (error: any) {
 throw new Error(error.message ||"Invalid cron expression");
 }
}

export function validateCron(cronStr: string): { valid: boolean; error?: string; explanation?: string } {
 if (!cronStr || cronStr.trim() ==="") {
 return { valid: true };
 }
 try {
 const explanation = cronstrue.toString(cronStr.trim(), {
 throwExceptionOnParseError: true,
 use24HourTimeFormat: false,
 verbose: true,
 });
 return { valid: true, explanation };
 } catch (error: any) {
 return { valid: false, error: error.message ||"Invalid cron expression"};
 }
}
