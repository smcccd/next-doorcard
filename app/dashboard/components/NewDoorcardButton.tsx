import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewDoorcardButton() {
  return (
    <Link
      href="/doorcard/new"
      data-testid="create-doorcard-button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "h-11 px-4 py-2", // default size
        "bg-primary text-primary-foreground shadow hover:bg-primary/90" // default variant
      )}
    >
      <Plus className="h-5 w-5 mr-1" />
      Create Doorcard
    </Link>
  );
}
