"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function NewDoorcardButton() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure router is ready after hydration
    setIsReady(true);
  }, []);

  const handleClick = async () => {
    if (!isReady || isNavigating) return;

    setIsNavigating(true);
    try {
      await router.push("/doorcard/new");
    } catch (error) {
      console.error("Navigation error:", error);
      setIsNavigating(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!isReady || isNavigating}
      data-testid="create-doorcard-button"
    >
      <Plus className="h-5 w-5 mr-1" />
      {isNavigating ? "Loading..." : "Create Doorcard"}
    </Button>
  );
}
