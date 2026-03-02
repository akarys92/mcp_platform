"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyConnectFormProps {
  connectorType: string;
  endpoint: string;
  label?: string;
  buttonLabel?: string;
}

export function ApiKeyConnectForm({
  connectorType,
  endpoint,
  label = "API Key",
  buttonLabel = "Connect",
}: ApiKeyConnectFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to connect");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${connectorType}-api-key`}>{label}</Label>
        <Input
          id={`${connectorType}-api-key`}
          type="password"
          placeholder="Paste your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending || !apiKey.trim()}>
        {isPending ? "Connecting..." : buttonLabel}
      </Button>
    </form>
  );
}
