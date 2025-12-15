"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";

/**
 * Client component that shows a success toast when a doorcard is published.
 * Reads the `published` URL param and clears it after showing the toast.
 */
export function PublishSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const published = searchParams.get("published");

    if (published === "true") {
      // Show success toast
      toast({
        title: "Doorcard Published!",
        description:
          "Your doorcard is now visible to students and staff. Share the link or find it on the browse page.",
        variant: "default",
      });

      // Clean up URL by removing the param
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("published");
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return null;
}
