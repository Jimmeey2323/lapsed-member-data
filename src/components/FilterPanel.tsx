import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  Filter,
  Search,
  X,
  ChevronDown,
  MapPin,
  CheckCircle2,
  Calendar,
  CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterState, DateRangePreset } from "@/types/member";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableStatuses: string[];
  availableLocations: string[];
  availableMemberships: string[];
}

const DATE_PRESETS: DateRangePreset[] = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This Month", days: -1 },
  { label: "Last Month", days: -2 },
  { label: "All Time", days: null },
];

const FilterPanel = ({
  filters,
  onFiltersChange,
  availableStatuses,
  availableLocations,
  availableMemberships,
}: FilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("All Time");

  const activeFiltersCount = useMemo(() => {
    return filters.status.length +
      filters.location.length +
      filters.membershipName.length +
      (filters.searchQuery ? 1 : 0) +
      (filters.dateRange.start || filters.dateRange.end ? 1 : 0);
  }, [filters]);

  const toggleFilter = (
    key: keyof Pick<FilterState, "status" | "location" | "membershipName">,
    value: string
  ) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const applyDatePreset = (preset: DateRangePreset) => {
    setSelectedPreset(preset.label);
    
    if (preset.days === null) {
      onFiltersChange({ ...filters, dateRange: { start: "", end: "" } });
      return;
    }

    const today = new Date();
    let start: Date;
    let end: Date = today;

    if (preset.days === 0) {
      start = today;
    } else if (preset.days === -1) {
      // This month
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else if (preset.days === -2) {
      // Last month
      const lastMonth = subMonths(today, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
    } else {
      start = subDays(today, preset.days);
    }

    onFiltersChange({
      ...filters,
      dateRange: {
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
      },
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      location: [],
      membershipName: [],
      dateRange: { start: "", end: "" },
      searchQuery: "",
    });
    setSelectedPreset("All Time");
  };

  const FilterSection = ({
    title,
    icon: Icon,
    sectionKey,
    options,
    selected,
    filterKey,
  }: {
    title: string;
    icon: React.ElementType;
    sectionKey: string;
    options: string[];
    selected: string[];
    filterKey: keyof Pick<FilterState, "status" | "location" | "membershipName">;
  }) => (
    <div className="space-y-2">
      <button
        onClick={() => setOpenSection(openSection === sectionKey ? null : sectionKey)}
        className="flex items-center justify-between w-full p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon size={14} className="text-primary" />
          {title}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs h-5 min-w-[20px] px-1.5">
              {selected.length}
            </Badge>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${
            openSection === sectionKey ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {openSection === sectionKey && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-1 bg-background rounded-lg max-h-40 overflow-y-auto scrollbar-thin border border-border">
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      selected.includes(option)
                        ? "bg-primary border-primary"
                        : "border-border"
                    }`}
                  >
                    {selected.includes(option) && (
                      <CheckCircle2 size={10} className="text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-xs text-foreground truncate">{option}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Search and Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search members..."
            value={filters.searchQuery}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchQuery: e.target.value })
            }
            className="pl-9 h-9 text-sm bg-background border-border focus:border-primary"
          />
        </div>

        {/* Date Range Quick Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {DATE_PRESETS.slice(0, 4).map((preset) => (
            <Button
              key={preset.label}
              variant={selectedPreset === preset.label ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => applyDatePreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <CalendarRange size={14} />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">Select Date Range</p>
              </div>
              <div className="flex">
                <div className="p-2 border-r border-border">
                  <p className="text-xs text-muted-foreground mb-2 px-2">Start Date</p>
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateRange.start ? new Date(filters.dateRange.start) : undefined}
                    onSelect={(date) => {
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          start: date ? format(date, "yyyy-MM-dd") : "",
                        },
                      });
                      setSelectedPreset("Custom");
                    }}
                    className="pointer-events-auto"
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs text-muted-foreground mb-2 px-2">End Date</p>
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateRange.end ? new Date(filters.dateRange.end) : undefined}
                    onSelect={(date) => {
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          end: date ? format(date, "yyyy-MM-dd") : "",
                        },
                      });
                      setSelectedPreset("Custom");
                    }}
                    className="pointer-events-auto"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant={isExpanded ? "secondary" : "outline"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 gap-1.5"
        >
          <Filter size={14} />
          Filters
          {activeFiltersCount > 0 && (
            <Badge className="ml-1 bg-primary text-primary-foreground h-5 min-w-[20px] px-1.5">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <X size={14} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-1.5"
        >
          {filters.dateRange.start && (
            <Badge
              variant="secondary"
              className="gap-1 px-2 py-0.5 text-xs cursor-pointer hover:bg-muted"
              onClick={() => {
                onFiltersChange({ ...filters, dateRange: { start: "", end: "" } });
                setSelectedPreset("All Time");
              }}
            >
              {filters.dateRange.start} - {filters.dateRange.end || "Now"}
              <X size={10} />
            </Badge>
          )}
          {filters.status.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="gap-1 px-2 py-0.5 text-xs cursor-pointer hover:bg-muted"
              onClick={() => toggleFilter("status", status)}
            >
              {status}
              <X size={10} />
            </Badge>
          ))}
          {filters.location.map((location) => (
            <Badge
              key={location}
              variant="secondary"
              className="gap-1 px-2 py-0.5 text-xs cursor-pointer hover:bg-muted"
              onClick={() => toggleFilter("location", location)}
            >
              {location.length > 20 ? `${location.slice(0, 20)}...` : location}
              <X size={10} />
            </Badge>
          ))}
          {filters.membershipName.map((name) => (
            <Badge
              key={name}
              variant="secondary"
              className="gap-1 px-2 py-0.5 text-xs cursor-pointer hover:bg-muted"
              onClick={() => toggleFilter("membershipName", name)}
            >
              {name.length > 25 ? `${name.slice(0, 25)}...` : name}
              <X size={10} />
            </Badge>
          ))}
        </motion.div>
      )}

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-lg glass-card space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FilterSection
                  title="Status"
                  icon={CheckCircle2}
                  sectionKey="status"
                  options={availableStatuses}
                  selected={filters.status}
                  filterKey="status"
                />
                <FilterSection
                  title="Location"
                  icon={MapPin}
                  sectionKey="location"
                  options={availableLocations}
                  selected={filters.location}
                  filterKey="location"
                />
                <FilterSection
                  title="Membership"
                  icon={Calendar}
                  sectionKey="membership"
                  options={availableMemberships}
                  selected={filters.membershipName}
                  filterKey="membershipName"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPanel;