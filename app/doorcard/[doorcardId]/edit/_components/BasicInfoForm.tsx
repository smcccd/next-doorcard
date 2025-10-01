"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  User,
  UserSquare2,
  Building2,
} from "lucide-react";
import { updateBasicInfo } from "@/app/doorcard/actions";
import { previewDoorcardTitle } from "@/lib/doorcard-title-generator";

interface Props {
  doorcard: {
    id: string;
    name?: string;
    doorcardName?: string;
    officeNumber?: string;
    term?: string;
    year?: string;
    college?: string;
  };
}

type FieldErrors = {
  name?: string;
  doorcardName?: string;
  officeNumber?: string;
};

const rules: Record<
  keyof FieldErrors,
  { min: number; max: number; label: string; required?: boolean }
> = {
  name: { min: 2, max: 100, label: "Full name", required: true },
  doorcardName: { min: 0, max: 50, label: "Subtitle", required: false },
  officeNumber: { min: 2, max: 100, label: "Office location", required: true },
};

function validateField(
  key: keyof FieldErrors,
  value: string
): string | undefined {
  const v = value.trim();
  const rule = rules[key];
  
  // Check if field is required
  if (rule.required && !v) {
    return `${rule.label} is required`;
  }
  
  // Skip validation for empty optional fields
  if (!rule.required && !v) {
    return undefined;
  }
  
  if (v.length < rule.min)
    return `${rule.label} must be at least ${rule.min} characters`;
  if (v.length > rule.max)
    return `${rule.label} must be under ${rule.max} characters`;
  return undefined;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : "Continue to Schedule"}
    </Button>
  );
}

export default function BasicInfoForm({ doorcard }: Props) {
  const [name, setName] = useState(doorcard.name || "");
  const [doorcardName, setDoorcardName] = useState(doorcard.doorcardName || "");
  const [officeNumber, setOfficeNumber] = useState(doorcard.officeNumber || "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  const [state, action] = useActionState(
    updateBasicInfo.bind(null, doorcard.id),
    { success: true } as { success: boolean; message?: string }
  );

  const handleChange = (field: keyof FieldErrors, value: string) => {
    if (field === "name") setName(value);
    if (field === "doorcardName") setDoorcardName(value);
    if (field === "officeNumber") setOfficeNumber(value);

    // Always validate for real-time feedback (but only show errors if touched)
    const fieldError = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: touched || prev[field] ? fieldError : undefined,
    }));
  };

  const handleSubmit = (fd: FormData) => {
    setTouched(true);
    const nextErrors: FieldErrors = {
      name: validateField("name", name),
      doorcardName: validateField("doorcardName", doorcardName),
      officeNumber: validateField("officeNumber", officeNumber),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    fd.set("name", name.trim());
    fd.set("doorcardName", doorcardName.trim());
    fd.set("officeNumber", officeNumber.trim());
    action(fd);
  };

  const anyClientError = Object.values(errors).some(Boolean);

  // Generate title preview
  const titlePreview = previewDoorcardTitle(
    name || "Your Name",
    doorcard.term,
    doorcard.year?.toString()
  );

  return (
    <div className="space-y-8">
      {/* Description */}
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
        <div>
          <p className="text-sm text-gray-900">
            Enter your details as they should appear on your doorcard.
          </p>
        </div>
      </div>

      {/* Title Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Generated Doorcard Title
            </h4>
            <p className="text-lg font-semibold text-blue-800">
              {titlePreview}
            </p>
            {doorcardName.trim() && (
              <p className="text-sm text-blue-700 mt-1">
                Subtitle: {doorcardName}
              </p>
            )}
            <p className="text-xs text-blue-600 mt-2">
              This title is automatically generated from your name, term, and year.
            </p>
          </div>
        </div>
      </div>

      {/* Server error */}
      {!state.success && state.message && <Alert message={state.message} />}

      {/* Client summary */}
      {touched && anyClientError && (
        <Alert message="Please correct the highlighted fields." />
      )}

      <form action={handleSubmit} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Full name */}
          <Field
            id="name"
            label="Full Name"
            icon={<User className="h-4 w-4 text-gray-400" />}
            value={name}
            placeholder="Dr. Jane Smith"
            error={errors.name}
            onChange={(v) => handleChange("name", v)}
            help="Your full name as you'd like it to appear"
            isValid={!validateField("name", name) && name.trim().length >= 2}
          />
          {/* Doorcard subtitle */}
          <Field
            id="doorcardName"
            label="Subtitle (optional)"
            icon={<UserSquare2 className="h-4 w-4 text-gray-400" />}
            value={doorcardName}
            placeholder="Office Hours, Teaching Schedule, etc."
            error={errors.doorcardName}
            onChange={(v) => handleChange("doorcardName", v)}
            help="Optional subtitle for your doorcard"
            isValid={
              !validateField("doorcardName", doorcardName)
            }
          />
          {/* Office location */}
          <div className="md:col-span-2">
            <Field
              id="officeNumber"
              label="Office Location"
              icon={<Building2 className="h-4 w-4 text-gray-400" />}
              value={officeNumber}
              placeholder="Building 1, Room 123"
              error={errors.officeNumber}
              onChange={(v) => handleChange("officeNumber", v)}
              help="Include building and room number"
              isValid={
                !validateField("officeNumber", officeNumber) &&
                officeNumber.trim().length >= 2
              }
            />
          </div>
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}

/* Small reusable field component */
function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon,
  error,
  help,
  isValid = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  error?: string;
  help?: string;
  isValid?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-900">
        {label} <span className="text-red-600">*</span>
        {isValid && (
          <span
            className="ml-2 inline-flex animate-in fade-in-50 slide-in-from-right-2 duration-300"
            aria-label={`${label} completed successfully`}
          >
            ✓
          </span>
        )}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {icon}
        </span>
        <Input
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-required="true"
          aria-describedby={
            error ? `${id}-error` : help ? `${id}-help` : undefined
          }
          className={`pl-10 transition-all duration-200 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : isValid
                ? "border-green-300 focus:border-green-500 focus:ring-green-100"
                : ""
          }`}
        />
        {isValid && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <CheckCircle2
              className="h-4 w-4 text-green-500 animate-in fade-in-50 zoom-in-95 duration-200"
              aria-label={`${label} validation passed`}
            />
          </span>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className="text-xs text-gray-600">
            {help}
          </p>
        )
      )}
    </div>
  );
}

function Alert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {message}
    </div>
  );
}
