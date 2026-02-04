"use client";

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarDays, Clock, Plus, X, AlertCircle } from "lucide-react";
import { updateTimeBlocks } from "@/app/doorcard/actions";
import { DAY_LABELS, sortDaysByCalendarOrder } from "@/lib/doorcard/doorcard-constants";
import type { AppointmentCategory, DayOfWeek } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/* Types / Constants                                                          */
/* -------------------------------------------------------------------------- */

interface TimeBlock {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  activity: string;
  location?: string;
  category: AppointmentCategory;
}

interface Props {
  doorcard: { id: string; timeBlocks: TimeBlock[] };
  draftId?: string;
}

const DAYS: DayOfWeek[] = sortDaysByCalendarOrder([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
const DAY_LABEL = DAY_LABELS;

const CATEGORY_OPTIONS: { value: AppointmentCategory; label: string }[] = [
  { value: "OFFICE_HOURS", label: "Office Hours" },
  { value: "IN_CLASS", label: "In Class" },
  { value: "LECTURE", label: "Lecture" },
  { value: "LAB", label: "Lab" },
  { value: "HOURS_BY_ARRANGEMENT", label: "Hours by Arrangement" },
  { value: "REFERENCE", label: "Reference" },
  { value: "OTHER", label: "Other" },
];

type BlockDraft = {
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  category: AppointmentCategory;
};
type Errors = {
  startTime?: string;
  endTime?: string;
  activity?: string;
  location?: string;
  category?: string;
  days?: string;
  conflict?: string;
};

/* -------------------------------------------------------------------------- */
/* Submit Button                                                              */
/* -------------------------------------------------------------------------- */
function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full">
      {pending ? "Saving…" : "Continue to Preview"}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Time Formatting Utility                                                   */
/* -------------------------------------------------------------------------- */
function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime12Hour(startTime)}–${formatTime12Hour(endTime)}`;
}

/* -------------------------------------------------------------------------- */
/* Conflict Detection Utility                                                */
/* -------------------------------------------------------------------------- */
function checkConflicts(
  days: DayOfWeek[],
  startTime: string,
  endTime: string,
  existingBlocks: TimeBlock[]
): string | null {
  for (const day of days) {
    const dayBlocks = existingBlocks.filter((b) => b.day === day);

    for (const block of dayBlocks) {
      // Check if times overlap
      if (
        (startTime >= block.startTime && startTime < block.endTime) ||
        (endTime > block.startTime && endTime <= block.endTime) ||
        (startTime <= block.startTime && endTime >= block.endTime)
      ) {
        return `Time conflict on ${DAY_LABEL[day]} with ${formatTimeRange(
          block.startTime,
          block.endTime
        )} ${block.activity}`;
      }
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export default function TimeBlockForm({ doorcard, draftId }: Props) {
  // Create a unique key for this doorcard's time blocks
  const storageKey = `doorcard-timeblocks-${doorcard.id}`;

  // Initialize blocks from localStorage if available, otherwise from doorcard
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved time blocks:", e);
        }
      }
    }
    return doorcard.timeBlocks || [];
  });

  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<"single" | "repeat">("single");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [draft, setDraft] = useState<BlockDraft>({
    startTime: "",
    endTime: "",
    activity: "",
    location: "",
    category: "OFFICE_HOURS",
  });
  const [errors, setErrors] = useState<Errors>({});

  const [serverState, serverAction] = useActionState(
    updateTimeBlocks.bind(null, doorcard.id),
    { success: true } as { success: boolean; message?: string }
  );

  // Save blocks to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(blocks));
    }
  }, [blocks, storageKey]);

  // Clear localStorage when navigating away or on successful submission
  useEffect(() => {
    // The updateTimeBlocks action redirects on success, so we need to clean up
    // localStorage when the component unmounts
    return () => {
      // Only clear if we're navigating away after a successful save
      // We can detect this by checking if we're on step 3 (preview)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("step") === "3") {
        localStorage.removeItem(storageKey);
      }
    };
  }, [storageKey]);

  /* ---------------------------------------------------------------------- */
  /* Validation                                                             */
  /* ---------------------------------------------------------------------- */
  const validate = (): Errors => {
    const e: Errors = {};
    if (!draft.startTime) e.startTime = "Start required";
    if (!draft.endTime) e.endTime = "End required";
    if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime)
      e.endTime = "End must be after start";
    if (draft.activity.trim().length < 1 && draft.category !== "OFFICE_HOURS")
      e.activity = "Activity required";
    if (draft.location.length > 100) e.location = "Location too long";
    if (selectedDays.length === 0) e.days = "Pick at least one day";

    // conflict detection
    if (!e.startTime && !e.endTime && !e.days) {
      const test = (d: DayOfWeek) =>
        blocks.some((b) => {
          if (editingId && b.id === editingId) return false;
          if (b.day !== d) return false;
          const overlap =
            (draft.startTime >= b.startTime && draft.startTime < b.endTime) ||
            (draft.endTime > b.startTime && draft.endTime <= b.endTime) ||
            (draft.startTime <= b.startTime && draft.endTime >= b.endTime);
          return overlap;
        });
      const conflictDay = selectedDays.find(test);
      if (conflictDay)
        e.conflict = `Time overlaps with existing block on ${DAY_LABEL[conflictDay]}`;
    }
    return e;
  };

  const reset = () => {
    setAdding(false);
    setEditingId(null);
    setSelectedDays([]);
    setDraft({
      startTime: "",
      endTime: "",
      activity: "",
      location: "",
      category: "OFFICE_HOURS",
    });
    setErrors({});
  };

  /* ---------------------------------------------------------------------- */
  /* CRUD                                                                   */
  /* ---------------------------------------------------------------------- */
  const handleAddOrUpdate = () => {
    const e = validate();
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    if (editingId) {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? {
                ...b,
                startTime: draft.startTime,
                endTime: draft.endTime,
                activity:
                  draft.category === "OFFICE_HOURS"
                    ? "Office Hours"
                    : draft.activity.trim(),
                location: draft.location.trim() || undefined,
                category: draft.category,
                day: selectedDays[0],
              }
            : b
        )
      );
    } else {
      const newOnes = selectedDays.map<TimeBlock>((d) => ({
        id: crypto.randomUUID(),
        day: d,
        startTime: draft.startTime,
        endTime: draft.endTime,
        activity:
          draft.category === "OFFICE_HOURS"
            ? "Office Hours"
            : draft.activity.trim(),
        location: draft.location.trim() || undefined,
        category: draft.category,
      }));
      setBlocks((prev) => [...prev, ...newOnes]);
    }
    reset();
  };

  const handleEdit = (b: TimeBlock) => {
    setMode("single");
    setEditingId(b.id);
    setSelectedDays([b.day]);
    setDraft({
      startTime: b.startTime,
      endTime: b.endTime,
      activity: b.category === "OFFICE_HOURS" ? "" : b.activity,
      location: b.location || "",
      category: b.category,
    });
    setEditModalOpen(true);
  };

  const handleRemove = (id: string) =>
    setBlocks((prev) => prev.filter((b) => b.id !== id));

  /* ---------------------------------------------------------------------- */
  /* Final submit                                                           */
  /* ---------------------------------------------------------------------- */
  const onSubmit = (fd: FormData) => {
    if (blocks.length === 0) {
      setErrors({ days: "Add at least one block first" });
      return;
    }
    fd.set("timeBlocks", JSON.stringify(blocks));
    serverAction(fd);
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <CalendarDays className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
        <div>
          <h3 className="font-medium text-gray-900">Weekly Schedule</h3>
          <p className="text-sm text-gray-500">
            Add office hours, classes, and other availability.
          </p>
        </div>
      </div>

      {/* Existing blocks */}
      {blocks.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No time blocks yet.
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((d) => {
            const dayBlocks = blocks
              .filter((b) => b.day === d)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (!dayBlocks.length) return null;
            return (
              <Card key={d}>
                <CardContent className="space-y-2 p-4">
                  <h4 className="font-medium">{DAY_LABEL[d]}</h4>
                  {dayBlocks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">
                          <Clock className="mr-1 inline h-4 w-4" />
                          {formatTimeRange(b.startTime, b.endTime)}
                        </div>
                        <div className="text-gray-600">
                          {b.activity}
                          {b.location && (
                            <span className="text-gray-400">
                              {" "}
                              – {b.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleEdit(b)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleRemove(b.id)}
                          aria-label={`Remove ${b.activity} time block`}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add buttons */}
      {!adding && (
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setAdding(true);
              setMode("single");
              setSelectedDays([DAYS[0]]);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Single Block
          </Button>
          <Button
            type="button"
            onClick={() => {
              setAdding(true);
              setMode("repeat");
              setSelectedDays([]);
            }}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Repeating Block
          </Button>
        </div>
      )}

      {/* Add/Edit form */}
      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                {editingId
                  ? "Edit Time Block"
                  : mode === "single"
                    ? "Add Single Block"
                    : "Add Repeating Block"}
              </h4>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={reset}
                aria-label="Close form"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            {/* Days */}
            <div>
              <Label htmlFor="day" className="mb-1 block">
                {mode === "single" ? "Day" : "Days"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {mode === "single" ? (
                <Select
                  value={selectedDays[0] || ""}
                  onValueChange={(v) => setSelectedDays([v as DayOfWeek])}
                >
                  <SelectTrigger
                    id="day"
                    aria-invalid={!!errors.days}
                    aria-required="true"
                    aria-describedby={errors.days ? "day-error" : undefined}
                    className={errors.days ? "border-red-500" : undefined}
                  >
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DAY_LABEL[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div
                  role="group"
                  aria-labelledby="day-label"
                  className="flex flex-wrap gap-2"
                >
                  {DAYS.map((d) => {
                    const active = selectedDays.includes(d);
                    return (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        onClick={() =>
                          setSelectedDays((prev) =>
                            active ? prev.filter((x) => x !== d) : [...prev, d]
                          )
                        }
                      >
                        {DAY_LABEL[d]}
                      </Button>
                    );
                  })}
                </div>
              )}
              {errors.days && (
                <p
                  id="day-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.days}
                </p>
              )}
            </div>

            {/* Times + category */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="startTime">
                      Start <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={draft.startTime}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, startTime: e.target.value }))
                      }
                      aria-invalid={!!errors.startTime}
                      aria-required="true"
                      aria-describedby={
                        errors.startTime ? "startTime-error" : undefined
                      }
                      className={errors.startTime ? "border-red-500" : ""}
                    />
                    {errors.startTime && (
                      <p
                        id="startTime-error"
                        role="alert"
                        className="mt-1 text-xs text-red-600"
                      >
                        {errors.startTime}
                      </p>
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="endTime">
                      End <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={draft.endTime}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, endTime: e.target.value }))
                      }
                      aria-invalid={!!errors.endTime}
                      aria-required="true"
                      aria-describedby={
                        errors.endTime ? "endTime-error" : undefined
                      }
                      className={errors.endTime ? "border-red-500" : ""}
                    />
                    {errors.endTime && (
                      <p
                        id="endTime-error"
                        role="alert"
                        className="mt-1 text-xs text-red-600"
                      >
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">
                    Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={draft.category}
                    onValueChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        category: v as AppointmentCategory,
                        activity: v === "OFFICE_HOURS" ? "" : d.activity,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="category"
                      aria-invalid={!!errors.category}
                      aria-required="true"
                      aria-describedby={
                        errors.category ? "category-error" : undefined
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="activity">
                    {draft.category === "OFFICE_HOURS"
                      ? "Title (optional)"
                      : "Activity / Course"}
                    {draft.category !== "OFFICE_HOURS" && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <Input
                    id="activity"
                    value={draft.activity}
                    placeholder={
                      draft.category === "OFFICE_HOURS"
                        ? "Office Hours"
                        : "e.g. MATH 101"
                    }
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, activity: e.target.value }))
                    }
                    aria-invalid={!!errors.activity}
                    aria-required={draft.category !== "OFFICE_HOURS"}
                    aria-describedby={
                      errors.activity ? "activity-error" : undefined
                    }
                    className={errors.activity ? "border-red-500" : ""}
                  />
                  {errors.activity && (
                    <p
                      id="activity-error"
                      role="alert"
                      className="mt-1 text-xs text-red-600"
                    >
                      {errors.activity}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location">
                    Location <span className="text-gray-400">(optional)</span>
                  </Label>
                  <Input
                    id="location"
                    value={draft.location}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, location: e.target.value }))
                    }
                    placeholder="Building / Room"
                    aria-invalid={!!errors.location}
                    aria-describedby={
                      errors.location ? "location-error" : undefined
                    }
                    className={errors.location ? "border-red-500" : ""}
                  />
                  {errors.location && (
                    <p
                      id="location-error"
                      role="alert"
                      className="mt-1 text-xs text-red-600"
                    >
                      {errors.location}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {errors.conflict && (
              <p role="alert" className="text-sm text-red-600">
                {errors.conflict}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                className="flex-1"
                onClick={handleAddOrUpdate}
              >
                {editingId
                  ? "Update Block"
                  : mode === "single"
                    ? "Add Block"
                    : "Add Blocks"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Server error */}
      {!serverState.success && serverState.message && (
        <div className="flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {serverState.message}
        </div>
      )}

      {/* Final submit */}
      {blocks.length > 0 && (
        <form action={onSubmit}>
          <SubmitButton disabled={blocks.length === 0} />
        </form>
      )}

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Time Block</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Day (read-only for edit) */}
            <div>
              <Label className="mb-1 block">Day</Label>
              <div className="text-sm font-medium bg-gray-50 rounded px-3 py-2">
                {selectedDays[0] ? DAY_LABEL[selectedDays[0]] : ""}
              </div>
            </div>

            {/* Times */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="modal-startTime">
                  Start <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="modal-startTime"
                  type="time"
                  value={draft.startTime}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, startTime: e.target.value }));
                    setErrors({});
                  }}
                  className={errors.startTime ? "border-red-500" : ""}
                />
                {errors.startTime && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.startTime}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="modal-endTime">
                  End <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="modal-endTime"
                  type="time"
                  value={draft.endTime}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, endTime: e.target.value }));
                    setErrors({});
                  }}
                  className={errors.endTime ? "border-red-500" : ""}
                />
                {errors.endTime && (
                  <p className="mt-1 text-xs text-red-600">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="modal-category">
                Type <span className="text-red-600">*</span>
              </Label>
              <Select
                value={draft.category}
                onValueChange={(v) => {
                  setDraft((d) => ({
                    ...d,
                    category: v as AppointmentCategory,
                    activity: v === "OFFICE_HOURS" ? "" : d.activity,
                  }));
                  setErrors({});
                }}
              >
                <SelectTrigger id="modal-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activity */}
            <div>
              <Label htmlFor="modal-activity">
                {draft.category === "OFFICE_HOURS"
                  ? "Title (optional)"
                  : "Activity / Course"}
                {draft.category !== "OFFICE_HOURS" && (
                  <span className="text-red-600">*</span>
                )}
              </Label>
              <Input
                id="modal-activity"
                value={draft.activity}
                placeholder={
                  draft.category === "OFFICE_HOURS"
                    ? "Office Hours"
                    : "e.g. MATH 101"
                }
                onChange={(e) => {
                  setDraft((d) => ({ ...d, activity: e.target.value }));
                  setErrors({});
                }}
                className={errors.activity ? "border-red-500" : ""}
              />
              {errors.activity && (
                <p className="mt-1 text-xs text-red-600">{errors.activity}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="modal-location">
                Location <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="modal-location"
                value={draft.location}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, location: e.target.value }));
                  setErrors({});
                }}
                placeholder="Building / Room"
              />
            </div>

            {errors.conflict && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {errors.conflict}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const validationErrors = validate();
                  setErrors(validationErrors);

                  if (Object.values(validationErrors).some(Boolean)) return;

                  // Update the block
                  setBlocks((prev) =>
                    prev.map((b) =>
                      b.id === editingId
                        ? {
                            ...b,
                            startTime: draft.startTime,
                            endTime: draft.endTime,
                            activity:
                              draft.category === "OFFICE_HOURS"
                                ? "Office Hours"
                                : draft.activity.trim(),
                            location: draft.location.trim() || undefined,
                            category: draft.category,
                          }
                        : b
                    )
                  );

                  setEditModalOpen(false);
                  reset();
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
