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
  { min: number; max: number; label: string }
> = {
  name: { min: 2, max: 100, label: "Full name" },
  doorcardName: { min: 2, max: 50, label: "Doorcard name" },
  officeNumber: { min: 2, max: 100, label: "Office location" },
};

function validateField(
  key: keyof FieldErrors,
  value: string
): string | undefined {
  const v = value.trim();
  if (!v) return `${rules[key].label} is required`;
  if (v.length < rules[key].min)
    return `${rules[key].label} must be at least ${rules[key].min} characters`;
  if (v.length > rules[key].max)
    return `${rules[key].label} must be under ${rules[key].max} characters`;
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
    if (touched || errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
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

  return (
    <div className="space-y-8">
      {/* Description */}
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
        <div>
          <h3 className="font-medium text-gray-900">Enter Your Information</h3>
          <p className="text-sm text-gray-500">
            These details appear on the public doorcard.
          </p>
        </div>
      </div>

      {/* Context banner */}
      {doorcard.college && doorcard.term && doorcard.year && (
        <div className="flex items-center gap-2 rounded border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Building2 className="h-4 w-4" />
          {doorcard.college} — {doorcard.term} {doorcard.year}
        </div>
      )}

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
          />
          {/* Doorcard name */}
          <Field
            id="doorcardName"
            label="Doorcard Name"
            icon={<UserSquare2 className="h-4 w-4 text-gray-400" />}
            value={doorcardName}
            placeholder="Prof. Smith"
            error={errors.doorcardName}
            onChange={(v) => handleChange("doorcardName", v)}
            help="How students should address you"
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  error?: string;
  help?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-900">
        {label} <span className="text-red-500">*</span>
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
          className={`pl-10 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        help && <p className="text-xs text-gray-500">{help}</p>
      )}
    </div>
  );
}

function Alert({ message }: { message: string }) {
  return (
    <div className="flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" /> {message}
    </div>
  );
}
