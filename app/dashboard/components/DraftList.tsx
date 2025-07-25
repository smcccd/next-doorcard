"use client";
import ResumeDoorcard from "./ResumeDoorcard";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import type { DoorcardDraft } from "@prisma/client";

export default function DraftList({ drafts }: { drafts: DoorcardDraft[] }) {
  const [items, setItems] = useState(drafts);
  const [pending, start] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteOne(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/doorcards/draft?id=${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAll() {
    start(async () => {
      await fetch(`/api/doorcards/draft?all=true`, { method: "DELETE" });
      setItems([]);
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Drafts</h2>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={deleteAll}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Clear All
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((d) => (
          <ResumeDoorcard
            key={d.id}
            draft={{
              id: d.id,
              name: (d.data as any)?.doorcardName || "Untitled Draft",
              completionPercentage: 0, // compute if needed
              lastUpdated: d.lastUpdated.toString(),
            }}
            onDelete={() => deleteOne(d.id)}
            isDeleting={deletingId === d.id}
          />
        ))}
      </div>
    </section>
  );
}
