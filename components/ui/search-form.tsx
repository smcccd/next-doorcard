"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Clock, Calendar, Building2 } from "lucide-react";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { type AutocompleteSuggestion } from "@/hooks/useSearchAutocomplete";
import { getAllDepartments } from "@/lib/departments";
import { ActiveTermInfo } from "@/lib/active-term";
import { College } from "@/types/doorcard";
import { DayOfWeek } from "@prisma/client";
import CollegeLogo from "@/components/CollegeLogo";

interface SearchFormProps {
  searchTerm: string;
  selectedCampus: College | "ALL";
  selectedDepartment: string;
  selectedDay: DayOfWeek | "ALL";
  showCurrentTermOnly: boolean;
  showAutocomplete: boolean;
  suggestions: AutocompleteSuggestion[];
  activeTerm: ActiveTermInfo | null;
  termLoading: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onCampusChange: (value: College | "ALL") => void;
  onDepartmentChange: (value: string) => void;
  onDayChange: (value: DayOfWeek | "ALL") => void;
  onTermToggleChange: (showCurrentOnly: boolean) => void;
  onAutocompleteSelect: (suggestion: AutocompleteSuggestion) => void;
  onAutocompleteClose: () => void;
}

export function SearchForm({
  searchTerm,
  selectedCampus,
  selectedDepartment,
  selectedDay,
  showCurrentTermOnly,
  showAutocomplete,
  suggestions,
  activeTerm,
  onSearchChange,
  onSearchFocus,
  onCampusChange,
  onDepartmentChange,
  onDayChange,
  onTermToggleChange,
  onAutocompleteSelect,
  onAutocompleteClose,
}: SearchFormProps) {
  return (
    <div className="max-w-5xl mx-auto -mt-16 space-y-4">
      <Card className="border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 shadow-2xl relative backdrop-blur-sm">
        <CardHeader className="pb-6 pt-8">
          <h2 className="font-bold leading-none tracking-tight flex items-center gap-3 text-xl sm:text-2xl">
            <Search className="h-6 w-6 text-blue-500 dark:text-blue-400" />
            Search for Your Professor
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-100 mt-2">
            Enter your professor&apos;s name, browse by campus, or filter by department
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="professor-search" className="sr-only">
                Search for professor
              </label>
              <Input
                id="professor-search"
                placeholder="Type professor's name (e.g., John Smith, Dr. Johnson)..."
                aria-label="Search for professor by name"
                value={searchTerm}
                onChange={onSearchChange}
                onFocus={onSearchFocus}
                className="w-full text-lg py-5 px-5 border-2 border-blue-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 bg-white dark:bg-gray-700 dark:border-blue-400 dark:text-gray-100 dark:focus:border-blue-300 dark:focus:ring-blue-800/50 dark:placeholder:text-gray-300 rounded-lg shadow-md font-medium"
              />
              <SearchAutocomplete
                suggestions={suggestions}
                isVisible={showAutocomplete}
                onSelect={onAutocompleteSelect}
                onClose={onAutocompleteClose}
              />
            </div>
            <div>
              <fieldset>
                <legend className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Campus:
                </legend>
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: "ALL", label: "All Campuses" },
                    { value: "SKYLINE", label: "Skyline" },
                    { value: "CSM", label: "CSM" },
                    { value: "CANADA", label: "Cañada" }
                  ].map((campus) => (
                    <label
                      key={campus.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="campus"
                        value={campus.value}
                        checked={selectedCampus === campus.value}
                        onChange={(e) => onCampusChange(e.target.value as College | "ALL")}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      {campus.value !== "ALL" && (
                        <CollegeLogo 
                          college={campus.value as College} 
                          height={18}
                          className="flex-shrink-0"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{campus.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Department:
              </p>
              <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
                <SelectTrigger className="w-full h-12 text-base bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {getAllDepartments().map((dept) => (
                    <SelectItem key={dept.code} value={dept.code}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Available On:
              </p>
              <Select
                value={selectedDay}
                onValueChange={(value) => onDayChange(value as DayOfWeek | "ALL")}
              >
                <SelectTrigger className="w-full h-12 text-base bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="ALL">Any Day</SelectItem>
                  <SelectItem value="MONDAY">Monday</SelectItem>
                  <SelectItem value="TUESDAY">Tuesday</SelectItem>
                  <SelectItem value="WEDNESDAY">Wednesday</SelectItem>
                  <SelectItem value="THURSDAY">Thursday</SelectItem>
                  <SelectItem value="FRIDAY">Friday</SelectItem>
                  <SelectItem value="SATURDAY">Saturday</SelectItem>
                  <SelectItem value="SUNDAY">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeTerm && (
              <div>
                <fieldset>
                  <legend className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span>Showing Results For:</span>
                  </legend>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="term-filter"
                        value="current"
                        checked={showCurrentTermOnly}
                        onChange={() => onTermToggleChange(true)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activeTerm.displayName} (Current)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="term-filter"
                        value="all"
                        checked={!showCurrentTermOnly}
                        onChange={() => onTermToggleChange(false)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        All Terms
                      </span>
                    </label>
                  </div>
                </fieldset>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}