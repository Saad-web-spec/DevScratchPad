import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Copy, Check, Download, ListOrdered } from "lucide-react";
import { faker } from "@faker-js/faker";

interface MockDataGeneratorToolProps {
  onValidationChange?: (isValid: boolean) => void;
  onStatsChange?: (length: number, ms: number) => void;
  restoredInput?: string | null;
}

export function MockDataGeneratorTool({ restoredInput, onStatsChange }: MockDataGeneratorToolProps) {
  const parsedInput = restoredInput ? JSON.parse(restoredInput) : null;
  const [schemaText, setSchemaText] = useState(
    parsedInput?.schema || 
`{
  "id": "{{string.uuid}}",
  "firstName": "{{person.firstName}}",
  "lastName": "{{person.lastName}}",
  "email": "{{internet.email}}",
  "avatar": "{{image.avatar}}",
  "company": "{{company.name}}",
  "registeredAt": "{{date.past}}"
}`
  );
  
  const [rows, setRows] = useState(parsedInput?.rows || 10);
  const [format, setFormat] = useState(parsedInput?.format || "json");
  
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateData = () => {
    setError(null);
    try {
      // We parse the schema structure
      let schemaObj = JSON.parse(schemaText);
      
      const results: any[] = [];
      for (let i = 0; i < rows; i++) {
        const item: any = {};
        for (const [key, value] of Object.entries(schemaObj)) {
          if (typeof value === "string") {
            // Check if it has mustaches
            if (value.includes("{{") && value.includes("}}")) {
              item[key] = faker.helpers.fake(value);
            } else {
              item[key] = value;
            }
          } else {
             // Basic support for nested objects is limited in this simple parser
             item[key] = value;
          }
        }
        results.push(item);
      }

      let finalOutput = "";
      if (format === "json") {
        finalOutput = JSON.stringify(results, null, 2);
      } else if (format === "csv") {
        const keys = Object.keys(schemaObj);
        const header = keys.join(",");
        const rowsStr = results.map(row => 
          keys.map(k => `"${String(row[k]).replace(/"/g, '""')}"`).join(",")
        ).join("\n");
        finalOutput = header + "\n" + rowsStr;
      } else if (format === "sql") {
        const keys = Object.keys(schemaObj);
        const columns = keys.join(", ");
        finalOutput = results.map(row => {
          const values = keys.map(k => {
             const val = row[k];
             if (typeof val === "boolean" || typeof val === "number") return val;
             return `'${String(val).replace(/'/g, "''")}'`;
          }).join(", ");
          return `INSERT INTO mock_data (${columns}) VALUES (${values});`;
        }).join("\n");
      }

      setOutput(finalOutput);
      onStatsChange?.(finalOutput.length, 0);
    } catch (e: any) {
      setError("Error parsing schema: " + e.message);
    }
  };

  // Generate initially
  useEffect(() => {
    generateData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock-data.${format === "sql" ? "sql" : format === "csv" ? "csv" : "json"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-zinc-200 bg-white shrink-0 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Rows:</span>
            <input 
              type="number" 
              className="w-20 text-xs border border-zinc-200 rounded px-2 py-1 outline-none focus:border-blue-500"
              value={rows}
              onChange={(e) => setRows(Number(e.target.value) || 1)}
              min={1}
              max={10000}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Format:</span>
            <select 
              className="text-xs border border-zinc-200 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="sql">SQL INSERT</option>
            </select>
          </div>
          <button
            onClick={generateData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium rounded-md transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Generate
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Editor Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 border-b border-zinc-200">
        <div className="flex-1 border-r border-zinc-200 flex flex-col min-h-0">
          <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center shrink-0">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Faker Schema Template</span>
            <span className="text-[10px] text-zinc-400">Uses mustache syntax: {'{{faker.method}}'}</span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language="json"
              value={schemaText}
              onChange={(val) => setSchemaText(val || "")}
              theme="light"
              options={{ minimap: { enabled: false }, tabSize: 2, wordWrap: "on" }}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center shrink-0">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Generated Output</span>
          </div>
          <div className="flex-1 relative">
            {error ? (
              <div className="p-4 text-sm text-red-600 font-mono bg-red-50 h-full">{error}</div>
            ) : (
              <Editor
                height="100%"
                language={format === "sql" ? "sql" : format === "json" ? "json" : "plaintext"}
                value={output}
                theme="light"
                options={{ readOnly: true, minimap: { enabled: false }, tabSize: 2, wordWrap: "on" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
