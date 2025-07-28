"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { validateCampusTerm } from "@/app/doorcard/actions";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TERM_OPTIONS = ["Fall", "Spring", "Summer"] as const;
const COLLEGE_OPTIONS = Object.keys(COLLEGE_META) as College[];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) =>
  (CURRENT_YEAR + i).toString(),
);

type FieldErrors = { college?: string; term?: string; year?: string };
type ActionState = { success: boolean; message?: string };

interface Props {
  doorcard: {
    id: string;
    college?: string;
    term?: string;
    year?: string;
  };
}

/* -------------------------------------------------------------------------- */
/* Small Components                                                           */
/* -------------------------------------------------------------------------- */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Validating…" : "Continue to Basic Info"}
    </Button>
  );
}

function ErrorText({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {children}
    </p>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Form                                                                  */
/* -------------------------------------------------------------------------- */

export default function CampusTermForm({ doorcard }: Props) {
  const [college, setCollege] = useState<string>(doorcard.college ?? "");
  const [term, setTerm] = useState(doorcard.term ?? "");
  const [year, setYear] = useState(doorcard.year ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [clientTried, setClientTried] = useState(false);

  const [state, serverAction] = useActionState<ActionState, FormData>(
    validateCampusTerm.bind(null, doorcard.id),
    { success: true },
  );

  /* ------------------------------ Validation ------------------------------ */

  const validateField = (
    name: keyof FieldErrors,
    value: string,
  ): string | undefined => {
    if (!value) return "Required";
    switch (name) {
      case "college":
        return COLLEGE_OPTIONS.includes(value as College)
          ? undefined
          : "Invalid campus";
      case "term":
        return TERM_OPTIONS.includes(value as any) ? undefined : "Invalid term";
      case "year":
        return YEAR_OPTIONS.includes(value) ? undefined : "Invalid year";
      default:
        return undefined;
    }
  };

  const validateAll = (): FieldErrors => ({
    college: validateField("college", college),
    term: validateField("term", term),
    year: validateField("year", year),
  });

  const handleSubmit = (formData: FormData) => {
    setClientTried(true);
    const errs = validateAll();
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    // ensure values are sent to the server action
    formData.set("college", college);
    formData.set("term", term);
    formData.set("year", year);
    serverAction(formData);
  };

  const anyClientErrors = Object.values(fieldErrors).some(Boolean);
  const errorClass =
    "mt-1.5 border-red-300 focus:ring-red-500 focus:border-red-500";

  /* ------------------------------- Rendering ------------------------------ */

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
        <div>
          <h3 className="font-medium text-gray-900">
            Select Campus &amp; Term
          </h3>
          <p className="text-sm text-gray-500">
            One doorcard per campus per term. Choose where this one applies.
          </p>
        </div>
      </div>

      {!state.success && state.message && <Alert>{state.message}</Alert>}

      {clientTried && anyClientErrors && (
        <Alert>Please fill in all required fields correctly.</Alert>
      )}

      <form action={handleSubmit} className="space-y-8" noValidate>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Campus */}
          <div>
            <Label htmlFor="college" className="text-sm font-medium">
              Campus <span className="text-red-500">*</span>
            </Label>
            <Select
              value={college}
              onValueChange={(v) => {
                setCollege(v);
                if (clientTried)
                  setFieldErrors((prev) => ({
                    ...prev,
                    college: validateField("college", v),
                  }));
              }}
            >
              <SelectTrigger
                id="college"
                aria-invalid={!!fieldErrors.college}
                aria-required="true"
                aria-describedby={
                  fieldErrors.college ? "college-error" : undefined
                }
                className={fieldErrors.college ? errorClass : "mt-1.5"}
              >
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent>
                {COLLEGE_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {COLLEGE_META[c].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.college && (
              <ErrorText id="college-error">{fieldErrors.college}</ErrorText>
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
                  setFieldErrors((prev) => ({
                    ...prev,
                    term: validateField("term", v),
                  }));
              }}
            >
              <SelectTrigger
                id="term"
                aria-invalid={!!fieldErrors.term}
                aria-required="true"
                aria-describedby={fieldErrors.term ? "term-error" : undefined}
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
              <ErrorText id="term-error">{fieldErrors.term}</ErrorText>
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
                  setFieldErrors((prev) => ({
                    ...prev,
                    year: validateField("year", v),
                  }));
              }}
            >
              <SelectTrigger
                id="year"
                aria-invalid={!!fieldErrors.year}
                aria-required="true"
                aria-describedby={fieldErrors.year ? "year-error" : undefined}
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
              <ErrorText id="year-error">{fieldErrors.year}</ErrorText>
            )}
          </div>
        </div>

        <SubmitButton />
      </form>

      <div className="rounded-lg bg-gray-50 border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-sm font-medium text-gray-900">
            About Campus &amp; Term Selection
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            To avoid confusion, you can only have one active doorcard per campus
            per term. If one exists already you&apos;ll be guided to edit it.
          </p>
        </div>
      </div>
    </div>
  );
}
