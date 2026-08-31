export interface ParsedCurl {
 url: string;
 method: string;
 headers: Record<string, string>;
 body?: string;
 error?: string;
}

export function parseCurlCommand(curlStr: string): ParsedCurl {
  if (!curlStr || !curlStr.trim().startsWith('curl ')) {
    return { url: '', method: 'GET', headers: {}, error: 'Input does not appear to be a curl command.' };
  }

  const result: ParsedCurl = {
    url: '',
    method: 'GET',
    headers: {}
  };

  const args: string[] = [];
  let currentArg = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < curlStr.length; i++) {
    const char = curlStr[i];
    
    if (char === '\\' && !inQuotes) {
      if (i + 1 < curlStr.length && (curlStr[i + 1] === '\n' || curlStr[i + 1] === '\r')) {
        i++;
        if (curlStr[i] === '\r' && curlStr[i+1] === '\n') i++;
      } else {
        currentArg += char;
      }
    } else if ((char === "'" || char === '"') && (i === 0 || curlStr[i - 1] !== '\\')) {
      if (inQuotes && char === quoteChar) {
        inQuotes = false;
      } else if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else {
        currentArg += char;
      }
    } else if (char === ' ' && !inQuotes) {
      if (currentArg.length > 0) {
        args.push(currentArg);
        currentArg = '';
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentArg.length > 0) {
        args.push(currentArg);
        currentArg = '';
      }
    } else {
      currentArg += char;
    }
  }
  
  if (currentArg.length > 0) {
    args.push(currentArg);
  }

  const ignoreFlags = ['-s', '-S', '-L', '-k', '--insecure', '-i', '-v', '--compressed'];

  for (let i = 1; i < args.length; i++) {
    let arg = args[i];
    
    if (ignoreFlags.includes(arg) || (arg.startsWith('-') && ignoreFlags.includes(arg.substring(0, 2)))) {
      continue;
    } else if (arg === '-X' || arg === '--request') {
      result.method = args[++i]?.toUpperCase() || 'GET';
    } else if (arg === '-H' || arg === '--header') {
      const headerArg = args[++i];
      if (headerArg) {
        const separatorIdx = headerArg.indexOf(':');
        if (separatorIdx > 0) {
          const key = headerArg.substring(0, separatorIdx).trim();
          const val = headerArg.substring(separatorIdx + 1).trim();
          result.headers[key] = val;
        }
      }
    } else if (arg === '-d' || arg === '--data' || arg === '--data-raw' || arg === '--data-binary') {
      result.body = args[++i] || '';
      if (result.method === 'GET') result.method = 'POST';
    } else if (arg === '-F' || arg === '--form') {
       result.body = (result.body ? result.body + '&' : '') + (args[++i] || '');
       if (result.method === 'GET') result.method = 'POST';
    } else if (arg === '-u' || arg === '--user') {
       const auth = args[++i];
       if (auth) result.headers['Authorization'] = 'Basic ' + btoa(auth);
    } else if (arg === '-b' || arg === '--cookie') {
       result.headers['Cookie'] = args[++i] || '';
    } else if (arg.startsWith('http') && !result.url) {
      result.url = arg;
    }
  }

  if (!result.url) {
    const urlArg = args.find(a => a.startsWith('http'));
    if (urlArg) result.url = urlArg;
  }

  return result;
}

export function generateFetch(parsed: ParsedCurl): string {
 if (parsed.error) return '';
 
 let code = `fetch('${parsed.url || 'https://api.example.com'}', {\n`;
 code += ` method: '${parsed.method}',\n`;
 
 const headerKeys = Object.keys(parsed.headers);
 if (headerKeys.length > 0) {
 code += ` headers: {\n`;
 headerKeys.forEach(key => {
 code += ` '${key}': '${parsed.headers[key]}',\n`;
 });
 code += ` },\n`;
 }
 
 if (parsed.body) {
 code += ` body: JSON.stringify(${parsed.body})\n`; // Simplified body handling
 }
 
 code += `});`;
 return code;
}

export function generatePythonRequests(parsed: ParsedCurl): string {
 if (parsed.error) return '';
 
 let code = `import requests\n\n`;
 code += `url ="${parsed.url || 'https://api.example.com'}"\n\n`;
 
 const headerKeys = Object.keys(parsed.headers);
 if (headerKeys.length > 0) {
 code += `headers = {\n`;
 headerKeys.forEach(key => {
 code += `"${key}":"${parsed.headers[key]}",\n`;
 });
 code += `}\n\n`;
 }
 
 if (parsed.body) {
 code += `payload = ${parsed.body}\n\n`;
 }
 
 code += `response = requests.request(\n`;
 code += `"${parsed.method}", \n`;
 code += ` url`;
 if (headerKeys.length > 0) code += `,\n headers=headers`;
 if (parsed.body) code += `,\n data=payload`;
 code += `\n)\n\n`;
 code += `print(response.text)`;
 
 return code;
}

export function generateGoHttp(parsed: ParsedCurl): string {
 if (parsed.error) return '';
 
 let code = `package main\n\n`;
 code += `import (\n\t"fmt"\n\t"strings"\n\t"net/http"\n\t"io/ioutil"\n)\n\n`;
 code += `func main() {\n`;
 code += `\turl :="${parsed.url ||"https://api.example.com"}"\n\n`;
 
 if (parsed.body) {
 code += `\tpayload := strings.NewReader(\`${parsed.body}\`)\n\n`;
 }
 
 code += `\treq, _ := http.NewRequest("${parsed.method}", url, `;
 code += parsed.body ? `payload` : `nil`;
 code += `)\n\n`;
 
 const headerKeys = Object.keys(parsed.headers);
 headerKeys.forEach(key => {
 code += `\treq.Header.Add("${key}","${parsed.headers[key]}")\n`;
 });
 
 code += `\n\tres, _ := http.DefaultClient.Do(req)\n`;
 code += `\tdefer res.Body.Close()\n\n`;
 code += `\tbody, _ := ioutil.ReadAll(res.Body)\n`;
 code += `\tfmt.Println(string(body))\n`;
 code += `}`;
 
 return code;
}
