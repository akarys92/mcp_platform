"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiKeyConnectForm } from "./api-key-connect-form";
import { DisconnectButton } from "./disconnect-button";

interface ConnectedKeyDisplayProps {
  connectorId: string;
  connectorType: string;
  endpoint: string;
  connectedAt: string | null;
}

export function ConnectedKeyDisplay({
  connectorId,
  connectorType,
  endpoint,
  connectedAt,
}: ConnectedKeyDisplayProps) {
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const handleReveal = async () => {
    if (!password.trim()) return;
    setError(null);
    setIsPending(true);

    try {
      const res = await fetch("/api/connectors/reveal-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connector_id: connectorId, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setRevealedKey(data.api_key);
        setShowPasswordPrompt(false);
        setPassword("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to reveal key");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsPending(false);
    }
  };

  const handleHide = () => {
    setRevealedKey(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Connected{" "}
        {connectedAt ? new Date(connectedAt).toLocaleDateString() : "—"}
      </div>

      {/* Key display */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
            {revealedKey ? (
              <span className="break-all">{revealedKey}</span>
            ) : (
              <span className="text-muted-foreground">
                ••••••••••••••••••••••••
              </span>
            )}
          </div>
          {revealedKey ? (
            <Button variant="outline" size="sm" onClick={handleHide}>
              Hide
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPasswordPrompt(true);
                setError(null);
              }}
            >
              Reveal
            </Button>
          )}
        </div>

        {/* Password prompt */}
        {showPasswordPrompt && !revealedKey && (
          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="Enter your password to reveal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReveal()}
              className="max-w-xs"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleReveal}
              disabled={isPending || !password.trim()}
            >
              {isPending ? "Verifying…" : "Confirm"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowPasswordPrompt(false);
                setPassword("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUpdateForm(!showUpdateForm)}
        >
          {showUpdateForm ? "Cancel Update" : "Update Key"}
        </Button>
        <DisconnectButton connectorId={connectorId} />
      </div>

      {showUpdateForm && (
        <ApiKeyConnectForm
          connectorType={connectorType}
          endpoint={endpoint}
          label="New API Key"
          buttonLabel="Update"
        />
      )}
    </div>
  );
}
