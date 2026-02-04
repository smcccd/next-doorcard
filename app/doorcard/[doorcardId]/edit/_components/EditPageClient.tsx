"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UnsavedChangesDialog } from "@/components/shared/UnsavedChangesDialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

// Context for forms to report their dirty state
interface DirtyStateContextType {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

const DirtyStateContext = createContext<DirtyStateContextType>({
  isDirty: false,
  setIsDirty: () => {},
});

export function useDirtyState() {
  return useContext(DirtyStateContext);
}

interface EditPageClientProps {
  children: React.ReactNode;
}

/**
 * Client wrapper for the edit page that handles unsaved changes warnings.
 */
export function EditPageClient({ children }: EditPageClientProps) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  // Set up beforeunload warning
  useUnsavedChanges({
    isDirty,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  const _handleNavigate = useCallback(
    (href: string) => {
      if (isDirty) {
        setPendingNavigation(href);
        setShowDialog(true);
      } else {
        router.push(href);
      }
    },
    [isDirty, router]
  );

  const handleConfirmNavigation = useCallback(() => {
    setShowDialog(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  }, [pendingNavigation, router]);

  const handleCancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  return (
    <DirtyStateContext.Provider value={{ isDirty, setIsDirty }}>
      {children}
      <UnsavedChangesDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
      />
    </DirtyStateContext.Provider>
  );
}

interface BackToDashboardButtonProps {
  className?: string;
}

/**
 * Back button that checks for unsaved changes before navigating.
 */
export function BackToDashboardButton({
  className,
}: BackToDashboardButtonProps) {
  const router = useRouter();
  const { isDirty } = useDirtyState();
  const [showDialog, setShowDialog] = useState(false);

  const handleClick = () => {
    if (isDirty) {
      setShowDialog(true);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={className}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <UnsavedChangesDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={() => {
          setShowDialog(false);
          router.push("/dashboard");
        }}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
}
