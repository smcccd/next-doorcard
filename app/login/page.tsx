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

    // Client-side validation
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
    if (isLoading) return; // Prevent double-clicks

    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      const result = await signIn("onelogin", {
        callbackUrl: "/dashboard",
        redirect: true,
      });

      // Note: If redirect is true, this code won't execute
      // as the page will redirect automatically
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
    <div className="flex flex-grow items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to Faculty Doorcards
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Use your SMCCD credentials to access the system
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* OneLogin Primary Sign In */}
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

          {/* Development/Fallback Option */}
          {process.env.NODE_ENV === "development" && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">or</span>
              </div>
            </div>
          )}

          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showCredentials ? "Hide" : "Show"} development login
            </button>
          )}
        </div>

        {/* Credentials Form (Development Only) */}
        {showCredentials && process.env.NODE_ENV === "development" && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
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
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear email error when user starts typing
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
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
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear password error when user starts typing
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                    }
                  }}
                />
                {fieldErrors.password && (
                  <p role="alert" className="text-red-500 text-xs mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
