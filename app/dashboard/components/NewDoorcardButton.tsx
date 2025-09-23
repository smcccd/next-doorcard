"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewDoorcardButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateDoorcard = () => {
    setIsLoading(true);
    router.push("/doorcard/new");
  };

  return (
    <Button
      onClick={handleCreateDoorcard}
      disabled={isLoading}
      data-testid="create-doorcard-button"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Plus className="h-5 w-5" />
          Create Doorcard
        </>
      )}
    </Button>
  );
}
