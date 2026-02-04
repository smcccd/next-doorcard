"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  COLLEGE_OPTIONS,
  ACADEMIC_TITLES,
  COMMON_PRONOUNS,
  formatDisplayName,
} from "@/lib/display-name";
import type { College, DisplayNameFormat } from "@prisma/client";

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function ProfileSetupModal({
  isOpen,
  onComplete,
}: ProfileSetupModalProps) {
  const { data: session, update } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("none");
  const [pronouns, setPronouns] = useState("none");
  const [college, setCollege] = useState<College | "none">("none");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: title === "none" ? null : title.trim(),
        pronouns: pronouns === "none" ? null : pronouns.trim(),
        displayFormat: "FULL_NAME" as DisplayNameFormat,
        college: college === "none" ? null : college,
        website: website.trim() || null,
      };

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        // Update the session with new name
        const displayName = formatDisplayName({
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          title: updatedProfile.title,
          displayFormat: updatedProfile.displayFormat,
        });

        await update({
          ...session,
          user: {
            ...session?.user,
            name: displayName,
          },
        });
        onComplete();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidWebsite = (url: string) => {
    if (!url || url.trim() === "") return true; // Optional field
    const trimmedUrl = url.trim();

    // Basic validation - must contain a dot and no spaces
    if (!trimmedUrl.includes(".") || trimmedUrl.includes(" ")) {
      return false;
    }

    try {
      const fullUrl = trimmedUrl.startsWith("http")
        ? trimmedUrl
        : `https://${trimmedUrl}`;
      const urlObj = new URL(fullUrl);
      return urlObj.hostname.includes(".");
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onComplete}>
      <DialogContent
        className="sm:max-w-[425px] [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please provide your name to personalize your doorcard and profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Bryan"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Besnyi"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="grid gap-2">
                <Label htmlFor="title">Academic Title (optional)</Label>
                <Select value={title} onValueChange={setTitle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No title</SelectItem>
                    {ACADEMIC_TITLES.map((titleOption) => (
                      <SelectItem key={titleOption} value={titleOption}>
                        {titleOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pronouns">Pronouns (optional)</Label>
                <Select value={pronouns} onValueChange={setPronouns}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pronouns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {COMMON_PRONOUNS.map((pronounOption) => (
                      <SelectItem key={pronounOption} value={pronounOption}>
                        {pronounOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="college">College</Label>
              <Select
                value={college}
                onValueChange={(value: College | "none") => setCollege(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {COLLEGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">Faculty Website (optional)</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
              />
              {website && !isValidWebsite(website) && (
                <p className="text-sm text-red-600">
                  Please enter a valid website URL
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onComplete}
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                firstName.trim().length === 0 ||
                lastName.trim().length === 0 ||
                (website.length > 0 && !isValidWebsite(website))
              }
            >
              {isSubmitting ? "Saving..." : "Complete Setup"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
