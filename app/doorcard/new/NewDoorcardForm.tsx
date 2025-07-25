"use client";

import { useActionState } from "react";
import { createDoorcardWithCampusTerm } from "@/app/doorcard/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

const TERM_OPTIONS = ["Fall", "Spring", "Summer", "Winter"] as const;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) =>
  (CURRENT_YEAR + i).toString()
);
const COLLEGES = ["SKYLINE", "CSM", "CANADA"] as const;

export default function NewDoorcardForm() {
  const [state, formAction] = useActionState(createDoorcardWithCampusTerm, {
    success: true,
  } as { success: boolean; message?: string });

  return (
    <form action={formAction} className="space-y-6">
      {!state.success && state.message && (
        <div className="flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Campus *</Label>
          <Select name="college" required>
            <SelectTrigger>
              <SelectValue placeholder="Select campus" />
            </SelectTrigger>
            <SelectContent>
              {COLLEGES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Term *</Label>
          <Select name="term" required>
            <SelectTrigger>
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
        </div>

        <div>
          <Label>Year *</Label>
          <Select name="year" required>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}
