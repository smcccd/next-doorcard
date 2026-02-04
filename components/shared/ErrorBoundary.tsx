"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, MessageSquare } from "lucide-react";

import type {
  ErrorBoundaryState,
  ErrorBoundaryProps,
} from "@/types/components/ui";

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture with Sentry and get event ID
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({
      error,
      errorInfo,
      eventId, // Store event ID in state
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      eventId: undefined,
    });
  };

  showReportDialog = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({
        eventId: this.state.eventId,
        title: "Report an Issue",
        subtitle: "Help us improve by providing additional details",
        subtitle2: "",
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                An unexpected error occurred. We've been notified and are
                working to fix it.
              </p>

              {/* Event ID Display */}
              {this.state.eventId && (
                <div className="bg-gray-50 rounded-lg p-3 text-left">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Error Reference
                  </p>
                  <code className="text-sm font-mono text-gray-800 break-all select-all block">
                    {this.state.eventId}
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    Include this reference if contacting support
                  </p>
                </div>
              )}

              {/* Development Error Details */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-left bg-gray-50 p-3 rounded text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="whitespace-pre-wrap text-red-600 text-xs">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center flex-wrap">
                <Button
                  onClick={this.resetError}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                {this.state.eventId && (
                  <Button
                    onClick={this.showReportDialog}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Report Issue
                  </Button>
                )}
                <Button onClick={() => (window.location.href = "/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
