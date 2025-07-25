"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { createDoorcardDraft } from "@/app/doorcard/actions"; // server action

export default function NewDoorcardButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      try {
        const url = await createDoorcardDraft(); // returns `/doorcard/{id}/edit?step=0`
        router.push(url);
      } catch (e) {
        console.error("Failed to create doorcard", e);
        // optionally show a toast
      }
    });
  }

  return (
    <Button
      onClick={handleCreate}
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-700"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Creating…
        </>
      ) : (
        <>
          <Plus className="h-5 w-5 mr-1" />
          Create Doorcard
        </>
      )}
    </Button>
  );
}
