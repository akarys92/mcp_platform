"use client";

import { Switch } from "@/components/ui/switch";
import { toggleTool } from "@/app/admin/actions";
import { useTransition } from "react";

export function ToolToggle({
  toolId,
  name,
  isActive,
}: {
  toolId: string;
  name: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-sm">{name}</span>
      <Switch
        checked={isActive}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(() => {
            toggleTool(toolId, checked);
          });
        }}
      />
    </div>
  );
}
