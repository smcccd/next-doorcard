"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  User,
  Globe,
  GraduationCap,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getDisplayFormatOptions,
  COLLEGE_OPTIONS,
  ACADEMIC_TITLES,
  COMMON_PRONOUNS,
  formatDisplayName,
} from "@/lib/display-name";
import type { DisplayNameFormat, College } from "@prisma/client";

interface UserProfile {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  pronouns: string | null;
  displayFormat: DisplayNameFormat | null;
  email: string;
  username: string | null;
  website: string | null;
  college: College | null;
  role: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("none");
  const [pronouns, setPronouns] = useState("none");
  const [displayFormat, setDisplayFormat] =
    useState<DisplayNameFormat>("FULL_NAME");
  const [college, setCollege] = useState<College | "none">("none");
  const [website, setWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      console.log("[Profile] Fetching profile data...");
      console.log("[Profile] Session status:", session?.user?.email);

      if (!session?.user?.email) {
        console.log("[Profile] No session available, skipping API call");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/user/profile");
      console.log("[Profile] Response status:", response.status);
      console.log(
        "[Profile] Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.json();
        console.log("[Profile] Profile data received:", data);
        setProfile(data);

        // Use firstName/lastName if available, otherwise parse legacy name
        if (data.firstName && data.lastName) {
          setFirstName(data.firstName);
          setLastName(data.lastName);
        } else if (data.name) {
          const nameParts = data.name.split(" ");
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(" ") || "");
        }

        setTitle(data.title || "");
        setPronouns(data.pronouns || "");
        setDisplayFormat(data.displayFormat || "FULL_NAME");
        setWebsite(data.website || "");
      } else {
        console.error(
          "[Profile] API request failed:",
          response.status,
          response.statusText
        );
        setError("Failed to load profile");
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setError("Failed to load profile");
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    console.log(
      "[Profile] Session status changed:",
      status,
      "Email:",
      session?.user?.email
    );

    if (status === "loading") {
      console.log("[Profile] Session is still loading, waiting...");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      console.log("[Profile] Session authenticated, fetching profile");
      fetchProfile();

      // Reset profile setup dismissal when user visits profile page
      // This allows the modal to show again if they still have incomplete profile
      if (session.user.id) {
        localStorage.removeItem(`profile-setup-dismissed-${session.user.id}`);
      }
    } else if (status === "unauthenticated") {
      console.log("[Profile] User not authenticated");
      setIsLoading(false);
    }
  }, [session, status, fetchProfile]);

  // Validate display format when title or pronouns change
  useEffect(() => {
    if (firstName && lastName) {
      const availableOptions = getDisplayFormatOptions(
        firstName,
        lastName,
        title,
        pronouns
      );
      const currentFormatAvailable = availableOptions.some(
        (option) => option.value === displayFormat
      );

      if (!currentFormatAvailable) {
        // Reset to the first available format
        setDisplayFormat(
          (availableOptions[0]?.value as DisplayNameFormat) || "FULL_NAME"
        );
      }
    }
  }, [firstName, lastName, title, pronouns, displayFormat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "Please provide both first and last name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: title === "none" ? null : title.trim(),
        pronouns: pronouns === "none" ? null : pronouns.trim(),
        displayFormat,
        college: college === "none" ? null : college,
        website: website.trim() || null,
      };

      console.log("[Profile] Submitting:", updateData);

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      console.log("[Profile] Response status:", response.status);

      if (response.ok) {
        const updatedProfile = await response.json();
        console.log("[Profile] Updated profile:", updatedProfile);
        setProfile(updatedProfile);

        // Update the session with new name
        console.log("[Profile] Updating session...");
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

        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        const errorData = await response.json();
        console.error("[Profile] Error response:", errorData);
        throw new Error(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
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

  const hasGenericName =
    (!profile?.firstName || !profile?.lastName) &&
    (!profile?.name ||
      profile.name === profile.email?.split("@")[0] ||
      profile.name === profile.username ||
      profile.name.split(" ").length < 2);

  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-2 text-gray-900 dark:text-gray-100">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            Please log in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <User className="h-8 w-8" />
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your personal information and preferences
        </p>
      </div>

      {hasGenericName && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              Complete Your Profile
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
              Please provide your name to personalize your doorcard and improve
              your profile.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Account Information */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Account Information
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Your account details and login information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {profile?.email}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </Label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {profile?.username || "Not set"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </Label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 capitalize">
                  {profile?.role?.toLowerCase()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Display Name
                </Label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {profile ? formatDisplayName(profile) : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Personal Information
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Update your name and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Bryan"
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Besnyi"
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Title and Pronouns */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Academic Title (optional)
                  </Label>
                  <Select value={title} onValueChange={setTitle}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                      <SelectItem value="none">No title</SelectItem>
                      {ACADEMIC_TITLES.map((titleOption) => (
                        <SelectItem key={titleOption} value={titleOption}>
                          {titleOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="pronouns"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Pronouns (optional)
                  </Label>
                  <Select value={pronouns} onValueChange={setPronouns}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                      <SelectValue placeholder="Select pronouns" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
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

              {/* Display Format - Full Width */}
              <div className="space-y-2">
                <Label
                  htmlFor="displayFormat"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Display Name Format
                </Label>
                <Select
                  value={displayFormat}
                  onValueChange={(value: DisplayNameFormat) =>
                    setDisplayFormat(value)
                  }
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue>
                      {getDisplayFormatOptions(
                        firstName,
                        lastName,
                        title,
                        pronouns
                      ).find((opt) => opt.value === displayFormat)
                        ?.description || "Select format"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    {getDisplayFormatOptions(
                      firstName,
                      lastName,
                      title,
                      pronouns
                    ).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* College Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="college"
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Building2 className="h-4 w-4" />
                  College/Campus
                </Label>
                <Select
                  value={college}
                  onValueChange={(value: College | "none") => setCollege(value)}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue placeholder="Select your college" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectItem value="none">Not specified</SelectItem>
                    {COLLEGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label
                  htmlFor="website"
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Globe className="h-4 w-4" />
                  Faculty Website (optional)
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
                {website && !isValidWebsite(website) && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Please enter a valid website URL
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will be displayed on your doorcard for students to find
                  more information about you
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    firstName.trim().length === 0 ||
                    lastName.trim().length === 0 ||
                    (website.length > 0 && !isValidWebsite(website))
                  }
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
