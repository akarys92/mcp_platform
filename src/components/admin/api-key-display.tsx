"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Displays an API key with word-break and a prominent Copy button.
 * Designed for one-time key reveal dialogs.
 */
export function ApiKeyDisplay({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/50 p-4">
        <code className="block break-all font-mono text-sm leading-relaxed">
          {apiKey}
        </code>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleCopy}
      >
        {copied ? "Copied!" : "Copy to Clipboard"}
      </Button>
    </div>
  );
}
