"use client";

import { useState } from "react";

export function CopyBlock({
  text,
  multiline = false,
}: {
  text: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (multiline) {
    return (
      <div className="group relative">
        <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-4 font-mono text-xs leading-relaxed">
          {text}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-md border bg-background px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    );
  }

  return (
    <div className="group relative flex items-center">
      <code className="flex-1 rounded-md border bg-muted/50 px-3 py-1.5 font-mono text-xs">
        {text}
      </code>
      <button
        onClick={handleCopy}
        className="ml-2 shrink-0 rounded-md border bg-background px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
