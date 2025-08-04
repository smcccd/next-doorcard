"use client";

import { useCallback, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createDoorcardWithCampusTerm,
  validateCampusTerm,
} from "@/app/doorcard/actions";
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

const TERM_OPTIONS = ["Fall", "Spring", "Summer"] as const;
const COLLEGE_OPTIONS = Object.keys(COLLEGE_META) as College[];
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
type ActionState = { success: boolean; message?: string };

interface Props {
  /** If undefined => new doorcard flow */
  doorcard?: { id: string; college?: string; term?: string; year?: string };
  /** User's college from profile for pre-filling */
  userCollege?: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Validating…" : "Continue to Basic Info"}
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

export default function CampusTermForm({ doorcard, userCollege }: Props) {
  const existingYear = doorcard?.year;
  const YEAR_OPTIONS =
    existingYear && !BASE_YEARS.includes(existingYear)
      ? [existingYear, ...BASE_YEARS]
      : BASE_YEARS;

  const [college, setCollege] = useState<College | "">(
    (doorcard?.college as College) ?? (userCollege as College) ?? ""
  );
  const [term, setTerm] = useState(doorcard?.term ?? "");
  const [year, setYear] = useState(existingYear ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [clientTried, setClientTried] = useState(false);

  // Stable server action that doesn't change identity
  const stableActionFn = useCallback(
    (prev: ActionState, formData: FormData) => {
      if (doorcard) {
        return validateCampusTerm(doorcard.id, prev, formData); // edit flow
      } else {
        return createDoorcardWithCampusTerm(prev, formData); // new flow
      }
    },
    [doorcard] // Include the entire doorcard object as required by the dependency
  );

  const [state, serverAction] = useActionState<ActionState, FormData>(
    stableActionFn,
    { success: true }
  );

  const validateField = (
    name: keyof FieldErrors,
    value: string
  ): string | undefined => {
    if (!value) return "Required";
    if (name === "college" && !COLLEGE_OPTIONS.includes(value as College))
      return "Invalid campus";
    if (name === "term" && !TERM_OPTIONS.includes(value as any))
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
    e.preventDefault();
    setClientTried(true);
    const errs = validateAll();
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    const formData = new FormData();
    formData.set("college", college);
    formData.set("term", term);
    formData.set("year", year);
    serverAction(formData);
  };

  const anyClientErrors = Object.values(fieldErrors).some(Boolean);
  const errorClass =
    "mt-1.5 border-red-300 focus:ring-red-500 focus:border-red-500";

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            {doorcard ? "Edit Campus & Term" : "Select Campus & Term"}
          </h2>
          <p className="text-sm text-gray-500">
            One doorcard per campus per term.{" "}
            {doorcard ? "Update if needed." : "Choose where this one applies."}
          </p>
        </div>
      </div>

      {!state?.success && state?.message && <Alert>{state.message}</Alert>}
      {clientTried && anyClientErrors && (
        <Alert>Please fill in all required fields correctly.</Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <fieldset className="border border-gray-200 rounded-lg p-6">
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
                  setCollege(v as College);
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
                      {COLLEGE_META[c].label}
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
                  aria-describedby={fieldErrors.term ? "term-error" : undefined}
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
                  aria-describedby={fieldErrors.year ? "year-error" : undefined}
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
    </div>
  );
}
