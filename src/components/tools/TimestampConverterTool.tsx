import React, { useState, useEffect } from "react";
import { Copy, Check, Clock, Calendar } from "lucide-react";
import { format, formatDistanceToNow, fromUnixTime } from "date-fns";

interface TimestampConverterToolProps {
  restoredInput?: string | null;
}

export function TimestampConverterTool({ restoredInput }: TimestampConverterToolProps) {
  const parsedInput = restoredInput ? JSON.parse(restoredInput) : null;
  const [inputValue, setInputValue] = useState(parsedInput?.timestamp || Math.floor(Date.now() / 1000).toString());
  const [isMillis, setIsMillis] = useState(false);
  
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    let num = Number(inputValue.trim());
    if (isNaN(num) || inputValue.trim() === "") {
      setParsedDate(null);
      return;
    }

    // Auto-detect if it's likely milliseconds
    if (!isMillis && inputValue.trim().length >= 13) {
      setIsMillis(true);
      num = Math.floor(num / 1000);
    } else if (isMillis && inputValue.trim().length <= 10) {
      setIsMillis(false);
    } else if (isMillis) {
      num = Math.floor(num / 1000);
    }

    try {
      setParsedDate(fromUnixTime(num));
    } catch (e) {
      setParsedDate(null);
    }
  }, [inputValue, isMillis]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNow = () => {
    setInputValue(Math.floor(Date.now() / (isMillis ? 1 : 1000)).toString());
  };

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-6 space-y-8">
        
        {/* Input Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            Enter Timestamp
          </h2>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-lg font-mono focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. 1672531200"
            />
            <button
              onClick={handleNow}
              className="px-6 py-3 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Current Time
            </button>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600">
              <input 
                type="radio" 
                checked={!isMillis} 
                onChange={() => setIsMillis(false)}
                className="accent-blue-600"
              />
              Seconds (Unix Epoch)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600">
              <input 
                type="radio" 
                checked={isMillis} 
                onChange={() => setIsMillis(true)}
                className="accent-blue-600"
              />
              Milliseconds (JS)
            </label>
          </div>
        </div>

        {/* Results Section */}
        {parsedDate ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResultCard 
                label="Local Time" 
                value={format(parsedDate, "PPpp")}
                subValue={format(parsedDate, "OOOO")}
                onCopy={() => handleCopy(format(parsedDate, "PPpp"), "local")}
                copied={copiedField === "local"}
              />
              <ResultCard 
                label="UTC / GMT Time" 
                value={parsedDate.toUTCString()}
                onCopy={() => handleCopy(parsedDate.toUTCString(), "utc")}
                copied={copiedField === "utc"}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ResultCard 
                label="Relative Time" 
                value={formatDistanceToNow(parsedDate, { addSuffix: true })}
                onCopy={() => handleCopy(formatDistanceToNow(parsedDate, { addSuffix: true }), "relative")}
                copied={copiedField === "relative"}
              />
              <ResultCard 
                label="ISO 8601" 
                value={parsedDate.toISOString()}
                onCopy={() => handleCopy(parsedDate.toISOString(), "iso")}
                copied={copiedField === "iso"}
                isCode
              />
              <ResultCard 
                label="Unix Timestamp" 
                value={Math.floor(parsedDate.getTime() / 1000).toString()}
                onCopy={() => handleCopy(Math.floor(parsedDate.getTime() / 1000).toString(), "unix")}
                copied={copiedField === "unix"}
                isCode
              />
            </div>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-zinc-200 rounded-lg text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
            <Calendar className="w-8 h-8 text-zinc-300" />
            <p>Enter a valid timestamp to view conversions.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ label, value, subValue, onCopy, copied, isCode }: any) {
  return (
    <div className="border border-zinc-200 rounded-lg bg-white p-4 flex flex-col justify-between group hover:border-zinc-300 transition-colors">
      <div className="mb-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className={`text-base font-medium text-zinc-900 truncate ${isCode ? "font-mono" : ""}`}>
            {value}
          </div>
          {subValue && <div className="text-xs text-zinc-500 mt-1">{subValue}</div>}
        </div>
        <button
          onClick={onCopy}
          className="shrink-0 p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 rounded transition-colors"
          title="Copy"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
