"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiKeyDisplay } from "@/components/admin/api-key-display";
import { regenerateAgentKey } from "@/app/admin/actions";

export function RegenerateKeyButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  function handleRegenerate() {
    if (
      !confirm(
        `Regenerate API key for ${userName || "this agent"}? The current key will be revoked immediately.`
      )
    )
      return;

    startTransition(async () => {
      const key = await regenerateAgentKey(userId);
      setNewKey(key);
      setShowDialog(true);
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleRegenerate}
      >
        {isPending ? "Generating\u2026" : "Regenerate Key"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New API Key</DialogTitle>
            <DialogDescription>
              This key will only be shown once. Copy it now. The previous key has
              been revoked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {newKey && <ApiKeyDisplay apiKey={newKey} />}
            <Button className="w-full" onClick={() => setShowDialog(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
