import { Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FilterState {
  duration: string[];
  level: string[];
  skills: string[];
  type: string[];
}

interface OpportunityFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const DURATION_OPTIONS = [
  { value: "1_week", label: "1 week" },
  { value: "2_weeks", label: "2 weeks" },
  { value: "3_weeks", label: "3 weeks" },
  { value: "1_month_plus", label: "1 month+" },
];

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const SKILL_OPTIONS = [
  "React",
  "Python",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "MongoDB",
  "UI/UX",
  "Figma",
  "TensorFlow",
  "Express",
];

const TYPE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
];

export function OpportunityFilters({ filters, onFilterChange }: OpportunityFiltersProps) {
  const toggleFilter = (category: keyof FilterState, value: string) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [category]: updated });
  };

  const clearFilters = () => {
    onFilterChange({
      duration: [],
      level: [],
      skills: [],
      type: [],
    });
  };

  const hasFilters = Object.values(filters).some((arr) => arr.length > 0);

  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-24 rounded-lg border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Filters</h3>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Duration</h4>
          <div className="space-y-2">
            {DURATION_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`duration-${option.value}`}
                  checked={filters.duration.includes(option.value)}
                  onCheckedChange={() => toggleFilter("duration", option.value)}
                />
                <Label
                  htmlFor={`duration-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Level */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Level</h4>
          <div className="space-y-2">
            {LEVEL_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`level-${option.value}`}
                  checked={filters.level.includes(option.value)}
                  onCheckedChange={() => toggleFilter("level", option.value)}
                />
                <Label
                  htmlFor={`level-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Skills */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Skills</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {SKILL_OPTIONS.map((skill) => (
              <div key={skill} className="flex items-center space-x-2">
                <Checkbox
                  id={`skill-${skill}`}
                  checked={filters.skills.includes(skill)}
                  onCheckedChange={() => toggleFilter("skills", skill)}
                />
                <Label
                  htmlFor={`skill-${skill}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {skill}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Type */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Type</h4>
          <div className="space-y-2">
            {TYPE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${option.value}`}
                  checked={filters.type.includes(option.value)}
                  onCheckedChange={() => toggleFilter("type", option.value)}
                />
                <Label
                  htmlFor={`type-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {hasFilters && (
          <>
            <Separator className="my-4" />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
