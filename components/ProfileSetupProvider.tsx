"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ProfileSetupModal } from "./ProfileSetupModal";

export function ProfileSetupProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "loading" || hasChecked || !mounted) return;
    
    if (session?.user) {
      // Check if user has already interacted with the modal (persistent)
      const dismissalKey = `profile-setup-dismissed-${session.user.id}`;
      const wasDismissed = typeof window !== 'undefined' ? localStorage.getItem(dismissalKey) : null;
      
      if (!wasDismissed) {
        // Check if user needs to complete profile setup
        const hasGenericName = !session.user.name || 
          session.user.name === session.user.email?.split('@')[0] ||
          session.user.name === (session.user as any).username ||
          session.user.name.split(' ').length < 2; // Single name suggests incomplete profile
        
        if (hasGenericName) {
          setShowModal(true);
        }
      }
      setHasChecked(true);
    }
  }, [session, status, hasChecked, mounted]);

  const handleComplete = () => {
    setShowModal(false);
    // Store dismissal permanently so it doesn't show again until they visit profile page
    if (session?.user?.id) {
      localStorage.setItem(`profile-setup-dismissed-${session.user.id}`, 'true');
    }
  };

  // Function to reset the modal (can be called when user visits profile page)
  const resetProfileSetup = () => {
    if (session?.user?.id) {
      localStorage.removeItem(`profile-setup-dismissed-${session.user.id}`);
    }
  };


  return (
    <>
      {children}
      {mounted && <ProfileSetupModal isOpen={showModal} onComplete={handleComplete} />}
    </>
  );
}