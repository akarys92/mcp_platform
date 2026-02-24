"use client";

import { Button } from "@/components/ui/button";
import { disconnectConnector } from "@/app/admin/actions";
import { useTransition } from "react";

export function DisconnectButton({ connectorId }: { connectorId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Disconnect this connector? Users will lose access to its tools.")) return;
        startTransition(() => {
          disconnectConnector(connectorId);
        });
      }}
    >
      {isPending ? "Disconnecting…" : "Disconnect"}
    </Button>
  );
}
