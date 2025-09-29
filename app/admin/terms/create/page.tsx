"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, ArrowLeft, Plus } from "lucide-react";

const SEASONS = [
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
];

export default function CreateTermPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear().toString(),
    season: "",
    startDate: "",
    endDate: "",
    isActive: false,
    isUpcoming: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.season || !formData.startDate || !formData.endDate) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const termName = formData.name || `${formData.season} ${formData.year}`;

      const response = await fetch("/api/admin/terms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: termName,
          year: formData.year,
          season: formData.season,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          isActive: formData.isActive,
          isUpcoming: formData.isUpcoming,
        }),
      });

      if (response.ok) {
        router.push("/admin?tab=terms");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create term");
      }
    } catch (err) {
      console.error("Error creating term:", err);
      setError("An error occurred while creating the term");
    } finally {
      setLoading(false);
    }
  };

  const generateTermName = () => {
    if (formData.season && formData.year) {
      const seasonLabel = SEASONS.find(s => s.value === formData.season)?.label;
      return `${seasonLabel} ${formData.year}`;
    }
    return "";
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Create New Term</h1>
            <p className="text-gray-600">Add a new academic term to the system</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Term Details</CardTitle>
          <CardDescription>
            Configure the new academic term settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="season">Season *</Label>
                <Select
                  value={formData.season}
                  onValueChange={(value) =>
                    setFormData({ ...formData, season: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEASONS.map((season) => (
                      <SelectItem key={season.value} value={season.value}>
                        {season.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  min="2024"
                  max="2030"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">Custom Term Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={generateTermName() || "Enter custom name"}
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave blank to auto-generate: {generateTermName()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive" className="text-sm">
                  Make this the active term (will deactivate current active term)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUpcoming"
                  checked={formData.isUpcoming}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isUpcoming: checked as boolean })
                  }
                />
                <Label htmlFor="isUpcoming" className="text-sm">
                  Mark as upcoming term
                </Label>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Term
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}