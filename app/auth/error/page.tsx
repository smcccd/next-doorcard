"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "OAuthCreateAccount":
        return {
          title: "Access Denied",
          message:
            "You don't have access to this application. Please contact your IT administrator to be granted access to the Faculty Doorcard system.",
          action: "Contact IT Support",
        };
      case "access_denied":
        return {
          title: "Access Denied",
          message:
            "You don't have permission to access this application. Please ensure you're using your SMCCD credentials and have been granted access.",
          action: "Try Again",
        };
      case "CredentialsSignin":
        return {
          title: "Login Failed",
          message:
            "Invalid email or password. Please check your credentials and try again.",
          action: "Try Again",
        };
      default:
        return {
          title: "Authentication Error",
          message:
            "An error occurred during authentication. Please try again or contact support if the problem persists.",
          action: "Try Again",
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {errorInfo.title}
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-gray-600">
              {errorInfo.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error === "OAuthCreateAccount" && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What to do:</p>
                  <ol className="mt-2 ml-4 list-decimal space-y-1">
                    <li>Contact your IT administrator</li>
                    <li>Request access to "Faculty Doorcard" application</li>
                    <li>Wait for access to be granted</li>
                    <li>Try logging in again</li>
                  </ol>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </Button>

              {error !== "OAuthCreateAccount" && (
                <Button asChild className="flex-1">
                  <Link href="/login">Try Again</Link>
                </Button>
              )}
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-gray-600">
                <strong>Debug Info:</strong> {error || "No error specified"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
