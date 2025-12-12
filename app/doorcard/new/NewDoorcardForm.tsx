"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { handleNewDoorcardForm } from "./action";
import { COLLEGE_META, type College } from "@/types/doorcard";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const TERM_OPTIONS = ["Fall", "Spring", "Summer"] as const;
const COLLEGE_OPTIONS = ["SKYLINE", "CSM", "CANADA"] as const;
type ValidCollege = (typeof COLLEGE_OPTIONS)[number];
// Generate academic years starting from current year
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-indexed to 1-indexed

  // If it's January-July, we're likely planning for the same academic year
  // If it's August-December, we're planning for next academic year primarily
  return month >= 8 ? year : year;
};

const CURRENT_YEAR = getCurrentAcademicYear();
const BASE_YEARS = Array.from({ length: 5 }, (_, i) =>
  (CURRENT_YEAR + i).toString()
);

type FieldErrors = { college?: string; term?: string; year?: string };

interface Props {
  /** User's college from profile for pre-filling */
  userCollege?: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Creating doorcard…
        </div>
      ) : (
        "Continue to Basic Info"
      )}
    </Button>
  );
}

function ErrorText(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={"mt-1 text-xs text-red-600 " + (props.className ?? "")}
    />
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export default function CampusTermForm({ userCollege }: Props) {
  const YEAR_OPTIONS = BASE_YEARS;

  const [college, setCollege] = useState<ValidCollege | "">(
    (userCollege as ValidCollege) ?? ""
  );
  const [term, setTerm] = useState("");
  const [year, setYear] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [clientTried, setClientTried] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Server error handling using URL parameters (traditional approach)
  const [serverError, setServerError] = useState<string | null>(null);
  const searchParams = useSearchParams(); // Get URL search parameters

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setServerError(decodeURIComponent(error));
    } else {
      setServerError(null);
    }
  }, [searchParams]);

  // Use the action directly - no need for .bind() pattern here
  const formAction = handleNewDoorcardForm;

  const validateField = (
    name: keyof FieldErrors,
    value: string
  ): string | undefined => {
    if (!value) return "Required";
    if (name === "college" && !COLLEGE_OPTIONS.includes(value as ValidCollege))
      return "Invalid campus";
    if (
      name === "term" &&
      !TERM_OPTIONS.includes(value as (typeof TERM_OPTIONS)[number])
    )
      return "Invalid term";
    if (name === "year" && !YEAR_OPTIONS.includes(value)) return "Invalid year";
    return undefined;
  };

  const validateAll = (): FieldErrors => ({
    college: validateField("college", college),
    term: validateField("term", term),
    year: validateField("year", year),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientTried(true);
    const errs = validateAll();
    setFieldErrors(errs);

    // If there are client-side validation errors, prevent submission
    if (Object.values(errs).some(Boolean)) {
      e.preventDefault();
      return;
    }

    // Set submitting state for visual feedback
    setIsSubmitting(true);

    // Clear any previous server errors
    setServerError(null);

    // If validation passes, let the form submit naturally to the action
    // The form action will handle the server-side logic
  };

  const anyClientErrors = Object.values(fieldErrors).some(Boolean);
  const errorClass =
    "mt-1.5 border-red-300 focus:ring-red-500 focus:border-red-500";

  return (
    <Card className="relative">
      {/* Loading overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center gap-3 bg-white shadow-lg rounded-lg px-6 py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <div className="text-sm font-medium text-gray-900">
              Creating doorcard...
            </div>
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
          <div>
            <CardTitle className="text-lg font-medium text-gray-900">
              Select Campus & Term
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Choose the campus and term for this doorcard.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {serverError && <Alert>{serverError}</Alert>}
        {clientTried && anyClientErrors && (
          <Alert>Please fill in all required fields correctly.</Alert>
        )}

        <form
          action={formAction}
          onSubmit={handleSubmit}
          className="space-y-6"
          noValidate
        >
          {/* Hidden inputs to pass form values */}
          <input type="hidden" name="college" value={college} />
          <input type="hidden" name="term" value={term} />
          <input type="hidden" name="year" value={year} />

          <fieldset
            className="border border-gray-200 rounded-lg p-6"
            disabled={isSubmitting}
          >
            <legend className="text-base font-medium text-gray-900 px-2">
              Campus and Term Selection
            </legend>
            <div className="grid gap-6 md:grid-cols-3 mt-4">
              {/* Campus */}
              <div>
                <Label htmlFor="college" className="text-sm font-medium">
                  Campus <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={college}
                  onValueChange={(v) => {
                    setCollege(v as ValidCollege);
                    if (clientTried)
                      setFieldErrors((p) => ({
                        ...p,
                        college: validateField("college", v),
                      }));
                  }}
                >
                  <SelectTrigger
                    id="college"
                    aria-invalid={!!fieldErrors.college}
                    aria-describedby={
                      fieldErrors.college ? "college-error" : undefined
                    }
                    aria-required="true"
                    className={fieldErrors.college ? errorClass : "mt-1.5"}
                  >
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLEGE_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {COLLEGE_META[c as keyof typeof COLLEGE_META].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.college && (
                  <ErrorText id="college-error" role="alert">
                    {fieldErrors.college}
                  </ErrorText>
                )}
              </div>

              {/* Term */}
              <div>
                <Label htmlFor="term" className="text-sm font-medium">
                  Term <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={term}
                  onValueChange={(v) => {
                    setTerm(v);
                    if (clientTried)
                      setFieldErrors((p) => ({
                        ...p,
                        term: validateField("term", v),
                      }));
                  }}
                >
                  <SelectTrigger
                    id="term"
                    aria-invalid={!!fieldErrors.term}
                    aria-describedby={
                      fieldErrors.term ? "term-error" : undefined
                    }
                    aria-required="true"
                    className={fieldErrors.term ? errorClass : "mt-1.5"}
                  >
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {TERM_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.term && (
                  <ErrorText id="term-error" role="alert">
                    {fieldErrors.term}
                  </ErrorText>
                )}
              </div>

              {/* Year */}
              <div>
                <Label htmlFor="year" className="text-sm font-medium">
                  Year <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={year}
                  onValueChange={(v) => {
                    setYear(v);
                    if (clientTried)
                      setFieldErrors((p) => ({
                        ...p,
                        year: validateField("year", v),
                      }));
                  }}
                >
                  <SelectTrigger
                    id="year"
                    aria-invalid={!!fieldErrors.year}
                    aria-describedby={
                      fieldErrors.year ? "year-error" : undefined
                    }
                    aria-required="true"
                    className={fieldErrors.year ? errorClass : "mt-1.5"}
                  >
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.year && (
                  <ErrorText id="year-error" role="alert">
                    {fieldErrors.year}
                  </ErrorText>
                )}
              </div>
            </div>
          </fieldset>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
