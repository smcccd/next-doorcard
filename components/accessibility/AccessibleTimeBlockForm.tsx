"use client";

import { useState, useRef, useEffect } from "react";
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
import { CalendarDays, Clock, Plus, X, AlertCircle } from "lucide-react";
import { DAY_LABELS } from "@/lib/doorcard-constants";
import { ACCESSIBLE_CATEGORY_COLORS } from "@/lib/accessibility/color-contrast";
import { announceToScreenReader } from "@/lib/accessibility/focus-management";
import type { AppointmentCategory, DayOfWeek } from "@prisma/client";

interface TimeBlock {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  activity: string;
  location?: string;
  category: AppointmentCategory;
}

interface AccessibleTimeBlockFormProps {
  timeBlocks: TimeBlock[];
  onUpdate: (blocks: TimeBlock[]) => void;
  disabled?: boolean;
}

const DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
];

const CATEGORY_OPTIONS: { value: AppointmentCategory; label: string }[] = [
  { value: "OFFICE_HOURS", label: "Office Hours" },
  { value: "IN_CLASS", label: "In Class" },
  { value: "LECTURE", label: "Lecture" },
  { value: "LAB", label: "Lab" },
  { value: "HOURS_BY_ARRANGEMENT", label: "Hours by Arrangement" },
  { value: "REFERENCE", label: "Reference" },
];

export default function AccessibleTimeBlockForm({
  timeBlocks,
  onUpdate,
  disabled = false
}: AccessibleTimeBlockFormProps) {
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [activity, setActivity] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<AppointmentCategory>("OFFICE_HOURS");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Announce changes to time blocks
  useEffect(() => {
    const count = timeBlocks.length;
    const blockText = count === 1 ? "time block" : "time blocks";
    announceToScreenReader(`Schedule updated: ${count} ${blockText}`, 'polite');
  }, [timeBlocks.length]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selectedDays.length === 0) {
      newErrors.days = "Please select at least one day";
    }
    if (!activity.trim()) {
      newErrors.activity = "Activity name is required";
    }
    if (!startTime) {
      newErrors.startTime = "Start time is required";
    }
    if (!endTime) {
      newErrors.endTime = "End time is required";
    }
    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTimeBlock = () => {
    if (!validateForm()) {
      announceToScreenReader("Please correct the errors in the form", 'assertive');
      return;
    }

    const newBlocks = selectedDays.map(day => ({
      id: `${day}-${startTime}-${Date.now()}`,
      day,
      startTime,
      endTime,
      activity: activity.trim(),
      location: location.trim() || undefined,
      category,
    }));

    onUpdate([...timeBlocks, ...newBlocks]);

    // Reset form
    setSelectedDays([]);
    setActivity("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setCategory("OFFICE_HOURS");
    setErrors({});

    // Announce success
    const daysText = selectedDays.length === 1 ? selectedDays[0] : `${selectedDays.length} days`;
    announceToScreenReader(`Added ${activity} for ${daysText}`, 'assertive');

    // Focus back to first field for easy re-entry
    const firstField = formRef.current?.querySelector('input, select') as HTMLElement;
    firstField?.focus();
  };

  const handleRemoveTimeBlock = (blockId: string) => {
    const block = timeBlocks.find(b => b.id === blockId);
    onUpdate(timeBlocks.filter(b => b.id !== blockId));
    
    if (block) {
      announceToScreenReader(`Removed ${block.activity} on ${block.day}`, 'assertive');
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
    setErrors(prev => ({ ...prev, days: "" }));
  };

  const categoryColors = ACCESSIBLE_CATEGORY_COLORS[category];

  return (
    <div className="space-y-6">
      {/* Add Time Block Form */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium">Add Time Block</h3>
          </div>

          <form ref={formRef} className="space-y-4">
            {/* Day Selection */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700">
                Select Days <span className="text-red-500">*</span>
              </legend>
              <div 
                className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2"
                role="group"
                aria-describedby={errors.days ? "days-error" : undefined}
                aria-invalid={!!errors.days}
              >
                {DAYS.map(day => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      disabled={disabled}
                      className={`
                        px-3 py-2 text-sm font-medium rounded-md border transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${isSelected
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      aria-pressed={isSelected}
                      aria-describedby={`${day}-description`}
                    >
                      {DAY_LABELS[day]}
                      <span id={`${day}-description`} className="sr-only">
                        {isSelected ? "Selected" : "Not selected"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.days && (
                <p id="days-error" className="text-sm text-red-600" role="alert">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  {errors.days}
                </p>
              )}
            </fieldset>

            {/* Activity Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Activity Name */}
              <div>
                <Label htmlFor="activity" className="text-sm font-medium">
                  Activity Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="activity"
                  value={activity}
                  onChange={(e) => {
                    setActivity(e.target.value);
                    setErrors(prev => ({ ...prev, activity: "" }));
                  }}
                  disabled={disabled}
                  aria-invalid={!!errors.activity}
                  aria-describedby={errors.activity ? "activity-error" : undefined}
                  placeholder="e.g., MATH 100, Office Hours"
                  className="mt-1"
                />
                {errors.activity && (
                  <p id="activity-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.activity}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={(value: AppointmentCategory) => setCategory(value)}>
                  <SelectTrigger id="category" className="mt-1" disabled={disabled}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm border"
                            style={{ 
                              backgroundColor: ACCESSIBLE_CATEGORY_COLORS[option.value].background,
                              borderColor: ACCESSIBLE_CATEGORY_COLORS[option.value].border
                            }}
                            aria-hidden="true"
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time and Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Time */}
              <div>
                <Label htmlFor="startTime" className="text-sm font-medium">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setErrors(prev => ({ ...prev, startTime: "" }));
                  }}
                  disabled={disabled}
                  aria-invalid={!!errors.startTime}
                  aria-describedby={errors.startTime ? "startTime-error" : undefined}
                  className="mt-1"
                />
                {errors.startTime && (
                  <p id="startTime-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.startTime}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div>
                <Label htmlFor="endTime" className="text-sm font-medium">
                  End Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setErrors(prev => ({ ...prev, endTime: "" }));
                  }}
                  disabled={disabled}
                  aria-invalid={!!errors.endTime}
                  aria-describedby={errors.endTime ? "endTime-error" : undefined}
                  className="mt-1"
                />
                {errors.endTime && (
                  <p id="endTime-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.endTime}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-sm font-medium">
                  Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., Building 34, Room 101"
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              ref={addButtonRef}
              type="button"
              onClick={handleAddTimeBlock}
              disabled={disabled}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time Block
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Time Blocks */}
      {timeBlocks.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CalendarDays className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-medium">
                Current Schedule ({timeBlocks.length} time blocks)
              </h3>
            </div>

            <div className="space-y-3" role="list" aria-label="Current time blocks">
              {timeBlocks.map(block => {
                const colors = ACCESSIBLE_CATEGORY_COLORS[block.category];
                return (
                  <div
                    key={block.id}
                    role="listitem"
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{
                      backgroundColor: colors.background + '15', // 15% opacity
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-sm border"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        }}
                        aria-hidden="true"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {block.activity}
                        </div>
                        <div className="text-sm text-gray-600">
                          {DAY_LABELS[block.day]}, {block.startTime} - {block.endTime}
                          {block.location && ` • ${block.location}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTimeBlock(block.id)}
                      disabled={disabled}
                      aria-label={`Remove ${block.activity} on ${DAY_LABELS[block.day]}`}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}