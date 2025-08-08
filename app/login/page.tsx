"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedEmail = email.trim();
    const newErrors: { email?: string; password?: string } = {};
    if (!trimmedEmail) newErrors.email = "Email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(trimmedEmail))
      newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });
      setIsLoading(false);
      if (result?.error) {
        console.error(result.error);
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      setError("Invalid email or password. Please try again.");
    }
  };

  const handleOneLoginSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("onelogin", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
      if (result?.error) {
        setIsLoading(false);
        setError("Authentication failed. Please try again.");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("OneLogin sign in error:", error);
      setError("Unable to sign in with OneLogin. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome to Faculty Doorcards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in using your SMCCD credentials to view or manage your door
            card.
          </p>
        </div>

        {error && (
          <div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-center"
            role="alert"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="button"
            onClick={handleOneLoginSignIn}
            disabled={isLoading}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isLoading ? "Signing in..." : "Sign in with SMCCD OneLogin"}
          </Button>

          {process.env.NODE_ENV === "development" && (
            <>
              <div className="relative text-sm text-muted-foreground">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCredentials(!showCredentials)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showCredentials ? "Hide" : "Show"} development login
              </button>
            </>
          )}
        </div>

        {showCredentials && process.env.NODE_ENV === "development" && (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email)
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {fieldErrors.email && (
                  <p role="alert" className="text-red-500 text-xs mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {fieldErrors.password && (
                  <p role="alert" className="text-red-500 text-xs mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
