"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewDoorcardButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/doorcard/new")}>
      <Plus className="h-5 w-5 mr-1" /> Create Doorcard
    </Button>
  );
}
